import React from 'react';
import { 
  Users, 
  CreditCard, 
  TrendingUp, 
  AlertCircle,
  DollarSign,
  PieChart,
  Activity,
  CheckCircle
} from 'lucide-react';
import { useUsers, useAllAccounts, useAllTransactions, useLoanApplications } from '../../hooks/useData';
import { formatCurrency } from '../../utils/calculations';

const AdminDashboard: React.FC = () => {
  const { users: mockUsers, loading: usersLoading, error: usersError } = useUsers();
  const { accounts: mockAccounts, loading: accountsLoading, error: accountsError } = useAllAccounts();
  const { transactions: mockTransactions, loading: transactionsLoading, error: transactionsError } = useAllTransactions();
  const { applications: mockLoanApplications, loading: applicationsLoading, error: applicationsError } = useLoanApplications();

  if (usersLoading || accountsLoading || transactionsLoading || applicationsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
        <span className="ml-2 text-gray-600">Chargement du tableau de bord...</span>
      </div>
    );
  }

  if (usersError || accountsError || transactionsError || applicationsError) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-800">Erreur lors du chargement des données: {usersError || accountsError || transactionsError || applicationsError}</p>
      </div>
    );
  }

  const totalClients = mockUsers.filter(u => u.role === 'client').length;
  const totalAccounts = mockAccounts.length;
  const totalDeposits = mockAccounts.reduce((sum, acc) => sum + acc.balance, 0);
  const pendingLoans = mockLoanApplications.filter(app => app.status === 'pending').length;
  const recentTransactions = mockTransactions.slice(0, 5);

  const stats = [
    {
      title: 'Clients Actifs',
      value: totalClients.toString(),
      icon: Users,
      color: 'bg-blue-500',
      change: '+12%'
    },
    {
      title: 'Comptes Ouverts',
      value: totalAccounts.toString(),
      icon: CreditCard,
      color: 'bg-green-500',
      change: '+8%'
    },
    {
      title: 'Dépôts Totaux',
      value: formatCurrency(totalDeposits, 'EUR'),
      icon: DollarSign,
      color: 'bg-orange-500',
      change: '+15%'
    },
    {
      title: 'Crédits en Attente',
      value: pendingLoans.toString(),
      icon: AlertCircle,
      color: 'bg-red-500',
      change: '-5%'
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Tableau de Bord Administrateur</h1>
        <div className="text-sm text-gray-500">
          Dernière mise à jour : {new Date().toLocaleString('fr-FR')}
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div key={index} className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
                  <p className={`text-sm mt-1 ${
                    stat.change.startsWith('+') ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {stat.change} ce mois
                  </p>
                </div>
                <div className={`${stat.color} p-3 rounded-lg`}>
                  <Icon className="h-6 w-6 text-white" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Transactions */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Transactions Récentes</h2>
            <Activity className="h-5 w-5 text-gray-400" />
          </div>
          <div className="space-y-3">
            {recentTransactions.map((transaction) => (
              <div key={transaction.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className={`p-2 rounded-full ${
                    transaction.type === 'deposit' ? 'bg-green-100' :
                    transaction.type === 'withdrawal' ? 'bg-red-100' : 'bg-blue-100'
                  }`}>
                    <TrendingUp className={`h-4 w-4 ${
                      transaction.type === 'deposit' ? 'text-green-600' :
                      transaction.type === 'withdrawal' ? 'text-red-600' : 'text-blue-600'
                    }`} />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{transaction.description}</p>
                    <p className="text-xs text-gray-500">
                      {new Date(transaction.createdAt).toLocaleDateString('fr-FR')}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`text-sm font-medium ${
                    transaction.type === 'deposit' ? 'text-green-600' :
                    transaction.type === 'withdrawal' ? 'text-red-600' : 'text-blue-600'
                  }`}>
                    {transaction.type === 'withdrawal' ? '-' : '+'}
                    {formatCurrency(transaction.amount, transaction.currency)}
                  </p>
                  <p className={`text-xs px-2 py-1 rounded-full ${
                    transaction.status === 'completed' ? 'bg-green-100 text-green-800' :
                    transaction.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {transaction.status === 'completed' ? 'Terminé' :
                     transaction.status === 'pending' ? 'En attente' : 'Échoué'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Portfolio Overview */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Aperçu du Portefeuille</h2>
            <PieChart className="h-5 w-5 text-gray-400" />
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Comptes d'épargne</span>
              <span className="text-sm font-medium text-gray-900">65%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-blue-600 h-2 rounded-full" style={{ width: '65%' }}></div>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Comptes courants</span>
              <span className="text-sm font-medium text-gray-900">25%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-green-600 h-2 rounded-full" style={{ width: '25%' }}></div>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Prêts actifs</span>
              <span className="text-sm font-medium text-gray-900">10%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-orange-600 h-2 rounded-full" style={{ width: '10%' }}></div>
            </div>
          </div>
        </div>
      </div>

      {/* Alerts and Notifications */}
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Alertes et Notifications</h2>
          <AlertCircle className="h-5 w-5 text-orange-500" />
        </div>
        <div className="space-y-3">
          <div className="flex items-center space-x-3 p-3 bg-orange-50 rounded-lg border border-orange-200">
            <AlertCircle className="h-5 w-5 text-orange-500" />
            <div>
              <p className="text-sm font-medium text-orange-800">
                {pendingLoans} demande(s) de crédit en attente de validation
              </p>
              <p className="text-xs text-orange-600">Action requise</p>
            </div>
          </div>
          <div className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg border border-green-200">
            <CheckCircle className="h-5 w-5 text-green-500" />
            <div>
              <p className="text-sm font-medium text-green-800">
                Tous les systèmes fonctionnent normalement
              </p>
              <p className="text-xs text-green-600">Statut opérationnel</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;