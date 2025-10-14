import React from 'react';
import { 
  CreditCard, 
  TrendingUp, 
  Clock, 
  AlertCircle,
  DollarSign,
  ArrowUpRight,
  ArrowDownRight,
  Calendar
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useUserAccounts, useUserTransactions, useLoans } from '../../hooks/useData';
import { formatCurrency } from '../../utils/calculations';

const ClientDashboard: React.FC = () => {
  const { user } = useAuth();
  const { accounts: mockAccounts, loading: accountsLoading, error: accountsError } = useUserAccounts(user?.id);
  
  const userAccountIds = mockAccounts.map(acc => acc.id);
  const { transactions: mockTransactions, loading: transactionsLoading, error: transactionsError } = useUserTransactions(userAccountIds);
  const { loans: mockLoans, loading: loansLoading, error: loansError } = useLoans();

  if (accountsLoading || transactionsLoading || loansLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
        <span className="ml-2 text-gray-600">Chargement de votre tableau de bord...</span>
      </div>
    );
  }

  if (accountsError || transactionsError || loansError) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-800">Erreur lors du chargement des données: {accountsError || transactionsError || loansError}</p>
      </div>
    );
  }
  
  const userAccounts = mockAccounts.filter(acc => acc.userId === user?.id);
  const userTransactions = mockTransactions.filter(
    trans => userAccounts.some(acc => acc.id === trans.fromAccountId || acc.id === trans.toAccountId)
  ).slice(0, 5);
  const userLoans = mockLoans.filter(loan => loan.userId === user?.id);
  
  const totalBalance = userAccounts.reduce((sum, acc) => sum + acc.balance, 0);
  const activeLoans = userLoans.filter(loan => loan.status === 'active');

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Bonjour, {user?.firstName} {user?.lastName}
          </h1>
          <p className="text-gray-600 mt-1">Voici un aperçu de vos finances</p>
        </div>
        <div className="text-sm text-gray-500">
          {new Date().toLocaleDateString('fr-FR', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          })}
        </div>
      </div>

      {/* Account Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl shadow-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm">Solde Total</p>
              <p className="text-2xl font-bold mt-1">{formatCurrency(totalBalance, 'EUR')}</p>
              <p className="text-blue-100 text-sm mt-1">
                {userAccounts.length} compte(s) actif(s)
              </p>
            </div>
            <DollarSign className="h-8 w-8 text-blue-200" />
          </div>
        </div>

        <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-xl shadow-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm">Prêts Actifs</p>
              <p className="text-2xl font-bold mt-1">{activeLoans.length}</p>
              <p className="text-green-100 text-sm mt-1">
                {activeLoans.length > 0 ? 'Paiement à jour' : 'Aucun prêt'}
              </p>
            </div>
            <CreditCard className="h-8 w-8 text-green-200" />
          </div>
        </div>

        <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-xl shadow-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-100 text-sm">Transactions ce mois</p>
              <p className="text-2xl font-bold mt-1">{userTransactions.length}</p>
              <p className="text-orange-100 text-sm mt-1">Activité normale</p>
            </div>
            <TrendingUp className="h-8 w-8 text-orange-200" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* My Accounts */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Mes Comptes</h2>
            <CreditCard className="h-5 w-5 text-gray-400" />
          </div>
          <div className="space-y-3">
            {userAccounts.map((account) => (
              <div key={account.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {account.accountType === 'savings' ? 'Compte Épargne' : 'Compte Courant'}
                  </p>
                  <p className="text-xs text-gray-500">{account.accountNumber}</p>
                  <p className={`text-xs px-2 py-1 rounded-full mt-1 inline-block ${
                    account.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {account.status === 'active' ? 'Actif' : 'Suspendu'}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-gray-900">
                    {formatCurrency(account.balance, account.currency)}
                  </p>
                  <p className="text-xs text-gray-500">{account.currency}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Transactions */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Transactions Récentes</h2>
            <TrendingUp className="h-5 w-5 text-gray-400" />
          </div>
          <div className="space-y-3">
            {userTransactions.length > 0 ? userTransactions.map((transaction) => (
              <div key={transaction.id} className="flex items-center justify-between p-3 border-b border-gray-100 last:border-b-0">
                <div className="flex items-center space-x-3">
                  <div className={`p-2 rounded-full ${
                    transaction.type === 'deposit' ? 'bg-green-100' :
                    transaction.type === 'withdrawal' ? 'bg-red-100' : 'bg-blue-100'
                  }`}>
                    {transaction.type === 'deposit' ? (
                      <ArrowDownRight className="h-4 w-4 text-green-600" />
                    ) : transaction.type === 'withdrawal' ? (
                      <ArrowUpRight className="h-4 w-4 text-red-600" />
                    ) : (
                      <ArrowUpRight className="h-4 w-4 text-blue-600" />
                    )}
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
                </div>
              </div>
            )) : (
              <p className="text-gray-500 text-center py-4">Aucune transaction récente</p>
            )}
          </div>
        </div>
      </div>

      {/* Active Loans */}
      {activeLoans.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Mes Prêts Actifs</h2>
            <Clock className="h-5 w-5 text-gray-400" />
          </div>
          <div className="space-y-4">
            {activeLoans.map((loan) => (
              <div key={loan.id} className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-medium text-gray-900">
                    Prêt #{loan.id}
                  </h3>
                  <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                    Actif
                  </span>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <p className="text-gray-500">Montant initial</p>
                    <p className="font-medium">{formatCurrency(loan.amount, loan.currency)}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Solde restant</p>
                    <p className="font-medium">{formatCurrency(loan.remainingBalance, loan.currency)}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Mensualité</p>
                    <p className="font-medium">{formatCurrency(loan.monthlyPayment, loan.currency)}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Prochain paiement</p>
                    <p className="font-medium">
                      {new Date(loan.nextPaymentDate).toLocaleDateString('fr-FR')}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Actions Rapides</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <button 
            onClick={() => window.location.href = '#transfers'}
            className="p-4 text-center bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
          >
            <ArrowUpRight className="h-6 w-6 text-blue-600 mx-auto mb-2" />
            <p className="text-sm font-medium text-blue-900">Virement</p>
          </button>
          <button 
            onClick={() => window.location.href = '#loan-request'}
            className="p-4 text-center bg-green-50 hover:bg-green-100 rounded-lg transition-colors"
          >
            <CreditCard className="h-6 w-6 text-green-600 mx-auto mb-2" />
            <p className="text-sm font-medium text-green-900">Demande Crédit</p>
          </button>
          <button 
            onClick={() => window.location.href = '#calculator'}
            className="p-4 text-center bg-orange-50 hover:bg-orange-100 rounded-lg transition-colors"
          >
            <Calendar className="h-6 w-6 text-orange-600 mx-auto mb-2" />
            <p className="text-sm font-medium text-orange-900">Calculateur</p>
          </button>
          <button 
            onClick={() => window.location.href = '#history'}
            className="p-4 text-center bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors"
          >
            <TrendingUp className="h-6 w-6 text-purple-600 mx-auto mb-2" />
            <p className="text-sm font-medium text-purple-900">Historique</p>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ClientDashboard;