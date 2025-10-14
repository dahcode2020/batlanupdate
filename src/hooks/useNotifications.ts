import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { logger } from '../utils/logger';

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  timestamp: string;
  read: boolean;
  userId: string;
  relatedId?: string;
  relatedType?: 'loan_application' | 'transaction';
}

export const useNotifications = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  // Charger les notifications existantes
  useEffect(() => {
    if (!user) return;

    const loadNotifications = async () => {
      try {
        // Simuler des notifications basées sur les données existantes
        const mockNotifications: Notification[] = [
          {
            id: '1',
            title: 'Demande de crédit en cours',
            message: 'Votre demande de crédit est en cours d\'examen par notre équipe.',
            type: 'info',
            timestamp: new Date().toISOString(),
            read: false,
            userId: user.id,
            relatedType: 'loan_application'
          },
          {
            id: '2',
            title: 'Virement en attente',
            message: 'Votre virement est en attente de validation par l\'administrateur.',
            type: 'warning',
            timestamp: new Date(Date.now() - 3600000).toISOString(),
            read: false,
            userId: user.id,
            relatedType: 'transaction'
          }
        ];

        setNotifications(mockNotifications);
        setUnreadCount(mockNotifications.filter(n => !n.read).length);
      } catch (error) {
        logger.error('Error loading notifications', error as Error);
      } finally {
        setLoading(false);
      }
    };

    loadNotifications();
  }, [user]);

  // Écouter les changements en temps réel
  useEffect(() => {
    if (!user) return;

    // Écouter les changements sur les demandes de crédit
    const loanSubscription = supabase
      .channel('loan_applications_changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'loan_applications',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          logger.info('Loan application updated', payload);
          
          const newNotification: Notification = {
            id: `loan_${payload.new.id}_${Date.now()}`,
            title: payload.new.status === 'approved' ? 'Crédit approuvé !' : 'Crédit rejeté',
            message: payload.new.status === 'approved' 
              ? 'Félicitations ! Votre demande de crédit a été approuvée.'
              : 'Votre demande de crédit a été rejetée. Contactez votre conseiller pour plus d\'informations.',
            type: payload.new.status === 'approved' ? 'success' : 'error',
            timestamp: new Date().toISOString(),
            read: false,
            userId: user.id,
            relatedId: payload.new.id,
            relatedType: 'loan_application'
          };

          setNotifications(prev => [newNotification, ...prev]);
          setUnreadCount(prev => prev + 1);
          
          // Notification navigateur
          if (Notification.permission === 'granted') {
            new Notification(newNotification.title, {
              body: newNotification.message,
              icon: '/BACI-Logo-slogan.png'
            });
          }
        }
      )
      .subscribe();

    // Écouter les changements sur les transactions
    const transactionSubscription = supabase
      .channel('transactions_changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'transactions',
          filter: `from_account_id=in.(${user.id})`
        },
        (payload) => {
          logger.info('Transaction updated', payload);
          
          let title = '';
          let message = '';
          let type: 'success' | 'error' = 'success';

          if (payload.new.status === 'completed') {
            title = 'Virement validé !';
            message = 'Votre virement a été validé et traité avec succès.';
            type = 'success';
          } else if (payload.new.status === 'failed') {
            title = 'Virement rejeté';
            message = 'Votre virement a été rejeté. Vérifiez les détails dans votre historique.';
            type = 'error';
          }

          if (title) {
            const newNotification: Notification = {
              id: `transaction_${payload.new.id}_${Date.now()}`,
              title,
              message,
              type,
              timestamp: new Date().toISOString(),
              read: false,
              userId: user.id,
              relatedId: payload.new.id,
              relatedType: 'transaction'
            };

            setNotifications(prev => [newNotification, ...prev]);
            setUnreadCount(prev => prev + 1);
            
            // Notification navigateur
            if (Notification.permission === 'granted') {
              new Notification(newNotification.title, {
                body: newNotification.message,
                icon: '/BACI-Logo-slogan.png'
              });
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(loanSubscription);
      supabase.removeChannel(transactionSubscription);
    };
  }, [user]);

  // Demander permission pour les notifications navigateur
  useEffect(() => {
    if (Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  const markAsRead = (notificationId: string) => {
    setNotifications(prev => 
      prev.map(n => 
        n.id === notificationId ? { ...n, read: true } : n
      )
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    setUnreadCount(0);
  };

  const addNotification = (notification: Omit<Notification, 'id' | 'timestamp' | 'userId'>) => {
    const newNotification: Notification = {
      ...notification,
      id: `manual_${Date.now()}`,
      timestamp: new Date().toISOString(),
      userId: user?.id || '',
    };

    setNotifications(prev => [newNotification, ...prev]);
    if (!notification.read) {
      setUnreadCount(prev => prev + 1);
    }

    // Notification navigateur
    if (Notification.permission === 'granted') {
      const browserNotification = new Notification(newNotification.title, {
        body: newNotification.message,
        icon: '/BACI-Logo-slogan.png',
        requireInteraction: false, // Don't require user interaction
        silent: false
      });
      
      // Auto-close browser notification after 5 seconds to prevent interference
      setTimeout(() => {
        browserNotification.close();
      }, 5000);
    }
  };

  return {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    addNotification
  };
};