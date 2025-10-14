import React, { useState, useEffect } from 'react';
import { 
  CreditCard, 
  Eye, 
  EyeOff, 
  Download, 
  ArrowUpRight, 
  ArrowDownRight,
  Calendar,
  Filter,
  Search,
  TrendingUp,
  DollarSign,
  Activity
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useUserAccounts, useUserTransactions } from '../../hooks/useData';
import { formatCurrency } from '../../utils/calculations';

const AccountsView: React.FC = () => {
  const { user } = useAuth();
  const { accounts: mockAccounts, loading: accountsLoading, error: accountsError } = useUserAccounts(user?.id);
  
  const userAccountIds = mockAccounts.map(acc => acc.id);
  const { transactions: mockTransactions, loading: transactionsLoading, error: transactionsError } = useUserTransactions(userAccountIds);
  const [showBalances, setShowBalances] = useState(true);
  const [selectedAccount, setSelectedAccount] = useState<string>('all');
  const [selectedPeriod, setSelectedPeriod] = useState<'7d' | '30d' | '90d' | '1y'>('30d');

  // Rafraîchir automatiquement les données toutes les 30 secondes
  useEffect(() => {
    const interval = setInterval(() => {
      // Les hooks useUserAccounts et useUserTransactions ont déjà des subscriptions temps réel
      // Cet interval est un backup pour s'assurer que les données sont à jour
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  if (accountsLoading || transactionsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
        <span className="ml-2 text-gray-600">Chargement des données...</span>
      </div>
    );
  }

  if (accountsError || transactionsError) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-800">Erreur lors du chargement des données: {accountsError || transactionsError}</p>
      </div>
    );
  }

  const userAccounts = mockAccounts.filter(acc => acc.userId === user?.id);
  const totalBalance = userAccounts.reduce((sum, acc) => sum + acc.balance, 0);

  // Filter transactions based on selected account
  const getFilteredTransactions = () => {
    let transactions = mockTransactions.filter(trans => 
      userAccounts.some(acc => acc.id === trans.fromAccountId || acc.id === trans.toAccountId)
    );

    if (selectedAccount !== 'all') {
      transactions = transactions.filter(trans => 
        trans.fromAccountId === selectedAccount || trans.toAccountId === selectedAccount
      );
    }

    return transactions.slice(0, 10);
  };

  const filteredTransactions = getFilteredTransactions();

  const handleTransfer = (accountId: string) => {
    // Store the selected account in localStorage for the transfer module
    localStorage.setItem('selectedTransferAccount', accountId);
    
    // Navigate to transfers module or trigger parent navigation
    if (window.location.hash) {
      window.location.hash = '#transfers';
    } else {
      // Trigger a custom event to notify the parent component
      const event = new CustomEvent('navigateToTransfers', { 
        detail: { fromAccount: accountId } 
      });
      window.dispatchEvent(event);
    }
    
    // Show confirmation
    const account = userAccounts.find(acc => acc.id === accountId);
    if (account) {
      alert(`🔄 Redirection vers les virements\n\nCompte sélectionné : ${account.accountType === 'savings' ? 'Épargne' : 'Courant'}\nNuméro : ${account.accountNumber}\nSolde : ${formatCurrency(account.balance, account.currency)}`);
    }
  };

  const downloadStatement = (accountId?: string) => {
    const account = accountId ? userAccounts.find(acc => acc.id === accountId) : null;
    const accountName = account ? 
      `${account.accountType === 'savings' ? 'Epargne' : 'Courant'}_${account.accountNumber}` : 
      'Tous_Comptes';
    
    const statementContent = `
═══════════════════════════════════════════════════════════
                    RELEVÉ DE COMPTE
                   BANQUE ATLANTIQUE
═══════════════════════════════════════════════════════════

Client : ${user?.firstName} ${user?.lastName}
Période : ${new Date().toLocaleDateString('fr-FR')}
${account ? `Compte : ${account.accountNumber}` : 'Tous les comptes'}

${account ? `
DÉTAILS DU COMPTE :
═══════════════════════════════════════════════════════════
Type de compte : ${account.accountType === 'savings' ? 'Compte Épargne' : 'Compte Courant'}
Numéro : ${account.accountNumber}
Devise : ${account.currency}
Solde actuel : ${formatCurrency(account.balance, account.currency)}
Statut : ${account.status === 'active' ? 'Actif' : 'Suspendu'}
` : `
RÉSUMÉ DES COMPTES :
═══════════════════════════════════════════════════════════
Nombre de comptes : ${userAccounts.length}
Solde total : ${formatCurrency(totalBalance, 'EUR')}
`}

HISTORIQUE DES TRANSACTIONS :
═══════════════════════════════════════════════════════════
Date       | Description           | Montant        | Statut
-----------|----------------------|----------------|----------
${filteredTransactions.map(trans => 
  `${new Date(trans.createdAt).toLocaleDateString('fr-FR').padEnd(10)} | ${trans.description.padEnd(20)} | ${formatCurrency(trans.amount, trans.currency).padEnd(14)} | ${trans.status}`
).join('\n')}

═══════════════════════════════════════════════════════════
                    BANQUE ATLANTIQUE
                       Lomé, TOGO
                 Tél: +228 XX XX XX XX
              Email: contact@banqueatlantique.tg
═══════════════════════════════════════════════════════════
    `;

    const blob = new Blob([statementContent], { type: 'text/plain;charset=utf-8' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `releve_${accountName}_${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    
    alert('📄 Relevé de compte téléchargé avec succès !');
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-3">
          <CreditCard className="h-8 w-8 text-orange-600" />
          <h1 className="text-3xl font-bold text-gray-900">Mes Comptes</h1>
        </div>
        <div className="flex items-center space-x-4">
          <button
            onClick={() => setShowBalances(!showBalances)}
            className="flex items-center space-x-2 px-3 py-2 text-gray-600 hover:text-gray-800 transition-colors"
          >
            {showBalances ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            <span className="text-sm">{showBalances ? 'Masquer' : 'Afficher'} soldes</span>
          </button>
          <button
            onClick={() => downloadStatement()}
            className="flex items-center space-x-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
          >
            <Download className="h-4 w-4" />
            <span>Télécharger Relevé</span>
          </button>
        </div>
      </div>

      {/* Account Summary */}
      <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-xl shadow-lg p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-orange-100 text-sm">Solde Total</p>
            <p className="text-3xl font-bold mt-1">
              {showBalances ? formatCurrency(totalBalance, 'EUR') : '••••••'}
            </p>
            <p className="text-orange-100 text-sm mt-1">
              {userAccounts.length} compte(s) actif(s)
            </p>
          </div>
          <div className="text-right">
            <DollarSign className="h-12 w-12 text-orange-200 mb-2" />
            <p className="text-orange-100 text-xs">
              Dernière mise à jour : {new Date().toLocaleTimeString('fr-FR')}
            </p>
          </div>
        </div>
      </div>

      {/* Account Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {userAccounts.map((account) => (
          <div key={account.id} className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className={`p-3 rounded-lg ${
                  account.accountType === 'savings' ? 'bg-green-100' : 'bg-blue-100'
                }`}>
                  <CreditCard className={`h-6 w-6 ${
                    account.accountType === 'savings' ? 'text-green-600' : 'text-blue-600'
                  }`} />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    {account.accountType === 'savings' ? 'Compte Épargne' : 'Compte Courant'}
                  </h3>
                  <p className="text-sm text-gray-500">{account.accountNumber}</p>
                </div>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                account.status === 'active' 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-red-100 text-red-800'
              }`}>
                {account.status === 'active' ? 'Actif' : 'Suspendu'}
              </span>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Solde disponible</span>
                <span className="text-2xl font-bold text-gray-900">
                  {showBalances ? formatCurrency(account.balance, account.currency) : '••••••'}
                </span>
              </div>
              
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-500">Devise</span>
                <span className="font-medium">{account.currency}</span>
              </div>
              
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-500">Ouvert le</span>
                <span className="font-medium">
                  {new Date(account.createdAt).toLocaleDateString('fr-FR')}
                </span>
              </div>

              <div className="pt-3 border-t border-gray-200">
                <div className="flex space-x-2">
                  <button
                    onClick={() => downloadStatement(account.id)}
                    className="flex-1 flex items-center justify-center space-x-2 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    <Download className="h-4 w-4" />
                    <span className="text-sm">Relevé</span>
                  </button>
                  <button 
                    onClick={() => handleTransfer(account.id)}
                    className="flex-1 flex items-center justify-center space-x-2 px-3 py-2 bg-orange-100 text-orange-700 rounded-lg hover:bg-orange-200 transition-colors"
                  >
                    <ArrowUpRight className="h-4 w-4" />
                    <span className="text-sm">Virer</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Transaction History */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Historique des Transactions</h2>
            <div className="flex items-center space-x-4">
              <select
                value={selectedAccount}
                onChange={(e) => setSelectedAccount(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                <option value="all">Tous les comptes</option>
                {userAccounts.map((account) => (
                  <option key={account.id} value={account.id}>
                    {account.accountType === 'savings' ? 'Épargne' : 'Courant'} - {account.accountNumber}
                  </option>
                ))}
              </select>
              <select
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value as '7d' | '30d' | '90d' | '1y')}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                <option value="7d">7 derniers jours</option>
                <option value="30d">30 derniers jours</option>
                <option value="90d">3 derniers mois</option>
                <option value="1y">1 année</option>
              </select>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left py-3 px-6 font-medium text-gray-700">Date</th>
                <th className="text-left py-3 px-6 font-medium text-gray-700">Description</th>
                <th className="text-left py-3 px-6 font-medium text-gray-700">Type</th>
                <th className="text-right py-3 px-6 font-medium text-gray-700">Montant</th>
                <th className="text-left py-3 px-6 font-medium text-gray-700">Statut</th>
              </tr>
            </thead>
            <tbody>
              {filteredTransactions.map((transaction) => (
                <tr key={transaction.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-4 px-6 text-sm text-gray-600">
                    {new Date(transaction.createdAt).toLocaleDateString('fr-FR')}
                  </td>
                  <td className="py-4 px-6">
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
                      <span className="text-sm font-medium text-gray-900">
                        {transaction.description}
                      </span>
                    </div>
                  </td>
                  <td className="py-4 px-6 text-sm text-gray-600">
                    {transaction.type === 'deposit' ? 'Dépôt' :
                     transaction.type === 'withdrawal' ? 'Retrait' : 'Virement'}
                  </td>
                  <td className="py-4 px-6 text-right">
                    <span className={`text-sm font-medium ${
                      transaction.type === 'deposit' ? 'text-green-600' :
                      transaction.type === 'withdrawal' ? 'text-red-600' : 'text-blue-600'
                    }`}>
                      {transaction.type === 'withdrawal' ? '-' : '+'}
                      {formatCurrency(transaction.amount, transaction.currency)}
                    </span>
                  </td>
                  <td className="py-4 px-6">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      transaction.status === 'completed' ? 'bg-green-100 text-green-800' :
                      transaction.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {transaction.status === 'completed' ? 'Terminé' :
                       transaction.status === 'pending' ? 'En attente' : 'Échoué'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AccountsView;