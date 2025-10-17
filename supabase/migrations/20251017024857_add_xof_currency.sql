/*
  # Ajout de la devise XOF (Franc CFA)
  
  1. Modifications
    - Ajouter XOF aux devises acceptées dans les tables accounts, transactions, loan_applications, et loans
    - XOF est le Franc de la Communauté Financière Africaine utilisé en Afrique de l'Ouest
  
  2. Notes
    - Les contraintes existantes sont supprimées et recréées avec la nouvelle devise
*/

-- Modifier la contrainte pour accounts
ALTER TABLE accounts DROP CONSTRAINT IF EXISTS accounts_currency_check;
ALTER TABLE accounts ADD CONSTRAINT accounts_currency_check 
  CHECK (currency IN ('EUR', 'USD', 'FCFA', 'XOF'));

-- Modifier la contrainte pour transactions
ALTER TABLE transactions DROP CONSTRAINT IF EXISTS transactions_currency_check;
ALTER TABLE transactions ADD CONSTRAINT transactions_currency_check 
  CHECK (currency IN ('EUR', 'USD', 'FCFA', 'XOF'));

-- Modifier la contrainte pour loan_applications
ALTER TABLE loan_applications DROP CONSTRAINT IF EXISTS loan_applications_currency_check;
ALTER TABLE loan_applications ADD CONSTRAINT loan_applications_currency_check 
  CHECK (currency IN ('EUR', 'USD', 'FCFA', 'XOF'));

-- Modifier la contrainte pour loans
ALTER TABLE loans DROP CONSTRAINT IF EXISTS loans_currency_check;
ALTER TABLE loans ADD CONSTRAINT loans_currency_check 
  CHECK (currency IN ('EUR', 'USD', 'FCFA', 'XOF'));