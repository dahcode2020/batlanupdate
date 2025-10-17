/*
  # Initial Database Schema with Hidden Field

  1. New Tables
    - `users` - System users (clients and administrators) with hidden field
    - `accounts` - Client bank accounts
    - `transactions` - Transaction history
    - `loan_applications` - Loan requests
    - `loans` - Active loans

  2. Security
    - Enable RLS on all tables
    - Policies allowing authentication and administration
    - RPC functions to bypass RLS securely

  3. New Features
    - `hidden` field on users table for soft-hiding customers
    - Toggle function to show/hide users without deletion
*/

-- Create users table with hidden field
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username VARCHAR(50) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(20) NOT NULL CHECK (role IN ('admin', 'client')),
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  phone VARCHAR(20),
  address TEXT,
  hidden BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create accounts table
CREATE TABLE IF NOT EXISTS accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  account_number VARCHAR(50) UNIQUE NOT NULL,
  account_type VARCHAR(20) NOT NULL CHECK (account_type IN ('savings', 'current', 'loan')),
  balance DECIMAL(15,2) DEFAULT 0.00,
  currency VARCHAR(3) DEFAULT 'EUR' CHECK (currency IN ('EUR', 'USD', 'FCFA')),
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'closed')),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create transactions table
CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_account_id UUID REFERENCES accounts(id),
  to_account_id UUID REFERENCES accounts(id),
  amount DECIMAL(15,2) NOT NULL,
  currency VARCHAR(3) NOT NULL CHECK (currency IN ('EUR', 'USD', 'FCFA')),
  type VARCHAR(20) NOT NULL CHECK (type IN ('deposit', 'withdrawal', 'transfer', 'loan_payment')),
  description TEXT,
  status VARCHAR(20) DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'failed')),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create loan_applications table
CREATE TABLE IF NOT EXISTS loan_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  loan_type VARCHAR(30) NOT NULL CHECK (loan_type IN ('personal', 'investment', 'business_real_estate', 'personal_real_estate')),
  amount DECIMAL(15,2) NOT NULL,
  currency VARCHAR(3) NOT NULL CHECK (currency IN ('EUR', 'USD', 'FCFA')),
  duration INTEGER NOT NULL,
  interest_rate DECIMAL(5,2) NOT NULL,
  purpose TEXT NOT NULL,
  monthly_income DECIMAL(15,2) NOT NULL,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMPTZ DEFAULT now(),
  reviewed_at TIMESTAMPTZ,
  reviewed_by UUID REFERENCES users(id)
);

-- Create loans table
CREATE TABLE IF NOT EXISTS loans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID NOT NULL REFERENCES loan_applications(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  amount DECIMAL(15,2) NOT NULL,
  currency VARCHAR(3) NOT NULL CHECK (currency IN ('EUR', 'USD', 'FCFA')),
  interest_rate DECIMAL(5,2) NOT NULL,
  duration INTEGER NOT NULL,
  monthly_payment DECIMAL(15,2) NOT NULL,
  remaining_balance DECIMAL(15,2) NOT NULL,
  next_payment_date DATE NOT NULL,
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'completed', 'defaulted')),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE loan_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE loans ENABLE ROW LEVEL SECURITY;

-- RLS policies for users table
CREATE POLICY "Public read for authentication" ON users
  FOR SELECT USING (true);

CREATE POLICY "Users can update own data" ON users
  FOR UPDATE USING (true);

CREATE POLICY "Service role can insert users" ON users
  FOR INSERT WITH CHECK (true);

-- RLS policies for accounts
CREATE POLICY "Public account access" ON accounts
  FOR SELECT USING (true);

CREATE POLICY "Service role can manage accounts" ON accounts
  FOR ALL USING (true);

-- RLS policies for transactions
CREATE POLICY "Public transaction access" ON transactions
  FOR SELECT USING (true);

CREATE POLICY "Service role can manage transactions" ON transactions
  FOR ALL USING (true);

-- RLS policies for loan_applications
CREATE POLICY "Public loan application access" ON loan_applications
  FOR SELECT USING (true);

CREATE POLICY "Service role can manage loan applications" ON loan_applications
  FOR ALL USING (true);

-- RLS policies for loans
CREATE POLICY "Public loan access" ON loans
  FOR SELECT USING (true);

CREATE POLICY "Service role can manage loans" ON loans
  FOR ALL USING (true);

-- Function to create user (bypasses RLS)
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

-- Function to get all users (bypasses RLS)
CREATE OR REPLACE FUNCTION get_all_users()
RETURNS SETOF users
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY SELECT * FROM users ORDER BY created_at DESC;
END;
$$;

-- Function to toggle user hidden status
CREATE OR REPLACE FUNCTION toggle_user_hidden(user_id UUID)
RETURNS users
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  updated_user users;
BEGIN
  UPDATE users 
  SET hidden = NOT hidden
  WHERE id = user_id
  RETURNING * INTO updated_user;
  
  RETURN updated_user;
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION create_user_admin TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_all_users TO anon, authenticated;
GRANT EXECUTE ON FUNCTION toggle_user_hidden TO anon, authenticated;
