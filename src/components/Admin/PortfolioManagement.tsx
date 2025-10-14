import React, { useState } from 'react';
import { 
  PieChart, 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Users, 
  CreditCard,
  AlertTriangle,
  CheckCircle,
  BarChart3,
  Target,
  Activity
} from 'lucide-react';
import { useAllAccounts, useLoans, useUsers } from '../../hooks/useData';
import { formatCurrency } from '../../utils/calculations';

const PortfolioManagement: React.FC = () => {
  const { accounts: mockAccounts, loading: accountsLoading, error: accountsError } = useAllAccounts();
  const { loans: mockLoans, loading: loansLoading, error: loansError } = useLoans();
  const { users: mockUsers, loading: usersLoading, error: usersError } = useUsers();
  const [selectedPeriod, setSelectedPeriod] = useState<'1M' | '3M' | '6M' | '1Y'>('3M');
  const [selectedView, setSelectedView] = useState<'overview' | 'risk' | 'performance'>('overview');

  if (accountsLoading || loansLoading || usersLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
        <span className="ml-2 text-gray-600">Chargement du portefeuille...</span>
      </div>
    );
  }

  if (accountsError || loansError || usersError) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-800">Erreur lors du chargement des données: {accountsError || loansError || usersError}</p>
      </div>
    );
  }

  // Portfolio calculations
  const totalAssets = mockAccounts.reduce((sum, acc) => sum + acc.balance, 0);
  const totalLoans = mockLoans.reduce((sum, loan) => sum + loan.amount, 0);
  const activeLoans = mockLoans.filter(loan => loan.status === 'active');
  const totalClients = mockUsers.filter(user => user.role === 'client').length;

  // Account type distribution
  const savingsAccounts = mockAccounts.filter(acc => acc.accountType === 'savings');
  const currentAccounts = mockAccounts.filter(acc => acc.accountType === 'current');
  const loanAccounts = mockAccounts.filter(acc => acc.accountType === 'loan');

  const savingsTotal = savingsAccounts.reduce((sum, acc) => sum + acc.balance, 0);
  const currentTotal = currentAccounts.reduce((sum, acc) => sum + acc.balance, 0);
  const loanTotal = loanAccounts.reduce((sum, acc) => sum + acc.balance, 0);

  // Risk metrics
  const portfolioMetrics = [
    {
      title: 'Actifs Totaux',
      value: formatCurrency(totalAssets, 'EUR'),
      change: '+12.5%',
      trend: 'up',
      icon: DollarSign,
      color: 'blue'
    },
    {
      title: 'Prêts Actifs',
      value: activeLoans.length.toString(),
      change: '+8.3%',
      trend: 'up',
      icon: CreditCard,
      color: 'green'
    },
    {
      title: 'Taux de Recouvrement',
      value: '94.2%',
      change: '+2.1%',
      trend: 'up',
      icon: Target,
      color: 'orange'
    },
    {
      title: 'Risque Portefeuille',
      value: 'Faible',
      change: '-0.5%',
      trend: 'down',
      icon: AlertTriangle,
      color: 'red'
    }
  ];

  const riskCategories = [
    { name: 'Très Faible Risque', percentage: 45, amount: totalAssets * 0.45, color: 'bg-green-500' },
    { name: 'Faible Risque', percentage: 30, amount: totalAssets * 0.30, color: 'bg-blue-500' },
    { name: 'Risque Modéré', percentage: 20, amount: totalAssets * 0.20, color: 'bg-yellow-500' },
    { name: 'Risque Élevé', percentage: 5, amount: totalAssets * 0.05, color: 'bg-red-500' }
  ];

  const sectorDistribution = [
    { name: 'Commerce', percentage: 35, color: 'bg-blue-500' },
    { name: 'Agriculture', percentage: 25, color: 'bg-green-500' },
    { name: 'Services', percentage: 20, color: 'bg-purple-500' },
    { name: 'Artisanat', percentage: 15, color: 'bg-orange-500' },
    { name: 'Autres', percentage: 5, color: 'bg-gray-500' }
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-3">
          <PieChart className="h-8 w-8 text-orange-600" />
          <h1 className="text-3xl font-bold text-gray-900">Gestion des Portefeuilles</h1>
        </div>
        <div className="flex items-center space-x-4">
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value as '1M' | '3M' | '6M' | '1Y')}
            className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
          >
            <option value="1M">1 Mois</option>
            <option value="3M">3 Mois</option>
            <option value="6M">6 Mois</option>
            <option value="1Y">1 Année</option>
          </select>
        </div>
      </div>

      {/* View Tabs */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="flex border-b border-gray-200">
          {[
            { id: 'overview', label: 'Vue d\'ensemble', icon: BarChart3 },
            { id: 'risk', label: 'Analyse des Risques', icon: AlertTriangle },
            { id: 'performance', label: 'Performance', icon: TrendingUp }
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setSelectedView(tab.id as 'overview' | 'risk' | 'performance')}
                className={`flex items-center space-x-2 px-6 py-4 font-medium transition-colors ${
                  selectedView === tab.id
                    ? 'text-orange-600 border-b-2 border-orange-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <Icon className="h-4 w-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {portfolioMetrics.map((metric, index) => {
          const Icon = metric.icon;
          return (
            <div key={index} className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">{metric.title}</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{metric.value}</p>
                  <div className="flex items-center mt-2">
                    {metric.trend === 'up' ? (
                      <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                    ) : (
                      <TrendingDown className="h-4 w-4 text-red-500 mr-1" />
                    )}
                    <span className={`text-sm ${
                      metric.trend === 'up' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {metric.change}
                    </span>
                  </div>
                </div>
                <div className={`p-3 rounded-lg bg-${metric.color}-100`}>
                  <Icon className={`h-6 w-6 text-${metric.color}-600`} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {selectedView === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Asset Distribution */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Répartition des Actifs</h2>
              <PieChart className="h-5 w-5 text-gray-400" />
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-4 h-4 bg-blue-500 rounded-full"></div>
                  <span className="text-sm text-gray-600">Comptes d'épargne</span>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium">{formatCurrency(savingsTotal, 'EUR')}</p>
                  <p className="text-xs text-gray-500">
                    {Math.round((savingsTotal / totalAssets) * 100)}%
                  </p>
                </div>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-500 h-2 rounded-full" 
                  style={{ width: `${(savingsTotal / totalAssets) * 100}%` }}
                ></div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-4 h-4 bg-green-500 rounded-full"></div>
                  <span className="text-sm text-gray-600">Comptes courants</span>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium">{formatCurrency(currentTotal, 'EUR')}</p>
                  <p className="text-xs text-gray-500">
                    {Math.round((currentTotal / totalAssets) * 100)}%
                  </p>
                </div>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-green-500 h-2 rounded-full" 
                  style={{ width: `${(currentTotal / totalAssets) * 100}%` }}
                ></div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-4 h-4 bg-orange-500 rounded-full"></div>
                  <span className="text-sm text-gray-600">Prêts actifs</span>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium">{formatCurrency(totalLoans, 'EUR')}</p>
                  <p className="text-xs text-gray-500">
                    {Math.round((totalLoans / (totalAssets + totalLoans)) * 100)}%
                  </p>
                </div>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-orange-500 h-2 rounded-full" 
                  style={{ width: `${(totalLoans / (totalAssets + totalLoans)) * 100}%` }}
                ></div>
              </div>
            </div>
          </div>

          {/* Sector Distribution */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Répartition Sectorielle</h2>
              <BarChart3 className="h-5 w-5 text-gray-400" />
            </div>
            <div className="space-y-3">
              {sectorDistribution.map((sector, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`w-4 h-4 ${sector.color} rounded-full`}></div>
                    <span className="text-sm text-gray-600">{sector.name}</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-20 bg-gray-200 rounded-full h-2">
                      <div 
                        className={`${sector.color} h-2 rounded-full`}
                        style={{ width: `${sector.percentage}%` }}
                      ></div>
                    </div>
                    <span className="text-sm font-medium w-10 text-right">{sector.percentage}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {selectedView === 'risk' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Risk Analysis */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Analyse des Risques</h2>
              <AlertTriangle className="h-5 w-5 text-orange-500" />
            </div>
            <div className="space-y-4">
              {riskCategories.map((category, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">{category.name}</span>
                    <span className="text-sm font-medium">{category.percentage}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div 
                      className={`${category.color} h-3 rounded-full`}
                      style={{ width: `${category.percentage}%` }}
                    ></div>
                  </div>
                  <div className="text-xs text-gray-500">
                    {formatCurrency(category.amount, 'EUR')}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Risk Indicators */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Indicateurs de Risque</h2>
              <Activity className="h-5 w-5 text-gray-400" />
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <span className="text-sm font-medium text-green-800">Ratio de Solvabilité</span>
                </div>
                <span className="text-sm font-bold text-green-800">18.5%</span>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <CheckCircle className="h-5 w-5 text-blue-500" />
                  <span className="text-sm font-medium text-blue-800">Ratio de Liquidité</span>
                </div>
                <span className="text-sm font-bold text-blue-800">125%</span>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <AlertTriangle className="h-5 w-5 text-orange-500" />
                  <span className="text-sm font-medium text-orange-800">Créances Douteuses</span>
                </div>
                <span className="text-sm font-bold text-orange-800">2.1%</span>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <Target className="h-5 w-5 text-purple-500" />
                  <span className="text-sm font-medium text-purple-800">Concentration Risque</span>
                </div>
                <span className="text-sm font-bold text-purple-800">Faible</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {selectedView === 'performance' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Performance Metrics */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Indicateurs de Performance</h2>
              <TrendingUp className="h-5 w-5 text-green-500" />
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <p className="text-2xl font-bold text-blue-600">15.2%</p>
                  <p className="text-sm text-blue-800">ROA</p>
                  <p className="text-xs text-blue-600">Rendement des Actifs</p>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <p className="text-2xl font-bold text-green-600">22.8%</p>
                  <p className="text-sm text-green-800">ROE</p>
                  <p className="text-xs text-green-600">Rendement des Fonds Propres</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-4 bg-orange-50 rounded-lg">
                  <p className="text-2xl font-bold text-orange-600">68%</p>
                  <p className="text-sm text-orange-800">Ratio d'Efficacité</p>
                  <p className="text-xs text-orange-600">Charges/Produits</p>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <p className="text-2xl font-bold text-purple-600">94.2%</p>
                  <p className="text-sm text-purple-800">Taux de Recouvrement</p>
                  <p className="text-xs text-purple-600">Créances recouvrées</p>
                </div>
              </div>
            </div>
          </div>

          {/* Growth Trends */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Tendances de Croissance</h2>
              <BarChart3 className="h-5 w-5 text-gray-400" />
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Croissance du Portefeuille</span>
                <div className="flex items-center space-x-2">
                  <TrendingUp className="h-4 w-4 text-green-500" />
                  <span className="text-sm font-medium text-green-600">+12.5%</span>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Nouveaux Clients</span>
                <div className="flex items-center space-x-2">
                  <TrendingUp className="h-4 w-4 text-blue-500" />
                  <span className="text-sm font-medium text-blue-600">+18.3%</span>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Volume des Prêts</span>
                <div className="flex items-center space-x-2">
                  <TrendingUp className="h-4 w-4 text-orange-500" />
                  <span className="text-sm font-medium text-orange-600">+8.7%</span>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Dépôts Clients</span>
                <div className="flex items-center space-x-2">
                  <TrendingUp className="h-4 w-4 text-purple-500" />
                  <span className="text-sm font-medium text-purple-600">+15.2%</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PortfolioManagement;