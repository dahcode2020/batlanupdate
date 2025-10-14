import { supabase } from '../lib/supabase';
import { User, Account, Transaction, LoanApplication, Loan } from '../types';
import { logger } from '../utils/logger';
import { config } from '../config/environment';

// Cache management
const cache = new Map<string, { data: any; timestamp: number }>();
const CACHE_DURATION = config.performance.cacheTimeout;

function getCacheKey(operation: string, params?: any): string {
  return `${operation}_${JSON.stringify(params || {})}`;
}

function getFromCache<T>(key: string): T | null {
  const cached = cache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    logger.debug('Cache hit', { key });
    return cached.data;
  }
  if (cached) {
    cache.delete(key);
    logger.debug('Cache expired', { key });
  }
  return null;
}

function setCache<T>(key: string, data: T): void {
  cache.set(key, { data, timestamp: Date.now() });
  logger.debug('Cache set', { key });
}

function clearCachePattern(pattern: string): void {
  for (const key of cache.keys()) {
    if (key.includes(pattern)) {
      cache.delete(key);
    }
  }
  logger.debug('Cache cleared', { pattern });
}
// Service pour les utilisateurs
export const userService = {
  async getAll(): Promise<User[]> {
    const cacheKey = getCacheKey('users_all');
    const cached = getFromCache<User[]>(cacheKey);
    if (cached) return cached;
    
    try {
      logger.info('Fetching all users from database');
      
      let data = null;
      let error = null;
      
      try {
        // Utiliser le service role pour contourner RLS
        const { data: rpcData, error: rpcError } = await supabase.rpc('get_all_users');
        data = rpcData;
        error = rpcError;
      } catch (rpcErr) {
        logger.warn('RPC not available, using direct query');
        error = { code: '42883' }; // Force fallback
      }
      
      if (error && (error.code === '42883' || error.message?.includes('function'))) {
        // Si la fonction n'existe pas ou erreur de connexion, utiliser la méthode normale
        logger.warn('Using fallback method for users');
        const { data: fallbackData, error: fallbackError } = await supabase
          .from('users')
          .select('*')
          .order('created_at', { ascending: false });
        
        if (fallbackError || !fallbackData) {
          logger.warn('Database not available, using fallback authentication');
          // Fallback vers les données de test
          const testUsers = [
            { id: 'admin-1', username: 'admin', password_hash: 'admin1237575@@xyz', role: 'admin', first_name: 'Administrateur', last_name: 'Système', email: 'admin@banqueatlantique.tg', phone: '+228-90-12-34-56', address: 'Siège Social, Lomé, Togo', created_at: new Date().toISOString() },
            { id: 'client-1', username: 'client1', password_hash: 'client123', role: 'client', first_name: 'Jean', last_name: 'Dupont', email: 'jean.dupont@email.com', phone: '+228-91-23-45-67', address: '123 Rue de la Paix, Lomé, Togo', created_at: new Date().toISOString() },
            { id: 'client-2', username: 'client2', password_hash: 'client123', role: 'client', first_name: 'Marie', last_name: 'Martin', email: 'marie.martin@email.com', phone: '+228-92-34-56-78', address: '456 Avenue de l\'Indépendance, Lomé, Togo', created_at: new Date().toISOString() }
          ];
          const users = testUsers.map(this.mapUserFromDb);
          setCache(cacheKey, users);
          logger.info('Users loaded from fallback data', { count: users.length });
          return users;
        }
        
        const users = (fallbackData || []).map(this.mapUserFromDb);
        setCache(cacheKey, users);
        logger.info('Users fetched successfully (fallback)', { count: users.length });
        return users;
      }

      if (error) {
        logger.error('RPC error fetching users', error);
        throw error;
      }
      
      const users = (data || []).map(this.mapUserFromDb);
      setCache(cacheKey, users);
      logger.info('Users fetched successfully', { count: users.length });
      return users;
    } catch (error) {
      logger.error('Error fetching users', error as Error);
      throw error;
    }
  },

  mapUserFromDb(dbUser: any): User {
    return {
      id: dbUser.id,
      username: dbUser.username,
      password: dbUser.password_hash || dbUser.password,
      role: dbUser.role,
      firstName: dbUser.first_name || dbUser.firstName,
      lastName: dbUser.last_name || dbUser.lastName,
      email: dbUser.email,
      phone: dbUser.phone,
      address: dbUser.address,
      hidden: dbUser.hidden || false,
      createdAt: dbUser.created_at || dbUser.createdAt
    };
  },

  async getById(id: string): Promise<User | null> {
    const cacheKey = getCacheKey('user_by_id', { id });
    const cached = getFromCache<User | null>(cacheKey);
    if (cached !== null) return cached;
    
    try {
      logger.debug('Fetching user by ID', { id });
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (error) {
        logger.error('Error fetching user by ID', error, { id });
        throw error;
      }
      
      const user = data ? this.mapUserFromDb(data) : null;
      setCache(cacheKey, user);
      return user;
    } catch (error) {
      logger.error('Error fetching user by ID', error as Error);
      return null;
    }
  },

  async getByUsername(username: string): Promise<User | null> {
    const cacheKey = getCacheKey('user_by_username', { username });
    const cached = getFromCache<User | null>(cacheKey);
    if (cached !== null) return cached;
    
    try {
      logger.debug('Fetching user by username', { username });
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('username', username)
        .single();

      if (error) {
        logger.error('Error fetching user by username', error, { username });
        throw error;
      }
      
      const user = data ? this.mapUserFromDb(data) : null;
      setCache(cacheKey, user);
      return user;
    } catch (error) {
      logger.error('Error fetching user by username', error as Error);
      return null;
    }
  },

  async create(user: Omit<User, 'id' | 'createdAt'>): Promise<User> {
    try {
      logger.info('Creating new user', { username: user.username, role: user.role });
      
      // Clear users cache
      clearCachePattern('users_');
      
      // Essayer d'abord avec une fonction RPC qui contourne RLS
      let data, error;
      
      try {
        const { data: rpcData, error: rpcError } = await supabase.rpc('create_user_admin', {
          p_username: user.username,
          p_password_hash: user.password,
          p_role: user.role,
          p_first_name: user.firstName,
          p_last_name: user.lastName,
          p_email: user.email,
          p_phone: user.phone,
          p_address: user.address
        });
        
        if (rpcError && rpcError.code !== '42883') {
          throw rpcError;
        }
        
        if (!rpcError) {
          data = rpcData;
          error = null;
          logger.info('User created via RPC', { userId: data?.id });
        } else {
          throw new Error('RPC function not available');
        }
      } catch (rpcErr) {
        logger.warn('RPC not available, using direct method');
        
        // Fallback vers insertion directe
        const { data: insertData, error: insertError } = await supabase
          .from('users')
          .insert([{
            username: user.username,
            password_hash: user.password,
            role: user.role,
            first_name: user.firstName,
            last_name: user.lastName,
            email: user.email,
            phone: user.phone,
            address: user.address
          }])
        .select()
        .single();
        
        data = insertData;
        error = insertError;
        
        if (!error) {
          logger.info('User created via direct insert', { userId: data?.id });
        }
      }

      if (error) {
        logger.error('Error creating user', error, {
          username: user.username,
          email: user.email,
          code: error.code,
          details: error.details
        });
        throw error;
      }
      
      logger.info('User created successfully', { userId: data.id, username: user.username });
      return this.mapUserFromDb(data);
    } catch (error) {
      logger.error('Error creating user', error as Error);
      throw error;
    }
  },

  async update(id: string, updates: Partial<User>): Promise<User> {
    try {
      logger.info('Updating user', { id, updates: Object.keys(updates) });

      // Clear user cache
      clearCachePattern('user_');
      clearCachePattern('users_');

      const updateData: any = {
        first_name: updates.firstName,
        last_name: updates.lastName,
        email: updates.email,
        phone: updates.phone,
        address: updates.address
      };

      // Si le mot de passe est fourni, l'inclure dans la mise à jour
      if (updates.password) {
        updateData.password_hash = updates.password;
      }

      const { data, error } = await supabase
        .from('users')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        logger.error('Error updating user', error, { id });
        throw error;
      }

      logger.info('User updated successfully', { id });
      return {
        id: data.id,
        username: data.username,
        password: data.password_hash,
        role: data.role,
        firstName: data.first_name,
        lastName: data.last_name,
        email: data.email,
        phone: data.phone,
        address: data.address,
        createdAt: data.created_at
      };
    } catch (error) {
      logger.error('Error updating user', error as Error);
      throw error;
    }
  },

  async delete(id: string): Promise<void> {
    try {
      logger.info('Deleting user', { id });

      // Clear all user-related cache
      clearCachePattern('user_');
      clearCachePattern('users_');
      clearCachePattern('accounts_');

      // Essayer d'abord avec une fonction RPC qui contourne RLS
      try {
        const { error: rpcError } = await supabase.rpc('delete_user_admin', {
          p_user_id: id
        });

        if (rpcError && rpcError.code !== '42883') {
          throw rpcError;
        }

        if (!rpcError) {
          logger.info('User deleted via RPC', { id });
          return;
        } else {
          throw new Error('RPC function not available');
        }
      } catch (rpcErr) {
        logger.warn('RPC not available for deletion, using direct method');

        // Fallback vers suppression directe
        const { error: deleteError } = await supabase
          .from('users')
          .delete()
          .eq('id', id);

        if (deleteError) {
          logger.error('Error deleting user', deleteError, { id });
          throw deleteError;
        }

        logger.info('User deleted via direct method', { id });
      }
    } catch (error) {
      logger.error('Error deleting user', error as Error);
      throw error;
    }
  },

  async toggleHidden(id: string): Promise<User> {
    try {
      logger.info('Toggling user hidden status', { id });

      // Clear user cache
      clearCachePattern('user_');
      clearCachePattern('users_');

      try {
        const { data, error } = await supabase.rpc('toggle_user_hidden', {
          user_id: id
        });

        if (error && error.code !== '42883') {
          throw error;
        }

        if (!error && data) {
          logger.info('User hidden status toggled via RPC', { id });
          return this.mapUserFromDb(data);
        } else {
          throw new Error('RPC function not available');
        }
      } catch (rpcErr) {
        logger.warn('RPC not available, using direct method');

        const currentUser = await this.getById(id);
        if (!currentUser) {
          throw new Error('User not found');
        }

        const { data, error } = await supabase
          .from('users')
          .update({ hidden: !currentUser.hidden })
          .eq('id', id)
          .select()
          .single();

        if (error) {
          logger.error('Error toggling user hidden status', error, { id });
          throw error;
        }

        logger.info('User hidden status toggled via direct method', { id });
        return this.mapUserFromDb(data);
      }
    } catch (error) {
      logger.error('Error toggling user hidden status', error as Error);
      throw error;
    }
  }
};

// Service pour les comptes
export const accountService = {
  async getByUserId(userId: string): Promise<Account[]> {
    const cacheKey = getCacheKey('accounts_by_user', { userId });
    const cached = getFromCache<Account[]>(cacheKey);
    if (cached) return cached;
    
    try {
      logger.debug('Fetching accounts by user ID', { userId });
      const { data, error } = await supabase
        .from('accounts')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        logger.error('Error fetching accounts by user ID', error, { userId });
        throw error;
      }
      
      const accounts = (data || []).map(account => ({
        id: account.id,
        userId: account.user_id,
        accountNumber: account.account_number,
        accountType: account.account_type,
        balance: parseFloat(account.balance),
        currency: account.currency,
        status: account.status,
        createdAt: account.created_at
      }));
      
      setCache(cacheKey, accounts);
      logger.debug('Accounts fetched successfully', { userId, count: accounts.length });
      return accounts;
    } catch (error) {
      logger.error('Error fetching accounts by user ID', error as Error);
      throw error;
    }
  },

  async getAll(): Promise<Account[]> {
    const cacheKey = getCacheKey('accounts_all');
    const cached = getFromCache<Account[]>(cacheKey);
    if (cached) return cached;
    
    try {
      logger.debug('Fetching all accounts');
      const { data, error } = await supabase
        .from('accounts')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        logger.error('Error fetching all accounts', error);
        throw error;
      }
      
      const accounts = (data || []).map(account => ({
        id: account.id,
        userId: account.user_id,
        accountNumber: account.account_number,
        accountType: account.account_type,
        balance: parseFloat(account.balance),
        currency: account.currency,
        status: account.status,
        createdAt: account.created_at
      }));
      
      setCache(cacheKey, accounts);
      logger.debug('All accounts fetched successfully', { count: accounts.length });
      return accounts;
    } catch (error) {
      logger.error('Error fetching all accounts', error as Error);
      throw error;
    }
  },

  async create(account: Omit<Account, 'id' | 'createdAt'>): Promise<Account> {
    try {
      logger.info('Creating new account', { 
        userId: account.userId, 
        accountType: account.accountType,
        currency: account.currency 
      });
      
      // Clear accounts cache
      clearCachePattern('accounts_');
      
      const { data, error } = await supabase
        .from('accounts')
        .insert([{
          user_id: account.userId,
          account_number: account.accountNumber,
          account_type: account.accountType,
          balance: account.balance,
          currency: account.currency,
          status: account.status
        }])
        .select()
        .single();

      if (error) {
        logger.error('Error creating account', error, { userId: account.userId });
        throw error;
      }
      
      logger.info('Account created successfully', { accountId: data.id, userId: account.userId });
      return {
        id: data.id,
        userId: data.user_id,
        accountNumber: data.account_number,
        accountType: data.account_type,
        balance: parseFloat(data.balance),
        currency: data.currency,
        status: data.status,
        createdAt: data.created_at
      };
    } catch (error) {
      logger.error('Error creating account', error as Error);
      throw error;
    }
  }
};

// Service pour les transactions
export const transactionService = {
  async getByAccountIds(accountIds: string[]): Promise<Transaction[]> {
    try {
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .or(`from_account_id.in.(${accountIds.join(',')}),to_account_id.in.(${accountIds.join(',')})`)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []).map(transaction => ({
        id: transaction.id,
        fromAccountId: transaction.from_account_id,
        toAccountId: transaction.to_account_id,
        amount: parseFloat(transaction.amount),
        currency: transaction.currency,
        type: transaction.type,
        description: transaction.description,
        status: transaction.status,
        createdAt: transaction.created_at
      }));
    } catch (error) {
      logger.error('Error fetching transactions by account IDs', error as Error);
      throw error;
    }
  },

  async getAll(): Promise<Transaction[]> {
    try {
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []).map(transaction => ({
        id: transaction.id,
        fromAccountId: transaction.from_account_id,
        toAccountId: transaction.to_account_id,
        amount: parseFloat(transaction.amount),
        currency: transaction.currency,
        type: transaction.type,
        description: transaction.description,
        status: transaction.status,
        createdAt: transaction.created_at
      }));
    } catch (error) {
      logger.error('Error fetching all transactions', error as Error);
      throw error;
    }
  },

  async create(transaction: Omit<Transaction, 'id' | 'createdAt'>): Promise<Transaction> {
    try {
      const { data, error } = await supabase
        .from('transactions')
        .insert([{
          from_account_id: transaction.fromAccountId,
          to_account_id: transaction.toAccountId,
          amount: transaction.amount,
          currency: transaction.currency,
          type: transaction.type,
          description: transaction.description,
          status: transaction.status
        }])
        .select()
        .single();

      if (error) throw error;
      return {
        id: data.id,
        fromAccountId: data.from_account_id,
        toAccountId: data.to_account_id,
        amount: parseFloat(data.amount),
        currency: data.currency,
        type: data.type,
        description: data.description,
        status: data.status,
        createdAt: data.created_at
      };
    } catch (error) {
      logger.error('Error creating transaction', error as Error);
      throw error;
    }
  },

  async updateStatus(id: string, status: 'pending' | 'completed' | 'failed'): Promise<Transaction> {
    try {
      // Si la transaction est validée, mettre à jour les soldes des comptes
      if (status === 'completed') {
        const transaction = await this.getById(id);
        if (transaction) {
          await this.updateAccountBalances(transaction);
        }
      }
      
      const { data, error } = await supabase
        .from('transactions')
        .update({ status })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return {
        id: data.id,
        fromAccountId: data.from_account_id,
        toAccountId: data.to_account_id,
        amount: parseFloat(data.amount),
        currency: data.currency,
        type: data.type,
        description: data.description,
        status: data.status,
        createdAt: data.created_at
      };
    } catch (error) {
      logger.error('Error updating transaction status', error as Error);
      throw error;
    }
  },

  async getById(id: string): Promise<Transaction | null> {
    try {
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data ? {
        id: data.id,
        fromAccountId: data.from_account_id,
        toAccountId: data.to_account_id,
        amount: parseFloat(data.amount),
        currency: data.currency,
        type: data.type,
        description: data.description,
        status: data.status,
        createdAt: data.created_at
      } : null;
    } catch (error) {
      logger.error('Error fetching transaction by ID', error as Error);
      return null;
    }
  },

  async updateAccountBalances(transaction: Transaction): Promise<void> {
    try {
      // Mettre à jour le compte émetteur (débit)
      if (transaction.fromAccountId) {
        const { error: fromError } = await supabase.rpc('update_account_balance', {
          account_id: transaction.fromAccountId,
          amount: -transaction.amount,
          transaction_type: 'debit'
        });
        
        if (fromError) {
          // Fallback: mise à jour directe si la fonction RPC n'existe pas
          const { data: fromAccount } = await supabase
            .from('accounts')
            .select('balance')
            .eq('id', transaction.fromAccountId)
            .single();
            
          if (fromAccount) {
            await supabase
              .from('accounts')
              .update({ balance: parseFloat(fromAccount.balance) - transaction.amount })
              .eq('id', transaction.fromAccountId);
          }
        }
      }

      // Mettre à jour le compte bénéficiaire (crédit)
      if (transaction.toAccountId) {
        const { error: toError } = await supabase.rpc('update_account_balance', {
          account_id: transaction.toAccountId,
          amount: transaction.amount,
          transaction_type: 'credit'
        });
        
        if (toError) {
          // Fallback: mise à jour directe si la fonction RPC n'existe pas
          const { data: toAccount } = await supabase
            .from('accounts')
            .select('balance')
            .eq('id', transaction.toAccountId)
            .single();
            
          if (toAccount) {
            await supabase
              .from('accounts')
              .update({ balance: parseFloat(toAccount.balance) + transaction.amount })
              .eq('id', transaction.toAccountId);
          }
        }
      }

      // Pour les dépôts (pas de compte émetteur)
      if (transaction.type === 'deposit' && transaction.toAccountId) {
        const { data: account } = await supabase
          .from('accounts')
          .select('balance')
          .eq('id', transaction.toAccountId)
          .single();
          
        if (account) {
          await supabase
            .from('accounts')
            .update({ balance: parseFloat(account.balance) + transaction.amount })
            .eq('id', transaction.toAccountId);
        }
      }

      // Pour les retraits (pas de compte bénéficiaire)
      if (transaction.type === 'withdrawal' && transaction.fromAccountId) {
        const { data: account } = await supabase
          .from('accounts')
          .select('balance')
          .eq('id', transaction.fromAccountId)
          .single();
          
        if (account) {
          await supabase
            .from('accounts')
            .update({ balance: parseFloat(account.balance) - transaction.amount })
            .eq('id', transaction.fromAccountId);
        }
      }

      logger.info('Account balances updated successfully', { transactionId: transaction.id });
    } catch (error) {
      logger.error('Error updating account balances', error as Error);
      throw error;
    }
  },

  async updateStatusWithReason(id: string, status: 'failed', reason: string): Promise<Transaction> {
    try {
      const { data, error } = await supabase
        .from('transactions')
        .update({ 
          status,
          description: `${data?.description || ''} - REJETÉ: ${reason}`
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return {
        id: data.id,
        fromAccountId: data.from_account_id,
        toAccountId: data.to_account_id,
        amount: parseFloat(data.amount),
        currency: data.currency,
        type: data.type,
        description: data.description,
        status: data.status,
        createdAt: data.created_at
      };
    } catch (error) {
      logger.error('Error updating transaction status with reason', error as Error);
      throw error;
    }
  }
};

// Service pour les demandes de crédit
export const loanApplicationService = {
  async getAll(): Promise<LoanApplication[]> {
    try {
      const { data, error } = await supabase
        .from('loan_applications')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []).map(app => ({
        id: app.id,
        userId: app.user_id,
        loanType: app.loan_type,
        amount: parseFloat(app.amount),
        currency: app.currency,
        duration: app.duration,
        interestRate: parseFloat(app.interest_rate),
        purpose: app.purpose,
        monthlyIncome: parseFloat(app.monthly_income),
        status: app.status,
        createdAt: app.created_at,
        reviewedAt: app.reviewed_at,
        reviewedBy: app.reviewed_by
      }));
    } catch (error) {
      logger.error('Error fetching loan applications', error as Error);
      throw error;
    }
  },

  async getByUserId(userId: string): Promise<LoanApplication[]> {
    try {
      const { data, error } = await supabase
        .from('loan_applications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []).map(app => ({
        id: app.id,
        userId: app.user_id,
        loanType: app.loan_type,
        amount: parseFloat(app.amount),
        currency: app.currency,
        duration: app.duration,
        interestRate: parseFloat(app.interest_rate),
        purpose: app.purpose,
        monthlyIncome: parseFloat(app.monthly_income),
        status: app.status,
        createdAt: app.created_at,
        reviewedAt: app.reviewed_at,
        reviewedBy: app.reviewed_by
      }));
    } catch (error) {
      logger.error('Error fetching loan applications by user ID', error as Error);
      throw error;
    }
  },

  async create(application: Omit<LoanApplication, 'id' | 'createdAt'>): Promise<LoanApplication> {
    try {
      const { data, error } = await supabase
        .from('loan_applications')
        .insert([{
          user_id: application.userId,
          loan_type: application.loanType,
          amount: application.amount,
          currency: application.currency,
          duration: application.duration,
          interest_rate: application.interestRate,
          purpose: application.purpose,
          monthly_income: application.monthlyIncome,
          status: application.status
        }])
        .select()
        .single();

      if (error) throw error;
      return {
        id: data.id,
        userId: data.user_id,
        loanType: data.loan_type,
        amount: parseFloat(data.amount),
        currency: data.currency,
        duration: data.duration,
        interestRate: parseFloat(data.interest_rate),
        purpose: data.purpose,
        monthlyIncome: parseFloat(data.monthly_income),
        status: data.status,
        createdAt: data.created_at,
        reviewedAt: data.reviewed_at,
        reviewedBy: data.reviewed_by
      };
    } catch (error) {
      logger.error('Error creating loan application', error as Error);
      throw error;
    }
  },

  async updateStatus(id: string, status: 'approved' | 'rejected', reviewedBy: string): Promise<LoanApplication> {
    try {
      const { data, error } = await supabase
        .from('loan_applications')
        .update({
          status,
          reviewed_at: new Date().toISOString(),
          reviewed_by: reviewedBy
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return {
        id: data.id,
        userId: data.user_id,
        loanType: data.loan_type,
        amount: parseFloat(data.amount),
        currency: data.currency,
        duration: data.duration,
        interestRate: parseFloat(data.interest_rate),
        purpose: data.purpose,
        monthlyIncome: parseFloat(data.monthly_income),
        status: data.status,
        createdAt: data.created_at,
        reviewedAt: data.reviewed_at,
        reviewedBy: data.reviewed_by
      };
    } catch (error) {
      logger.error('Error updating loan application status', error as Error);
      throw error;
    }
  }
};

// Service pour les prêts
export const loanService = {
  async getByUserId(userId: string): Promise<Loan[]> {
    try {
      const { data, error } = await supabase
        .from('loans')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []).map(loan => ({
        id: loan.id,
        applicationId: loan.application_id,
        userId: loan.user_id,
        amount: parseFloat(loan.amount),
        currency: loan.currency,
        interestRate: parseFloat(loan.interest_rate),
        duration: loan.duration,
        monthlyPayment: parseFloat(loan.monthly_payment),
        remainingBalance: parseFloat(loan.remaining_balance),
        nextPaymentDate: loan.next_payment_date,
        status: loan.status,
        createdAt: loan.created_at
      }));
    } catch (error) {
      logger.error('Error fetching loans by user ID', error as Error);
      throw error;
    }
  },

  async getAll(): Promise<Loan[]> {
    try {
      const { data, error } = await supabase
        .from('loans')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []).map(loan => ({
        id: loan.id,
        applicationId: loan.application_id,
        userId: loan.user_id,
        amount: parseFloat(loan.amount),
        currency: loan.currency,
        interestRate: parseFloat(loan.interest_rate),
        duration: loan.duration,
        monthlyPayment: parseFloat(loan.monthly_payment),
        remainingBalance: parseFloat(loan.remaining_balance),
        nextPaymentDate: loan.next_payment_date,
        status: loan.status,
        createdAt: loan.created_at
      }));
    } catch (error) {
      logger.error('Error fetching all loans', error as Error);
      throw error;
    }
  },

  async create(loan: Omit<Loan, 'id' | 'createdAt'>): Promise<Loan> {
    try {
      const { data, error } = await supabase
        .from('loans')
        .insert([{
          application_id: loan.applicationId,
          user_id: loan.userId,
          amount: loan.amount,
          currency: loan.currency,
          interest_rate: loan.interestRate,
          duration: loan.duration,
          monthly_payment: loan.monthlyPayment,
          remaining_balance: loan.remainingBalance,
          next_payment_date: loan.nextPaymentDate,
          status: loan.status
        }])
        .select()
        .single();

      if (error) throw error;
      return {
        id: data.id,
        applicationId: data.application_id,
        userId: data.user_id,
        amount: parseFloat(data.amount),
        currency: data.currency,
        interestRate: parseFloat(data.interest_rate),
        duration: data.duration,
        monthlyPayment: parseFloat(data.monthly_payment),
        remainingBalance: parseFloat(data.remaining_balance),
        nextPaymentDate: data.next_payment_date,
        status: data.status,
        createdAt: data.created_at
      };
    } catch (error) {
      logger.error('Error creating loan', error as Error);
      throw error;
    }
  }
};