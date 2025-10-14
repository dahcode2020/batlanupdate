import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';
import { userService } from '../services/database';
import { logger } from '../utils/logger';
import { supabase } from '../lib/supabase';
import { config } from '../config/environment';

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  isAuthenticated: boolean;
  loginAttempts: number;
  isLocked: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loginAttempts, setLoginAttempts] = useState<number>(0);
  const [isLocked, setIsLocked] = useState<boolean>(false);

  useEffect(() => {
    const loadUser = async () => {
      // Pour la démo, vérifier s'il y a un utilisateur stocké localement
      const storedUser = localStorage.getItem('currentUser');
      const storedAttempts = localStorage.getItem('loginAttempts');
      const lockExpiry = localStorage.getItem('lockExpiry');
      
      // Check if account is locked
      if (lockExpiry && new Date().getTime() < parseInt(lockExpiry)) {
        setIsLocked(true);
        setLoginAttempts(config.security.maxLoginAttempts);
      } else if (lockExpiry) {
        // Lock expired, reset
        localStorage.removeItem('lockExpiry');
        localStorage.removeItem('loginAttempts');
        setIsLocked(false);
        setLoginAttempts(0);
      }
      
      if (storedAttempts) {
        setLoginAttempts(parseInt(storedAttempts));
      }
      
      if (storedUser) {
        try {
          const parsedUser = JSON.parse(storedUser);
          setUser(parsedUser);
          logger.info('User session restored', { 
            userId: parsedUser.id, 
            username: parsedUser.username,
            role: parsedUser.role 
          });
        } catch (error) {
          logger.error('Failed to restore user session', error as Error);
          localStorage.removeItem('currentUser');
          setUser(null);
        }
      } else {
        setUser(null);
      }
    };

    loadUser();
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    if (isLocked) {
      const lockExpiry = localStorage.getItem('lockExpiry');
      if (lockExpiry) {
        const remainingTime = Math.ceil((parseInt(lockExpiry) - new Date().getTime()) / 60000);
        logger.warn('Login attempt while locked', { email, remainingTime });
        throw new Error(`Compte verrouillé. Réessayez dans ${remainingTime} minute(s).`);
      }
    }

    try {
      logger.info('Login attempt', { email, attempt: loginAttempts + 1 });
      
      // Authentification avec la table users (mode démo)
      let users = null;
      let error = null;
      
      try {
        // Première tentative : authentification par email
        let { data, error: dbError } = await supabase
          .from('users')
          .select('*')
          .eq('email', email)
          .eq('password_hash', password)
          .maybeSingle();
        
        // Si pas trouvé par email, essayer par username
        if (!data && !dbError) {
          const result = await supabase
            .from('users')
            .select('*')
            .eq('username', email)
            .eq('password_hash', password)
            .maybeSingle();
          
          data = result.data;
          dbError = result.error;
        }
        
        users = data;
        error = dbError;
      } catch (dbErr) {
        logger.error('Database connection error', dbErr as Error);
        // Fallback pour les comptes de test en cas de problème DB
        const testAccounts = [
          { id: 'admin-1', username: 'admin', password_hash: 'admin1237575@@xyz', role: 'admin', first_name: 'Administrateur', last_name: 'Système', email: 'admin@banqueatlantique.tg', phone: '+228-90-12-34-56', address: 'Siège Social, Lomé, Togo', created_at: new Date().toISOString() },
          { id: 'client-1', username: 'client1', password_hash: 'client123', role: 'client', first_name: 'Jean', last_name: 'Dupont', email: 'jean.dupont@email.com', phone: '+228-91-23-45-67', address: '123 Rue de la Paix, Lomé, Togo', created_at: new Date().toISOString() },
          { id: 'client-2', username: 'client2', password_hash: 'client123', role: 'client', first_name: 'Marie', last_name: 'Martin', email: 'marie.martin@email.com', phone: '+228-92-34-56-78', address: '456 Avenue de l\'Indépendance, Lomé, Togo', created_at: new Date().toISOString() }
        ];
        
        users = testAccounts.find(acc => 
          (acc.email === email || acc.username === email) && acc.password_hash === password
        ) || null;
        
        if (users) {
          logger.info('Using fallback authentication', { email });
        }
      }

      if (error) {
        logger.error('Login error', error);
        throw new Error('Erreur de connexion à la base de données');
      }

      if (users) {
        const fetchedUser = userService.mapUserFromDb(users);
        setUser(fetchedUser);
        
        // Store user session
        localStorage.setItem('currentUser', JSON.stringify(fetchedUser));
        
        // Reset login attempts on successful login
        setLoginAttempts(0);
        setIsLocked(false);
        localStorage.removeItem('loginAttempts');
        localStorage.removeItem('lockExpiry');
        
        logger.info('User logged in successfully', { 
          userId: users.id, 
          email: users.email,
          role: users.role,
          previousAttempts: loginAttempts
        });
        
        return true;
      } else {
        // Failed login attempt
        const newAttempts = loginAttempts + 1;
        setLoginAttempts(newAttempts);
        localStorage.setItem('loginAttempts', newAttempts.toString());
        
        logger.warn('Failed login attempt', { 
          email, 
          attempt: newAttempts, 
          maxAttempts: config.security.maxLoginAttempts 
        });
        
        if (newAttempts >= config.security.maxLoginAttempts) {
          // Lock account for 15 minutes
          const lockExpiry = new Date().getTime() + (15 * 60 * 1000);
          localStorage.setItem('lockExpiry', lockExpiry.toString());
          setIsLocked(true);
          
          logger.error('Account locked due to too many failed attempts', undefined, { 
            email, 
            attempts: newAttempts,
            lockExpiry: new Date(lockExpiry).toISOString()
          });
          
          throw new Error('Trop de tentatives échouées. Compte verrouillé pour 15 minutes.');
        }
        
        const remainingAttempts = config.security.maxLoginAttempts - newAttempts;
        throw new Error(`Identifiants incorrects. ${remainingAttempts} tentative(s) restante(s).`);
      }
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      logger.error('Unexpected login error', error as Error);
      throw new Error('Erreur de connexion inattendue');
    }
  };

  const logout = async () => {
    logger.info('User logged out', { 
      userId: user?.id,
      username: user?.username,
      sessionDuration: user ? Date.now() - new Date(user.createdAt).getTime() : 0
    });
    
    localStorage.removeItem('currentUser');
    
    // Clear any session timers or data
    sessionStorage.clear();
    
    setUser(null);
  };

  const value = {
    user,
    login,
    logout,
    isAuthenticated: !!user,
    loginAttempts,
    isLocked
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};