/*
  # Correction des politiques RLS existantes

  1. Suppression des politiques existantes
  2. Recréation avec les bonnes permissions
  3. Mise à jour des contraintes de devise
*/

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Public read for authentication" ON users;
DROP POLICY IF EXISTS "Users can read own data" ON users;
DROP POLICY IF EXISTS "Users can update own data" ON users;
DROP POLICY IF EXISTS "Service role can insert users" ON users;
DROP POLICY IF EXISTS "Public account access" ON accounts;
DROP POLICY IF EXISTS "Service role can manage accounts" ON accounts;
DROP POLICY IF EXISTS "Public transaction access" ON transactions;
DROP POLICY IF EXISTS "Service role can manage transactions" ON transactions;
DROP POLICY IF EXISTS "Public loan application access" ON loan_applications;
DROP POLICY IF EXISTS "Service role can manage loan applications" ON loan_applications;
DROP POLICY IF EXISTS "Public loan access" ON loans;
DROP POLICY IF EXISTS "Service role can manage loans" ON loans;

-- Recreate policies with correct permissions
CREATE POLICY "Public read for authentication" ON users
  FOR SELECT USING (true);

CREATE POLICY "Users can read own data" ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own data" ON users
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Service role can insert users" ON users
  FOR INSERT WITH CHECK (true);

-- Policies for accounts
CREATE POLICY "Public account access" ON accounts
  FOR SELECT USING (true);

CREATE POLICY "Service role can manage accounts" ON accounts
  FOR ALL USING (true);

-- Policies for transactions
CREATE POLICY "Public transaction access" ON transactions
  FOR SELECT USING (true);

CREATE POLICY "Service role can manage transactions" ON transactions
  FOR ALL USING (true);

-- Policies for loan_applications
CREATE POLICY "Public loan application access" ON loan_applications
  FOR SELECT USING (true);

CREATE POLICY "Service role can manage loan applications" ON loan_applications
  FOR ALL USING (true);

-- Policies for loans
CREATE POLICY "Public loan access" ON loans
  FOR SELECT USING (true);

CREATE POLICY "Service role can manage loans" ON loans
  FOR ALL USING (true);

-- Update currency constraints to accept XOF
ALTER TABLE accounts DROP CONSTRAINT IF EXISTS accounts_currency_check;
ALTER TABLE accounts ADD CONSTRAINT accounts_currency_check 
  CHECK (currency IN ('EUR', 'USD', 'XOF'));

ALTER TABLE transactions DROP CONSTRAINT IF EXISTS transactions_currency_check;
ALTER TABLE transactions ADD CONSTRAINT transactions_currency_check 
  CHECK (currency IN ('EUR', 'USD', 'XOF'));

ALTER TABLE loan_applications DROP CONSTRAINT IF EXISTS loan_applications_currency_check;
ALTER TABLE loan_applications ADD CONSTRAINT loan_applications_currency_check 
  CHECK (currency IN ('EUR', 'USD', 'XOF'));

ALTER TABLE loans DROP CONSTRAINT IF EXISTS loans_currency_check;
ALTER TABLE loans ADD CONSTRAINT loans_currency_check 
  CHECK (currency IN ('EUR', 'USD', 'XOF'));

-- Ensure RPC functions exist
CREATE OR REPLACE FUNCTION create_user_admin(
  p_username text,
  p_password_hash text,
  p_role text,
  p_first_name text,
  p_last_name text,
  p_email text,
  p_phone text,
  p_address text
)
RETURNS users
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_user users;
BEGIN
  INSERT INTO users (
    username,
    password_hash,
    role,
    first_name,
    last_name,
    email,
    phone,
    address
  ) VALUES (
    p_username,
    p_password_hash,
    p_role,
    p_first_name,
    p_last_name,
    p_email,
    p_phone,
    p_address
  )
  RETURNING * INTO new_user;
  
  RETURN new_user;
END;
$$;

CREATE OR REPLACE FUNCTION get_all_users()
RETURNS SETOF users
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY SELECT * FROM users ORDER BY created_at DESC;
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION create_user_admin TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_all_users TO anon, authenticated;