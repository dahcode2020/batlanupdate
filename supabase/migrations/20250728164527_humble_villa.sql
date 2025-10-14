/*
  # Transactions et données de démonstration

  1. Transactions d'exemple
    - Dépôts, retraits et virements
    - Historique réaliste pour les comptes de test
    - Différents statuts (completed, pending)

  2. Demandes de crédit
    - Applications de prêt en attente et approuvées
    - Différents types de crédit
    - Montants et durées variés

  3. Prêts actifs
    - Prêts basés sur les applications approuvées
    - Échéanciers de remboursement
    - Soldes restants
*/

-- Insert sample transactions
INSERT INTO transactions (from_account_id, to_account_id, amount, currency, type, description, status) VALUES
((SELECT id FROM accounts WHERE account_number = 'TG53TG138010001234567890'), NULL, 5000.00, 'EUR', 'deposit', 'Dépôt initial', 'completed'),
((SELECT id FROM accounts WHERE account_number = 'TG53TG138010001234567891'), NULL, 2500.50, 'EUR', 'deposit', 'Virement salaire', 'completed'),
(NULL, (SELECT id FROM accounts WHERE account_number = 'TG53TG138010001234567891'), 200.00, 'EUR', 'withdrawal', 'Retrait DAB', 'completed'),
((SELECT id FROM accounts WHERE account_number = 'TG53TG138010001234567890'), (SELECT id FROM accounts WHERE account_number = 'TG53TG138010001234567892'), 1000.00, 'EUR', 'transfer', 'Virement international', 'pending'),
((SELECT id FROM accounts WHERE account_number = 'TG53TG138010001234567892'), NULL, 8750.25, 'USD', 'deposit', 'Dépôt d''ouverture', 'completed');

-- Insert sample loan applications
INSERT INTO loan_applications (user_id, loan_type, amount, currency, duration, interest_rate, purpose, monthly_income, status) VALUES
((SELECT id FROM users WHERE username = 'client1'), 'personal', 10000.00, 'EUR', 24, 5.5, 'Achat véhicule personnel', 3500.00, 'pending'),
((SELECT id FROM users WHERE username = 'client2'), 'investment', 25000.00, 'USD', 36, 4.8, 'Développement activité commerciale', 5000.00, 'approved'),
((SELECT id FROM users WHERE username = 'client1'), 'personal_real_estate', 150000.00, 'EUR', 240, 3.9, 'Achat résidence principale', 4200.00, 'pending');

-- Insert sample loans (based on approved applications)
INSERT INTO loans (application_id, user_id, amount, currency, interest_rate, duration, monthly_payment, remaining_balance, next_payment_date, status) VALUES
((SELECT id FROM loan_applications WHERE user_id = (SELECT id FROM users WHERE username = 'client2') AND loan_type = 'investment'), 
 (SELECT id FROM users WHERE username = 'client2'), 
 25000.00, 'USD', 4.8, 36, 742.50, 22500.00, '2024-02-15', 'active');