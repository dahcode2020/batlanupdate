import React from 'react';
import { LogOut, User, Bell, X, Clock } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../hooks/useNotifications';
import { useSessionTimeout, disableSessionTimer } from '../../hooks/useSessionTimeout';

const Header: React.FC = () => {
  const { user, logout } = useAuth();
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const { getRemainingTime, resetTimer } = useSessionTimeout();
  const [showNotifications, setShowNotifications] = React.useState(false);
  const [showSessionInfo, setShowSessionInfo] = React.useState(false);

  const getTimeAgo = (timestamp: string) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffInMinutes = Math.floor((now.getTime() - time.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'À l\'instant';
    if (diffInMinutes < 60) return `${diffInMinutes} min`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h`;
    return `${Math.floor(diffInMinutes / 1440)}j`;
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'info': return 'border-l-blue-500 bg-blue-50';
      case 'warning': return 'border-l-yellow-500 bg-yellow-50';
      case 'success': return 'border-l-green-500 bg-green-50';
      case 'error': return 'border-l-red-500 bg-red-50';
      default: return 'border-l-gray-500 bg-gray-50';
    }
  };

  const formatRemainingTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const handleExtendSession = () => {
    // Désactiver temporairement le timer pendant l'extension
    disableSessionTimer(5000); // 5 secondes
    
    resetTimer();
    setShowSessionInfo(false);
    
    setTimeout(() => {
      alert('✅ Session prolongée de 5 minutes supplémentaires');
    }, 200);
  };

  return (
    <header className="bg-white shadow-sm border-b border-gray-200 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <img 
              src="/BACI-Logo-slogan.png" 
              alt="Banque Atlantique" 
              className="h-10 w-auto"
            />
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="relative">
              <button 
                onClick={() => setShowSessionInfo(!showSessionInfo)}
                className="p-2 text-gray-400 hover:text-gray-500 relative"
                title="Informations de session"
              >
                <Clock className="h-6 w-6" />
              </button>

              {/* Session Info Dropdown */}
              {showSessionInfo && (
                <div className="session-info-dropdown absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-xl border border-gray-200 z-50">
                  <div className="p-4 border-b border-gray-200">
                    <div className="flex justify-between items-center">
                      <h3 className="text-lg font-semibold text-gray-900">Session Active</h3>
                      <button
                        onClick={() => setShowSessionInfo(false)}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        <X className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                  
                  <div className="p-4">
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Temps restant :</span>
                        <span className="text-lg font-bold text-orange-600">
                          {formatRemainingTime(getRemainingTime())}
                        </span>
                      </div>
                      
                      <div className="bg-orange-50 p-3 rounded-lg">
                        <p className="text-sm text-orange-800">
                          <Clock className="h-4 w-4 inline mr-1" />
                          Votre session expirera automatiquement après 5 minutes d'inactivité pour des raisons de sécurité.
                        </p>
                      </div>
                      
                      <button
                        onClick={handleExtendSession}
                        className="w-full px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
                      >
                        Prolonger la session
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            <div className="relative">
              <button 
                onClick={() => setShowNotifications(!showNotifications)}
                className="p-2 text-gray-400 hover:text-gray-500 relative"
              >
              <Bell className="h-6 w-6" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 block h-5 w-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center font-medium">
                    {unreadCount}
                  </span>
                )}
              </button>

              {/* Notifications Dropdown */}
              {showNotifications && (
                <div className="notification-dropdown absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-xl border border-gray-200 z-50">
                  <div className="p-4 border-b border-gray-200">
                    <div className="flex justify-between items-center">
                      <h3 className="text-lg font-semibold text-gray-900">Notifications</h3>
                      <button
                        onClick={() => setShowNotifications(false)}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        <X className="h-5 w-5" />
                      </button>
                    </div>
                    {unreadCount > 0 && (
                      <p className="text-sm text-gray-500 mt-1">
                        {unreadCount} nouvelle(s) notification(s)
                      </p>
                    )}
                  </div>
                  
                  <div className="max-h-96 overflow-y-auto">
                    {notifications.map((notification) => (
                      <div
                        key={notification.id}
                        onClick={() => markAsRead(notification.id)}
                        className={`p-4 border-l-4 border-b border-gray-100 hover:bg-gray-50 cursor-pointer ${getNotificationColor(notification.type)} ${
                          !notification.read ? 'bg-opacity-100' : 'bg-opacity-50'
                        }`}
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <h4 className={`text-sm font-medium ${
                              !notification.read ? 'text-gray-900' : 'text-gray-700'
                            }`}>
                              {notification.title}
                            </h4>
                            <p className="text-sm text-gray-600 mt-1">
                              {notification.message}
                            </p>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className="text-xs text-gray-500">
                              {getTimeAgo(notification.timestamp)}
                            </span>
                            {!notification.read && (
                              <span className="w-2 h-2 bg-orange-500 rounded-full"></span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  <div className="p-4 border-t border-gray-200">
                    <button 
                      onClick={markAllAsRead}
                      className="w-full text-center text-sm text-orange-600 hover:text-orange-700 font-medium"
                    >
                      Voir toutes les notifications
                    </button>
                  </div>
                </div>
              )}
            </div>
            
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2">
                <User className="h-5 w-5 text-gray-400" />
                <span className="text-sm font-medium text-gray-700">
                  {user?.firstName} {user?.lastName}
                </span>
                <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                  {user?.role === 'admin' ? 'Administrateur' : 'Client'}
                </span>
              </div>
              
              <button
                onClick={logout}
                className="flex items-center space-x-1 text-gray-500 hover:text-gray-700 px-3 py-2 rounded-md text-sm font-medium"
              >
                <LogOut className="h-4 w-4" />
                <span>Déconnexion</span>
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Overlay to close notifications when clicking outside */}
      {(showNotifications || showSessionInfo) && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => {
            setShowNotifications(false);
            setShowSessionInfo(false);
          }}
        ></div>
      )}
    </header>
  );
};

export default Header;