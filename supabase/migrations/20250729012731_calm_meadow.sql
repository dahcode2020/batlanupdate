@@ .. @@
 GRANT EXECUTE ON FUNCTION create_user_admin TO anon, authenticated;
 GRANT EXECUTE ON FUNCTION get_all_users TO anon, authenticated;
+
+CREATE OR REPLACE FUNCTION delete_user_admin(
+  p_user_id text
+)
+RETURNS void
+LANGUAGE plpgsql
+SECURITY DEFINER
+AS $$
+BEGIN
+  DELETE FROM users WHERE id = p_user_id;
+END;
+$$;
+
+-- Grant permissions
+GRANT EXECUTE ON FUNCTION delete_user_admin TO anon, authenticated;