@@ .. @@
 -- Grant permissions
 GRANT EXECUTE ON FUNCTION create_user_admin TO anon, authenticated;
 GRANT EXECUTE ON FUNCTION get_all_users TO anon, authenticated;
+
+-- Function to update account balance
+CREATE OR REPLACE FUNCTION update_account_balance(
+  account_id UUID,
+  amount DECIMAL(15,2),
+  transaction_type TEXT
+)
+RETURNS void
+LANGUAGE plpgsql
+SECURITY DEFINER
+AS $$
+BEGIN
+  -- Update the account balance
+  UPDATE accounts 
+  SET balance = balance + amount
+  WHERE id = account_id;
+  
+  -- Check if the account exists
+  IF NOT FOUND THEN
+    RAISE EXCEPTION 'Account with ID % not found', account_id;
+  END IF;
+END;
+$$;
+
+-- Grant permissions
+GRANT EXECUTE ON FUNCTION update_account_balance TO anon, authenticated;