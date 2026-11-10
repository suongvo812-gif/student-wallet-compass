-- ===== ROLES =====
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT public.has_role(auth.uid(), 'admin')
$$;
REVOKE EXECUTE ON FUNCTION public.is_admin() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated, service_role;

CREATE POLICY "Own roles select" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admins select roles" ON public.user_roles FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Every account gets "user"; the main administrator email gets "admin" only once verified.
CREATE OR REPLACE FUNCTION public.assign_user_roles()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'user') ON CONFLICT (user_id, role) DO NOTHING;
  IF lower(NEW.email) = 'suongvo812@gmail.com' AND NEW.email_confirmed_at IS NOT NULL THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'admin') ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
  RETURN NEW;
END; $$;
REVOKE EXECUTE ON FUNCTION public.assign_user_roles() FROM PUBLIC, anon, authenticated;
CREATE TRIGGER on_auth_user_roles AFTER INSERT OR UPDATE OF email, email_confirmed_at ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.assign_user_roles();

-- Backfill roles for accounts that already exist.
INSERT INTO public.user_roles (user_id, role) SELECT id, 'user' FROM auth.users ON CONFLICT (user_id, role) DO NOTHING;
INSERT INTO public.user_roles (user_id, role)
  SELECT id, 'admin' FROM auth.users WHERE lower(email) = 'suongvo812@gmail.com' AND email_confirmed_at IS NOT NULL
  ON CONFLICT (user_id, role) DO NOTHING;

-- ===== ACTIVITY EVENTS (no amounts, no secrets) =====
CREATE TABLE public.activity_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid DEFAULT auth.uid(),
  visitor_id text NOT NULL CHECK (char_length(visitor_id) BETWEEN 8 AND 64),
  session_id text NOT NULL CHECK (char_length(session_id) BETWEEN 8 AND 64),
  event text NOT NULL CHECK (event IN ('session_start','page_view','heartbeat','sign_in','sign_out','feature_use')),
  feature text CHECK (feature IS NULL OR feature IN ('income','expense','budget','card')),
  action text CHECK (action IS NULL OR action IN ('create','update','delete')),
  path text CHECK (path IS NULL OR char_length(path) <= 200),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX activity_events_created_idx ON public.activity_events (created_at);
CREATE INDEX activity_events_user_idx ON public.activity_events (user_id, created_at);
CREATE INDEX activity_events_session_idx ON public.activity_events (session_id);

-- Insert-only for visitors/users (created_at always set by the server); only admins can read.
GRANT INSERT (user_id, visitor_id, session_id, event, feature, action, path) ON public.activity_events TO anon, authenticated;
GRANT SELECT ON public.activity_events TO authenticated;
GRANT ALL ON public.activity_events TO service_role;
ALTER TABLE public.activity_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Visitors log anonymous events" ON public.activity_events FOR INSERT TO anon WITH CHECK (user_id IS NULL);
CREATE POLICY "Users log own events" ON public.activity_events FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Admins read events" ON public.activity_events FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- ===== ADMIN ANALYTICS (admin-only, checked inside every function) =====
CREATE OR REPLACE FUNCTION public.admin_overview(p_from timestamptz, p_to timestamptz)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE r jsonb;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'forbidden' USING ERRCODE = '42501';
  END IF;
  WITH ev AS (
    SELECT * FROM public.activity_events WHERE created_at >= p_from AND created_at < p_to
  ), sess AS (
    SELECT session_id, extract(epoch FROM max(created_at) - min(created_at)) AS secs FROM ev GROUP BY session_id
  ), known AS (
    SELECT DISTINCT visitor_id FROM ev WHERE user_id IS NOT NULL
  )
  SELECT jsonb_build_object(
    'total_accounts', (SELECT count(*) FROM auth.users),
    'verified_accounts', (SELECT count(*) FROM auth.users WHERE email_confirmed_at IS NOT NULL),
    'new_accounts', (SELECT count(*) FROM auth.users WHERE created_at >= p_from AND created_at < p_to),
    'unique_visitors', (SELECT count(DISTINCT visitor_id) FROM ev),
    'anonymous_visitors', (SELECT count(DISTINCT visitor_id) FROM ev WHERE user_id IS NULL AND visitor_id NOT IN (SELECT visitor_id FROM known)),
    'logged_in_users', (SELECT count(DISTINCT user_id) FROM ev WHERE user_id IS NOT NULL),
    'visits', (SELECT count(*) FROM sess),
    'page_views', (SELECT count(*) FROM ev WHERE event = 'page_view'),
    'sign_ins', (SELECT count(*) FROM ev WHERE event = 'sign_in'),
    'sign_outs', (SELECT count(*) FROM ev WHERE event = 'sign_out'),
    'avg_session_seconds', (SELECT COALESCE(round(avg(secs)), 0) FROM sess),
    'total_session_seconds', (SELECT COALESCE(round(sum(secs)), 0) FROM sess),
    'dau', (SELECT count(DISTINCT user_id) FROM public.activity_events WHERE user_id IS NOT NULL AND created_at >= p_to - interval '1 day' AND created_at < p_to),
    'wau', (SELECT count(DISTINCT user_id) FROM public.activity_events WHERE user_id IS NOT NULL AND created_at >= p_to - interval '7 days' AND created_at < p_to),
    'mau', (SELECT count(DISTINCT user_id) FROM public.activity_events WHERE user_id IS NOT NULL AND created_at >= p_to - interval '30 days' AND created_at < p_to),
    'income_users', (SELECT count(DISTINCT u) FROM (
        SELECT user_id AS u FROM public.transactions WHERE type = 'income' AND (created_at >= p_from AND created_at < p_to OR updated_at >= p_from AND updated_at < p_to)
        UNION SELECT user_id FROM ev WHERE event = 'feature_use' AND feature = 'income') x WHERE u IS NOT NULL),
    'expense_users', (SELECT count(DISTINCT u) FROM (
        SELECT user_id AS u FROM public.transactions WHERE type = 'expense' AND (created_at >= p_from AND created_at < p_to OR updated_at >= p_from AND updated_at < p_to)
        UNION SELECT user_id FROM ev WHERE event = 'feature_use' AND feature = 'expense') x WHERE u IS NOT NULL),
    'budget_users', (SELECT count(DISTINCT u) FROM (
        SELECT user_id AS u FROM public.budgets WHERE created_at >= p_from AND created_at < p_to OR updated_at >= p_from AND updated_at < p_to
        UNION SELECT user_id FROM ev WHERE event = 'feature_use' AND feature = 'budget') x WHERE u IS NOT NULL),
    'income_users_all', (SELECT count(DISTINCT user_id) FROM public.transactions WHERE type = 'income'),
    'expense_users_all', (SELECT count(DISTINCT user_id) FROM public.transactions WHERE type = 'expense'),
    'budget_users_all', (SELECT count(DISTINCT user_id) FROM public.budgets),
    'tracking_since', (SELECT min(created_at) FROM public.activity_events)
  ) INTO r;
  RETURN r;
END; $$;

CREATE OR REPLACE FUNCTION public.admin_daily(p_from timestamptz, p_to timestamptz, p_tz text DEFAULT 'UTC')
RETURNS TABLE(day date, visitors bigint, visits bigint, active_users bigint, page_views bigint, sign_ins bigint, sign_outs bigint, new_accounts bigint, avg_session_seconds numeric)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
#variable_conflict use_column
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'forbidden' USING ERRCODE = '42501';
  END IF;
  RETURN QUERY
  WITH days AS (
    SELECT g::date AS d FROM generate_series((p_from AT TIME ZONE p_tz)::date, ((p_to - interval '1 second') AT TIME ZONE p_tz)::date, interval '1 day') AS g
  ), ev AS (
    SELECT e.visitor_id, e.user_id, e.session_id, e.event, e.created_at, (e.created_at AT TIME ZONE p_tz)::date AS d
    FROM public.activity_events e WHERE e.created_at >= p_from AND e.created_at < p_to
  ), sess AS (
    SELECT ev.session_id, min(ev.d) AS d, extract(epoch FROM max(ev.created_at) - min(ev.created_at)) AS secs FROM ev GROUP BY ev.session_id
  ), usr AS (
    SELECT (u.created_at AT TIME ZONE p_tz)::date AS d, count(*) AS c FROM auth.users u
    WHERE u.created_at >= p_from AND u.created_at < p_to GROUP BY 1
  )
  SELECT days.d,
    (SELECT count(DISTINCT ev.visitor_id) FROM ev WHERE ev.d = days.d),
    (SELECT count(*) FROM sess WHERE sess.d = days.d),
    (SELECT count(DISTINCT ev.user_id) FROM ev WHERE ev.d = days.d AND ev.user_id IS NOT NULL),
    (SELECT count(*) FROM ev WHERE ev.d = days.d AND ev.event = 'page_view'),
    (SELECT count(*) FROM ev WHERE ev.d = days.d AND ev.event = 'sign_in'),
    (SELECT count(*) FROM ev WHERE ev.d = days.d AND ev.event = 'sign_out'),
    COALESCE((SELECT usr.c FROM usr WHERE usr.d = days.d), 0)::bigint,
    COALESCE((SELECT round(avg(sess.secs)) FROM sess WHERE sess.d = days.d), 0)::numeric
  FROM days ORDER BY days.d;
END; $$;

CREATE OR REPLACE FUNCTION public.admin_users(p_from timestamptz, p_to timestamptz, p_search text DEFAULT NULL)
RETURNS TABLE(user_id uuid, email text, full_name text, created_at timestamptz, email_verified boolean, last_sign_in_at timestamptz, is_admin boolean, visits bigint, page_views bigint, sign_ins bigint, total_session_seconds numeric, avg_session_seconds numeric, last_active timestamptz, income_records bigint, expense_records bigint, budget_count bigint)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
#variable_conflict use_column
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'forbidden' USING ERRCODE = '42501';
  END IF;
  RETURN QUERY
  WITH ev AS (
    SELECT e.user_id AS uid, e.session_id, e.event, e.created_at FROM public.activity_events e
    WHERE e.user_id IS NOT NULL AND e.created_at >= p_from AND e.created_at < p_to
  ), sess AS (
    SELECT ev.uid, ev.session_id, extract(epoch FROM max(ev.created_at) - min(ev.created_at)) AS secs FROM ev GROUP BY ev.uid, ev.session_id
  )
  SELECT u.id, u.email::text, COALESCE(p.full_name, ''), u.created_at, u.email_confirmed_at IS NOT NULL, u.last_sign_in_at,
    EXISTS (SELECT 1 FROM public.user_roles r WHERE r.user_id = u.id AND r.role = 'admin'),
    (SELECT count(*) FROM sess WHERE sess.uid = u.id),
    (SELECT count(*) FROM ev WHERE ev.uid = u.id AND ev.event = 'page_view'),
    (SELECT count(*) FROM ev WHERE ev.uid = u.id AND ev.event = 'sign_in'),
    COALESCE((SELECT round(sum(sess.secs)) FROM sess WHERE sess.uid = u.id), 0)::numeric,
    COALESCE((SELECT round(avg(sess.secs)) FROM sess WHERE sess.uid = u.id), 0)::numeric,
    (SELECT max(a.created_at) FROM public.activity_events a WHERE a.user_id = u.id),
    (SELECT count(*) FROM public.transactions t WHERE t.user_id = u.id AND t.type = 'income'),
    (SELECT count(*) FROM public.transactions t WHERE t.user_id = u.id AND t.type = 'expense'),
    (SELECT count(*) FROM public.budgets b WHERE b.user_id = u.id)
  FROM auth.users u
  LEFT JOIN public.profiles p ON p.id = u.id
  WHERE p_search IS NULL OR btrim(p_search) = '' OR strpos(lower(u.email), lower(btrim(p_search))) > 0
  ORDER BY u.created_at DESC
  LIMIT 2000;
END; $$;

CREATE OR REPLACE FUNCTION public.admin_auth_events(p_from timestamptz, p_to timestamptz, p_limit integer DEFAULT 100)
RETURNS TABLE(event text, email text, occurred_at timestamptz)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
#variable_conflict use_column
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'forbidden' USING ERRCODE = '42501';
  END IF;
  RETURN QUERY
  SELECT x.event, x.email, x.occurred_at FROM (
    SELECT e.event AS event, u.email::text AS email, e.created_at AS occurred_at
    FROM public.activity_events e JOIN auth.users u ON u.id = e.user_id
    WHERE e.event IN ('sign_in', 'sign_out') AND e.created_at >= p_from AND e.created_at < p_to
    UNION ALL
    SELECT 'sign_up', u.email::text, u.created_at FROM auth.users u WHERE u.created_at >= p_from AND u.created_at < p_to
  ) x
  ORDER BY x.occurred_at DESC
  LIMIT least(greatest(COALESCE(p_limit, 100), 1), 500);
END; $$;

REVOKE EXECUTE ON FUNCTION public.admin_overview(timestamptz, timestamptz) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.admin_daily(timestamptz, timestamptz, text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.admin_users(timestamptz, timestamptz, text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.admin_auth_events(timestamptz, timestamptz, integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_overview(timestamptz, timestamptz) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_daily(timestamptz, timestamptz, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_users(timestamptz, timestamptz, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_auth_events(timestamptz, timestamptz, integer) TO authenticated;