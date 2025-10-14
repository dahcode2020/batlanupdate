/*
  # Comptes bancaires de démonstration

  1. Comptes créés
    - Comptes d'épargne et courants pour les clients de test
    - Soldes initiaux réalistes
    - Numéros de compte au format togolais

  2. Devises
    - EUR (Euro)
    - USD (Dollar US) 
    - FCFA (Franc CFA)
*/

-- Insert sample accounts
INSERT INTO accounts (user_id, account_number, account_type, balance, currency, status) VALUES
((SELECT id FROM users WHERE username = 'client1'), 'TG53TG138010001234567890', 'savings', 15000.00, 'EUR', 'active'),
((SELECT id FROM users WHERE username = 'client1'), 'TG53TG138010001234567891', 'current', 2500.50, 'EUR', 'active'),
((SELECT id FROM users WHERE username = 'client2'), 'TG53TG138010001234567892', 'savings', 8750.25, 'USD', 'active'),
((SELECT id FROM users WHERE username = 'client2'), 'TG53TG138010001234567893', 'current', 1200.00, 'FCFA', 'active')
ON CONFLICT (account_number) DO NOTHING;