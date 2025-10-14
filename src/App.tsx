import React from 'react';
import { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { useSessionTimeout } from './hooks/useSessionTimeout';
import ErrorBoundary from './components/Common/ErrorBoundary';
import MaintenanceMode from './components/Common/MaintenanceMode';
import { config } from './config/environment';
import { logger } from './utils/logger';
import LoginForm from './components/Auth/LoginForm';
import Header from './components/Layout/Header';
import Sidebar from './components/Layout/Sidebar';
import AdminDashboard from './components/Dashboard/AdminDashboard';
import ClientDashboard from './components/Dashboard/ClientDashboard';
import LoanCalculator from './components/Calculator/LoanCalculator';
import AccountsView from './components/Client/AccountsView';
import LoanRequest from './components/Client/LoanRequest';
import Transfers from './components/Client/Transfers';
import ClientProfile from './components/Client/ClientProfile';
import ClientManagement from './components/Admin/ClientManagement';
import PortfolioManagement from './components/Admin/PortfolioManagement';
import LoanValidation from './components/Admin/LoanValidation';
import TransferValidation from './components/Admin/TransferValidation';

const AppContent: React.FC = () => {
  const { isAuthenticated, user } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  
  // Initialize session timeout (5 minutes)
  useSessionTimeout({
    timeoutMinutes: 5,
    warningMinutes: 1
  });

  // Check for maintenance mode
  if (config.features.maintenanceMode) {
    return <MaintenanceMode />;
  }

  logger.info('App loaded', { user: user?.username, environment: config.app.environment });

  if (!isAuthenticated) {
    return <LoginForm />;
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return user?.role === 'admin' ? <AdminDashboard /> : <ClientDashboard />;
      case 'accounts':
        return user?.role === 'client' ? <AccountsView /> : <ClientDashboard />;
      case 'profile':
        return user?.role === 'client' ? <ClientProfile /> : <ClientDashboard />;
      case 'loan-request':
        return user?.role === 'client' ? <LoanRequest /> : <ClientDashboard />;
      case 'transfers':
        return user?.role === 'client' ? <Transfers /> : <ClientDashboard />;
      case 'clients':
        return user?.role === 'admin' ? <ClientManagement /> : <ClientDashboard />;
      case 'portfolio':
        return user?.role === 'admin' ? <PortfolioManagement /> : <ClientDashboard />;
      case 'loan-validation':
        return user?.role === 'admin' ? <LoanValidation /> : <ClientDashboard />;
      case 'transfer-validation':
        return user?.role === 'admin' ? <TransferValidation /> : <ClientDashboard />;
      case 'calculator':
        return <LoanCalculator />;
      default:
        return user?.role === 'admin' ? <AdminDashboard /> : <ClientDashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="flex">
        <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
        <main className="flex-1 p-6">
          {renderContent()}
        </main>
      </div>
    </div>
  );
};

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
