export interface User {
  id: string;
  username: string;
  password: string;
  role: 'admin' | 'client';
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  hidden?: boolean;
  createdAt: string;
}

export interface Account {
  id: string;
  userId: string;
  accountNumber: string;
  accountType: 'savings' | 'current' | 'loan';
  balance: number;
  currency: 'EUR' | 'USD' | 'FCFA';
  status: 'active' | 'suspended' | 'closed';
  createdAt: string;
}

export interface Transaction {
  id: string;
  fromAccountId?: string;
  toAccountId?: string;
  amount: number;
  currency: 'EUR' | 'USD' | 'FCFA';
  type: 'deposit' | 'withdrawal' | 'transfer' | 'loan_payment';
  description: string;
  status: 'pending' | 'completed' | 'failed';
  createdAt: string;
}

export interface LoanApplication {
  id: string;
  userId: string;
  loanType: 'personal' | 'investment' | 'business_real_estate' | 'personal_real_estate';
  amount: number;
  currency: 'EUR' | 'USD' | 'FCFA';
  duration: number; // in months
  interestRate: number;
  purpose: string;
  monthlyIncome: number;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
}

export interface Loan {
  id: string;
  applicationId: string;
  userId: string;
  amount: number;
  currency: 'EUR' | 'USD' | 'FCFA';
  interestRate: number;
  duration: number;
  monthlyPayment: number;
  remainingBalance: number;
  nextPaymentDate: string;
  status: 'active' | 'completed' | 'defaulted';
  createdAt: string;
}

export interface AmortizationSchedule {
  month: number;
  payment: number;
  principal: number;
  interest: number;
  remainingBalance: number;
}