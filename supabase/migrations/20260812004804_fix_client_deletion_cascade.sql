/*
# Fix client deletion and dependent records

1. Purpose
- Make client deletion complete and reliable from the administration screen.
- Remove dependent transaction rows before deleting accounts, because transaction foreign keys currently block account deletion.

2. Modified behavior
- `users`: a requested client can be deleted by the dedicated database function.
- `transactions`: rows connected to the client's accounts are removed before those accounts are cascaded from `users`.
- `accounts`, `loan_applications`, and `loans`: existing CASCADE relationships continue to remove records belonging to the deleted client.
- `loan_applications.reviewed_by`: references to the deleted user are cleared before the user is deleted.

3. Security
- The operation runs in a SECURITY DEFINER function with a fixed `search_path` so it can perform the coordinated deletion despite client-side row policies.
- The function only accepts a client record (`role = 'client'`) and performs all dependent cleanup server-side.
- Execution is granted to the roles used by this application (`anon` and `authenticated`).

4. Important notes
- This is a permanent deletion of the selected client's accounts, loans, loan applications, and related transactions.
- No table, column, or existing data is dropped by this migration; only a new function is created or replaced.
*/

CREATE OR REPLACE FUNCTION public.delete_user_admin(p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_is_client boolean;
BEGIN
  SELECT EXISTS (
    SELECT 1
    FROM public.users
    WHERE id = p_user_id
      AND role = 'client'
  ) INTO v_is_client;

  IF NOT v_is_client THEN
    RAISE EXCEPTION 'Client not found';
  END IF;

  UPDATE public.loan_applications
  SET reviewed_by = NULL
  WHERE reviewed_by = p_user_id;

  DELETE FROM public.transactions
  WHERE from_account_id IN (
    SELECT id FROM public.accounts WHERE user_id = p_user_id
  )
  OR to_account_id IN (
    SELECT id FROM public.accounts WHERE user_id = p_user_id
  );

  DELETE FROM public.users
  WHERE id = p_user_id
    AND role = 'client';
END;
$$;

REVOKE ALL ON FUNCTION public.delete_user_admin(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.delete_user_admin(uuid) TO anon, authenticated;