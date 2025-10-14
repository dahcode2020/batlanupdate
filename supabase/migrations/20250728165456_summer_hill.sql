@@ .. @@
   account_number VARCHAR(50) UNIQUE NOT NULL,
   account_type VARCHAR(20) NOT NULL CHECK (account_type IN ('savings', 'current', 'loan')),
   balance DECIMAL(15,2) DEFAULT 0.00,
-  currency VARCHAR(3) DEFAULT 'EUR' CHECK (currency IN ('EUR', 'USD', 'FCFA')),
+  currency VARCHAR(3) DEFAULT 'EUR' CHECK (currency IN ('EUR', 'USD', 'XOF')),
   status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'closed')),
   created_at TIMESTAMPTZ DEFAULT now()
 );
@@ .. @@
   amount DECIMAL(15,2) NOT NULL,
-  currency VARCHAR(3) NOT NULL CHECK (currency IN ('EUR', 'USD', 'FCFA')),
+  currency VARCHAR(3) NOT NULL CHECK (currency IN ('EUR', 'USD', 'XOF')),
   type VARCHAR(20) NOT NULL CHECK (type IN ('deposit', 'withdrawal', 'transfer', 'loan_payment')),
   description TEXT,
@@ .. @@
   amount DECIMAL(15,2) NOT NULL,
-  currency VARCHAR(3) NOT NULL CHECK (currency IN ('EUR', 'USD', 'FCFA')),
+  currency VARCHAR(3) NOT NULL CHECK (currency IN ('EUR', 'USD', 'XOF')),
   duration INTEGER NOT NULL, -- in months
   interest_rate DECIMAL(5,2) NOT NULL,
@@ .. @@
   amount DECIMAL(15,2) NOT NULL,
-  currency VARCHAR(3) NOT NULL CHECK (currency IN ('EUR', 'USD', 'FCFA')),
+  currency VARCHAR(3) NOT NULL CHECK (currency IN ('EUR', 'USD', 'XOF')),
   interest_rate DECIMAL(5,2) NOT NULL,