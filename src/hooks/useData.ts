import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { User, Account, Transaction, LoanApplication, Loan } from '../types';
import { 
  userService, 
  accountService, 
  transactionService, 
  loanApplicationService, 
  loanService 
} from '../services/database';
import { logger } from '../utils/logger';

// Hook pour les utilisateurs
export const useUsers = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const data = await userService.getAll();
      setUsers(data);
      setError(null);
    } catch (err) {
      setError('Erreur lors du chargement des utilisateurs');
      logger.error('Error fetching users', err as Error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  return { users, loading, error, refetch: fetchUsers };
};

// Hook pour les comptes d'un utilisateur
export const useUserAccounts = (userId: string | undefined) => {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAccounts = async () => {
    if (!userId) {
      setAccounts([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const data = await accountService.getByUserId(userId);
      setAccounts(data);
      setError(null);
    } catch (err) {
      setError('Erreur lors du chargement des comptes');
      logger.error('Error fetching user accounts', err as Error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAccounts();
  }, [userId]);

  // Écouter les changements de solde en temps réel
  useEffect(() => {
    if (!userId) return;

    const subscription = supabase
      .channel('account_balance_changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'accounts',
          filter: `user_id=eq.${userId}`
        },
        (payload) => {
          logger.info('Account balance updated', payload);
          // Rafraîchir les comptes quand un solde change
          fetchAccounts();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [userId, fetchAccounts]);

  return { accounts, loading, error, refetch: fetchAccounts };
};

// Hook pour tous les comptes (admin)
export const useAllAccounts = () => {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAccounts = async () => {
    try {
      setLoading(true);
      const data = await accountService.getAll();
      setAccounts(data);
      setError(null);
    } catch (err) {
      setError('Erreur lors du chargement des comptes');
      logger.error('Error fetching all accounts', err as Error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAccounts();
  }, []);

  // Écouter les changements de solde en temps réel pour tous les comptes
  useEffect(() => {
    const subscription = supabase
      .channel('all_account_balance_changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'accounts'
        },
        (payload) => {
          logger.info('Account balance updated (admin view)', payload);
          // Rafraîchir tous les comptes quand un solde change
          fetchAccounts();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [fetchAccounts]);

  return { accounts, loading, error, refetch: fetchAccounts };
};

// Hook pour les transactions d'un utilisateur
export const useUserTransactions = (accountIds: string[]) => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTransactions = async () => {
    if (accountIds.length === 0) {
      setTransactions([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const data = await transactionService.getByAccountIds(accountIds);
      setTransactions(data);
      setError(null);
    } catch (err) {
      setError('Erreur lors du chargement des transactions');
      logger.error('Error fetching user transactions', err as Error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, [accountIds.join(',')]);

  return { transactions, loading, error, refetch: fetchTransactions };
};

// Hook pour toutes les transactions (admin)
export const useAllTransactions = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const data = await transactionService.getAll();
      setTransactions(data);
      setError(null);
    } catch (err) {
      setError('Erreur lors du chargement des transactions');
      logger.error('Error fetching all transactions', err as Error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, []);

  return { transactions, loading, error, refetch: fetchTransactions };
};

// Hook pour les demandes de crédit
export const useLoanApplications = (userId?: string) => {
  const [applications, setApplications] = useState<LoanApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchApplications = async () => {
    try {
      setLoading(true);
      const data = userId 
        ? await loanApplicationService.getByUserId(userId)
        : await loanApplicationService.getAll();
      setApplications(data);
      setError(null);
    } catch (err) {
      setError('Erreur lors du chargement des demandes de crédit');
      logger.error('Error fetching loan applications', err as Error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, [userId]);

  return { applications, loading, error, refetch: fetchApplications };
};

// Hook pour les prêts
export const useLoans = (userId?: string) => {
  const [loans, setLoans] = useState<Loan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLoans = async () => {
    try {
      setLoading(true);
      const data = userId 
        ? await loanService.getByUserId(userId)
        : await loanService.getAll();
      setLoans(data);
      setError(null);
    } catch (err) {
      setError('Erreur lors du chargement des prêts');
      logger.error('Error fetching loans', err as Error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLoans();
  }, [userId]);

  return { loans, loading, error, refetch: fetchLoans };
};