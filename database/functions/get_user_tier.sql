--
-- Name: get_user_tier(uuid); Type: FUNCTION; Schema: speak_mango_en
--
-- Description: Retrieves the tier and subscription end date for a specific user.
--              This function uses SECURITY DEFINER to bypass RLS policies,
--              allowing access to user data that might otherwise be restricted
--              or require cross-schema access (e.g., from NextAuth schema).
--
-- Parameters:
-- p_user_id: The UUID of the user to fetch details for.
--
-- Returns: Table containing 'tier' (user_tier) and 'subscription_end_date' (timestamptz).
--
-- Security:
--   - SECURITY DEFINER: Executes with the privileges of the function creator.
--   - Explicit search_path: Prevents search_path hijacking.
--

create or replace function speak_mango_en.get_user_tier(p_user_id uuid)
returns table (
  tier speak_mango_en.user_tier,
  subscription_end_date timestamptz
)
language plpgsql
security definer
set search_path = speak_mango_en
as $$
begin
  return query
  select u.tier, u.subscription_end_date
  from speak_mango_en.users u
  where u.id = p_user_id;
end;
$$;

-- Grant execute permission to both authenticated users types
-- service_role: for NextAuth Adapter backend calls
-- authenticated: for potential frontend self-checks
grant execute on function speak_mango_en.get_user_tier(uuid) to authenticated, service_role;
