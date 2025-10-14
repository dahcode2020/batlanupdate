import React from 'react';
import { 
  Home, 
  Users, 
  CreditCard, 
  TrendingUp, 
  CheckCircle, 
  Calculator,
  ArrowLeftRight,
  FileText,
  PieChart,
  User
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab }) => {
  const { user } = useAuth();

  const adminMenuItems = [
    { id: 'dashboard', label: 'Tableau de Bord', icon: Home },
    { id: 'clients', label: 'Gestion Clients', icon: Users },
    { id: 'portfolio', label: 'Portefeuilles', icon: PieChart },
    { id: 'loan-validation', label: 'Validation Crédits', icon: CheckCircle },
    { id: 'transfer-validation', label: 'Validation Virements', icon: ArrowLeftRight },
    { id: 'calculator', label: 'Calculateurs', icon: Calculator },
  ];

  const clientMenuItems = [
    { id: 'dashboard', label: 'Tableau de Bord', icon: Home },
    { id: 'accounts', label: 'Mes Comptes', icon: CreditCard },
    { id: 'profile', label: 'Mon Profil', icon: User },
    { id: 'loan-request', label: 'Demande de Crédit', icon: FileText },
    { id: 'transfers', label: 'Virements', icon: ArrowLeftRight },
    { id: 'calculator', label: 'Calculateurs', icon: Calculator },
  ];

  const menuItems = user?.role === 'admin' ? adminMenuItems : clientMenuItems;

  return (
    <div className="bg-gray-900 text-white w-64 min-h-screen">
      <div className="p-6">
        <h2 className="text-xl font-bold text-orange-400 mb-8">
          {user?.role === 'admin' ? 'Administration' : 'Espace Client'}
        </h2>
        
        <nav className="space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-colors ${
                  activeTab === item.id
                    ? 'bg-orange-600 text-white'
                    : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                }`}
              >
                <Icon className="h-5 w-5" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>
    </div>
  );
};

export default Sidebar;