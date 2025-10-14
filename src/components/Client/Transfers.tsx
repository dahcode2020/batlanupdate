import React, { useState } from 'react';
import { 
  ArrowUpRight, 
  ArrowDownRight, 
  Users, 
  CreditCard, 
  Send,
  History,
  CheckCircle,
  AlertCircle,
  Clock
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useUserAccounts, useUsers, useAllTransactions } from '../../hooks/useData';
import { transactionService } from '../../services/database';
import { formatCurrency } from '../../utils/calculations';
import { useNotifications } from '../../hooks/useNotifications';
import { disableSessionTimer } from '../../hooks/useSessionTimeout';

const Transfers: React.FC = () => {
  const { user } = useAuth();
  const { addNotification } = useNotifications();
  const { accounts: mockAccounts, loading: accountsLoading, error: accountsError } = useUserAccounts(user?.id);
  const { users: mockUsers, loading: usersLoading, error: usersError } = useUsers();
  const { transactions: mockTransactions, loading: transactionsLoading, error: transactionsError } = useAllTransactions();
  const [activeTab, setActiveTab] = useState<'send' | 'history'>('send');
  const [transferData, setTransferData] = useState({
    fromAccount: '',
    toAccount: '',
    recipientType: 'internal' as 'internal' | 'external' | 'crypto',
    amount: 0,
    currency: 'EUR' as 'EUR' | 'USD' | 'FCFA',
    description: '',
    recipientName: '',
    recipientIban: '',
    recipientBank: '',
    recipientSwift: '',
    cryptoWallet: '',
    cryptoCurrency: 'BTC' as 'BTC' | 'ETH' | 'USDT'
  });
  const [isProcessing, setIsProcessing] = useState(false);

  const userAccounts = mockAccounts.filter(acc => acc.userId === user?.id);
  const otherUsers = mockUsers.filter(u => u.role === 'client' && u.id !== user?.id);
  const otherAccounts = mockAccounts.filter(acc => acc.userId !== user?.id);
  
  const userTransfers = mockTransactions.filter(trans => 
    userAccounts.some(acc => acc.id === trans.fromAccountId || acc.id === trans.toAccountId)
  );

  const handleTransfer = async () => {
    // Validation des champs requis selon le type de virement
    
    // Désactiver le timer de session pendant l'opération
    disableSessionTimer(15000); // 15 secondes
    
    const isValidInternal = transferData.recipientType === 'internal' && transferData.toAccount;
    const isValidExternal = transferData.recipientType === 'external' && 
      transferData.recipientName && transferData.recipientIban && transferData.recipientSwift;
    const isValidCrypto = transferData.recipientType === 'crypto' && 
      transferData.recipientName && transferData.cryptoWallet;
    
    if (!transferData.fromAccount || !transferData.amount || transferData.amount <= 0 ||
        (!isValidInternal && !isValidExternal && !isValidCrypto)) {
      alert('Veuillez remplir tous les champs obligatoires');
      return;
    }

    const fromAccount = userAccounts.find(acc => acc.id === transferData.fromAccount);
    const fees = transferData.recipientType === 'internal' 
      ? transferData.amount * 0.01
      : transferData.amount * 0.03;
    const totalAmount = transferData.amount + fees;
    
    if (!fromAccount || fromAccount.balance < totalAmount) {
      alert('Solde insuffisant sur le compte émetteur');
      return;
    }

    setIsProcessing(true);

    try {
      // Préparer les détails du destinataire selon le type
      let recipientDetails = '';
      if (transferData.recipientType === 'internal') {
        const toAccount = otherAccounts.find(acc => acc.id === transferData.toAccount);
        const recipient = otherUsers.find(u => u.id === toAccount?.userId);
        recipientDetails = `${recipient?.firstName} ${recipient?.lastName} - ${toAccount?.accountNumber}`;
      } else if (transferData.recipientType === 'external') {
        recipientDetails = `${transferData.recipientName} - IBAN: ${transferData.recipientIban} - SWIFT: ${transferData.recipientSwift}`;
      } else {
        recipientDetails = `${transferData.recipientName} - ${transferData.cryptoCurrency}: ${transferData.cryptoWallet}`;
      }

      // Créer la transaction dans la base de données
      const transactionData = {
        fromAccountId: transferData.fromAccount,
        toAccountId: transferData.recipientType === 'internal' ? transferData.toAccount : null,
        amount: transferData.amount,
        currency: transferData.currency,
        type: 'transfer' as const,
        description: `Virement ${
          transferData.recipientType === 'internal' ? 'interne' :
          transferData.recipientType === 'external' ? 'externe' :
          'crypto'
        } vers ${recipientDetails}${transferData.description ? ` - ${transferData.description}` : ''} - Frais: ${formatCurrency(fees, transferData.currency)}`,
        status: 'pending' as const
      };

      const newTransaction = await transactionService.create(transactionData);
      console.log('✅ Transaction créée:', newTransaction);

      // Ajouter une notification locale
      addNotification({
        title: 'Virement soumis',
        message: `Votre virement de ${formatCurrency(transferData.amount, transferData.currency)} a été soumis pour validation.`,
        type: 'info',
        read: false,
        relatedId: newTransaction.id,
        relatedType: 'transaction'
      });

      const transferId = newTransaction.id.slice(-8);
      const transferTypeLabel = transferData.recipientType === 'internal' ? 'Virement Interne' :
                               transferData.recipientType === 'external' ? 'Virement Externe' :
                               'Virement Crypto (FIAT)';
      
      // Utiliser setTimeout pour éviter que l'alert interfère avec le timer de session
      setTimeout(() => {
        alert(`✅ Virement soumis avec succès !

Détails du virement :
• Référence : ${transferId}
• Type : ${transferTypeLabel}
• Montant : ${formatCurrency(transferData.amount, transferData.currency)}
• Frais : ${formatCurrency(fees, transferData.currency)}
• Total à débiter : ${formatCurrency(totalAmount, transferData.currency)}
• Compte émetteur : ${fromAccount.accountNumber}
• Bénéficiaire : ${recipientDetails}
• Description : ${transferData.description}
• Statut : En attente de validation

Votre virement est en attente de validation par l'administrateur.
Vous recevrez une notification une fois traité.`);
      }, 100);

      // Reset form but stay on page
      setTimeout(() => {
        const shouldReset = window.confirm('Voulez-vous effectuer un nouveau virement ?\n\nCliquez "OK" pour réinitialiser le formulaire\nCliquez "Annuler" pour rester sur ce virement');
      
        if (shouldReset) {
          setTransferData({
            fromAccount: '',
            toAccount: '',
            recipientType: 'internal',
            amount: 0,
            currency: 'EUR',
            description: '',
            recipientName: '',
            recipientIban: '',
            recipientBank: '',
            recipientSwift: '',
            cryptoWallet: '',
            cryptoCurrency: 'BTC'
          });
        }
      }, 500);
      
    } catch (error) {
      console.error('❌ Erreur lors du virement:', error);
      alert('❌ Erreur lors du virement. Veuillez réessayer.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleTransferOld = async () => {
    setIsProcessing(true);

    // Old simulation code - keeping as backup
    setTimeout(() => {

      const transferId = `TR${Date.now().toString().slice(-8)}`;
      const transferTypeLabel = transferData.recipientType === 'internal' ? 'Virement Interne' :
                               transferData.recipientType === 'external' ? 'Virement Externe' :
                               'Virement Crypto (FIAT)';
      
      alert(`✅ Virement effectué avec succès !

Détails du virement :
• Référence : ${transferId}
• Type : ${transferTypeLabel}
• Montant : ${formatCurrency(transferData.amount, transferData.currency)}
• Frais : ${formatCurrency(fees, transferData.currency)}
• Total débité : ${formatCurrency(totalAmount, transferData.currency)}
• Compte émetteur : ${fromAccount.accountNumber}
• Bénéficiaire : ${transferData.recipientName || 'Client interne'}
• Description : ${transferData.description}

Le virement sera traité dans les prochaines minutes.
Vous recevrez une confirmation par email.`);

      // Reset form
      setTransferData({
        fromAccount: '',
        toAccount: '',
        recipientType: 'internal',
        amount: 0,
        currency: 'EUR',
        description: '',
        recipientName: '',
        recipientIban: '',
        recipientBank: '',
        recipientSwift: '',
        cryptoWallet: '',
        cryptoCurrency: 'BTC'
      });
      
      setIsProcessing(false);
    }, 2000);
  };

  const renderTransferForm = () => (
    <div className="space-y-6">
      {/* Transfer Type Selection */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <button
          onClick={() => setTransferData({...transferData, recipientType: 'internal'})}
          className={`flex-1 p-4 rounded-lg border-2 transition-colors ${
            transferData.recipientType === 'internal'
              ? 'border-orange-500 bg-orange-50'
              : 'border-gray-200 hover:border-gray-300'
          }`}
        >
          <div className="flex flex-col items-center space-y-2">
            <Users className="h-6 w-6 text-orange-600" />
            <div>
              <h3 className="font-medium text-gray-900">Virement Interne</h3>
              <p className="text-sm text-gray-500">Vers un autre client de la banque</p>
            </div>
          </div>
        </button>
        
        <button
          onClick={() => setTransferData({...transferData, recipientType: 'external'})}
          className={`flex-1 p-4 rounded-lg border-2 transition-colors ${
            transferData.recipientType === 'external'
              ? 'border-orange-500 bg-orange-50'
              : 'border-gray-200 hover:border-gray-300'
          }`}
        >
          <div className="flex flex-col items-center space-y-2">
            <ArrowUpRight className="h-6 w-6 text-orange-600" />
            <div>
              <h3 className="font-medium text-gray-900">Virement Externe</h3>
              <p className="text-sm text-gray-500">Vers une autre banque</p>
            </div>
          </div>
        </button>
        
        <button
          onClick={() => setTransferData({...transferData, recipientType: 'crypto'})}
          className={`flex-1 p-4 rounded-lg border-2 transition-colors ${
            transferData.recipientType === 'crypto'
              ? 'border-orange-500 bg-orange-50'
              : 'border-gray-200 hover:border-gray-300'
          }`}
        >
          <div className="flex flex-col items-center space-y-2">
            <div className="h-6 w-6 text-orange-600">₿</div>
            <div>
              <h3 className="font-medium text-gray-900">Virement Crypto</h3>
              <p className="text-sm text-gray-500">FIAT via Cryptomonnaies</p>
            </div>
          </div>
        </button>
      </div>

      {/* From Account Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Compte émetteur</label>
        <select
          value={transferData.fromAccount}
          onChange={(e) => setTransferData({...transferData, fromAccount: e.target.value})}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
        >
          <option value="">Sélectionnez un compte</option>
          {userAccounts.map((account) => (
            <option key={account.id} value={account.id}>
              {account.accountType === 'savings' ? 'Épargne' : 'Courant'} - {account.accountNumber} 
              ({formatCurrency(account.balance, account.currency)})
            </option>
          ))}
        </select>
      </div>

      {/* Recipient Selection */}
      {transferData.recipientType === 'internal' ? (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Bénéficiaire</label>
          <select
            value={transferData.toAccount}
            onChange={(e) => setTransferData({...transferData, toAccount: e.target.value})}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
          >
            <option value="">Sélectionnez un bénéficiaire</option>
            {otherAccounts.map((account) => {
              const accountOwner = otherUsers.find(u => u.id === account.userId);
              return (
                <option key={account.id} value={account.id}>
                  {accountOwner?.firstName} {accountOwner?.lastName} - {account.accountNumber}
                </option>
              );
            })}
          </select>
        </div>
      ) : transferData.recipientType === 'external' ? (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Nom du bénéficiaire</label>
            <input
              type="text"
              value={transferData.recipientName}
              onChange={(e) => setTransferData({...transferData, recipientName: e.target.value})}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              placeholder="Nom complet du bénéficiaire"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">IBAN du bénéficiaire</label>
            <input
              type="text"
              value={transferData.recipientIban}
              onChange={(e) => setTransferData({...transferData, recipientIban: e.target.value})}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              placeholder="TG53TG138010..."
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Code SWIFT/BIC</label>
            <input
              type="text"
              value={transferData.recipientSwift}
              onChange={(e) => setTransferData({...transferData, recipientSwift: e.target.value})}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              placeholder="SWIFT/BIC (ex: ABCDFRPP)"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Banque du bénéficiaire</label>
            <input
              type="text"
              value={transferData.recipientBank}
              onChange={(e) => setTransferData({...transferData, recipientBank: e.target.value})}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              placeholder="Nom de la banque"
            />
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Nom du bénéficiaire</label>
            <input
              type="text"
              value={transferData.recipientName}
              onChange={(e) => setTransferData({...transferData, recipientName: e.target.value})}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              placeholder="Nom complet du bénéficiaire"
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Cryptomonnaie</label>
              <select
                value={transferData.cryptoCurrency}
                onChange={(e) => setTransferData({...transferData, cryptoCurrency: e.target.value as 'BTC' | 'ETH' | 'USDT'})}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                <option value="BTC">Bitcoin (BTC)</option>
                <option value="ETH">Ethereum (ETH)</option>
                <option value="USDT">Tether (USDT)</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Adresse Wallet</label>
              <input
                type="text"
                value={transferData.cryptoWallet}
                onChange={(e) => setTransferData({...transferData, cryptoWallet: e.target.value})}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                placeholder="Adresse du portefeuille crypto"
              />
            </div>
          </div>
        </div>
      )}

      {/* Amount and Currency */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Montant</label>
          <input
            type="number"
            value={transferData.amount}
            onChange={(e) => setTransferData({...transferData, amount: Number(e.target.value)})}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
            min="1"
            step="0.01"
            placeholder="0.00"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Devise</label>
          <select
            value={transferData.currency}
            onChange={(e) => setTransferData({...transferData, currency: e.target.value as any})}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
          >
            <option value="EUR">EUR</option>
            <option value="USD">USD</option>
            <option value="FCFA">FCFA</option>
          </select>
        </div>
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Description (optionnel)</label>
        <input
          type="text"
          value={transferData.description}
          onChange={(e) => setTransferData({...transferData, description: e.target.value})}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
          placeholder="Motif du virement"
        />
      </div>

      {/* Transfer Summary */}
      {transferData.amount > 0 && transferData.fromAccount && (
        <div className="bg-blue-50 p-6 rounded-lg">
          <h4 className="text-md font-semibold text-blue-900 mb-4">Récapitulatif du Virement</h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-blue-700">Montant :</span>
              <span className="font-medium text-blue-900">{formatCurrency(transferData.amount, transferData.currency)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-blue-700">Frais :</span>
              <span className="font-medium text-blue-900">
                {transferData.recipientType === 'internal' 
                  ? formatCurrency(transferData.amount * 0.01, transferData.currency) + ' (1%)'
                  : transferData.recipientType === 'external'
                  ? formatCurrency(transferData.amount * 0.03, transferData.currency) + ' (3%)'
                  : formatCurrency(transferData.amount * 0.03, transferData.currency) + ' (3%)'}
              </span>
            </div>
            <div className="flex justify-between border-t border-blue-200 pt-2">
              <span className="text-blue-700 font-medium">Total débité :</span>
              <span className="font-bold text-blue-900">
                {formatCurrency(
                  transferData.amount + (transferData.recipientType === 'internal' 
                    ? transferData.amount * 0.01
                    : transferData.amount * 0.03), 
                  transferData.currency
                )}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Submit Button */}
      <button
        onClick={handleTransfer}
        disabled={isProcessing || !transferData.fromAccount || !transferData.amount}
        className="w-full flex items-center justify-center space-x-2 px-6 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isProcessing ? (
          <>
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            <span>Traitement en cours...</span>
          </>
        ) : (
          <>
            <Send className="h-4 w-4" />
            <span>Effectuer le Virement</span>
          </>
        )}
      </button>
    </div>
  );

  const renderTransferHistory = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Historique des Virements</h3>
        <select className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500">
          <option>30 derniers jours</option>
          <option>3 derniers mois</option>
          <option>6 derniers mois</option>
          <option>1 année</option>
        </select>
      </div>

      <div className="space-y-3">
        {userTransfers.slice(0, 10).map((transfer) => (
          <div key={transfer.id} className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className={`p-2 rounded-full ${
                  transfer.type === 'transfer' ? 'bg-blue-100' :
                  transfer.type === 'deposit' ? 'bg-green-100' : 'bg-red-100'
                }`}>
                  {transfer.type === 'transfer' ? (
                    <ArrowUpRight className="h-4 w-4 text-blue-600" />
                  ) : transfer.type === 'deposit' ? (
                    <ArrowDownRight className="h-4 w-4 text-green-600" />
                  ) : (
                    <ArrowUpRight className="h-4 w-4 text-red-600" />
                  )}
                </div>
                <div>
                  <p className="font-medium text-gray-900">{transfer.description}</p>
                  <p className="text-sm text-gray-500">
                    {new Date(transfer.createdAt).toLocaleDateString('fr-FR')} à {new Date(transfer.createdAt).toLocaleTimeString('fr-FR')}
                  </p>
                </div>
              </div>
              
              <div className="text-right">
                <p className={`font-medium ${
                  transfer.type === 'deposit' ? 'text-green-600' : 'text-red-600'
                }`}>
                  {transfer.type === 'deposit' ? '+' : '-'}{formatCurrency(transfer.amount, transfer.currency)}
                </p>
                <div className="flex items-center space-x-2">
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                    transfer.status === 'completed' ? 'bg-green-100 text-green-800' :
                    transfer.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {transfer.status === 'completed' ? (
                      <><CheckCircle className="h-3 w-3 mr-1" />Terminé</>
                    ) : transfer.status === 'pending' ? (
                      <><Clock className="h-3 w-3 mr-1" />En attente</>
                    ) : (
                      <><AlertCircle className="h-3 w-3 mr-1" />Échoué</>
                    )}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-3">
        <ArrowUpRight className="h-8 w-8 text-orange-600" />
        <h1 className="text-3xl font-bold text-gray-900">Virements</h1>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setActiveTab('send')}
            className={`flex items-center space-x-2 px-6 py-4 font-medium transition-colors ${
              activeTab === 'send'
                ? 'text-orange-600 border-b-2 border-orange-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <Send className="h-4 w-4" />
            <span>Nouveau Virement</span>
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`flex items-center space-x-2 px-6 py-4 font-medium transition-colors ${
              activeTab === 'history'
                ? 'text-orange-600 border-b-2 border-orange-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <History className="h-4 w-4" />
            <span>Historique</span>
          </button>
        </div>
      </div>

      {/* Tab Content */}
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
        {activeTab === 'send' ? renderTransferForm() : renderTransferHistory()}
      </div>

      {/* Success Message */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center mt-0.5">
            <span className="text-white text-xs">✓</span>
          </div>
          <div>
            <h4 className="text-sm font-medium text-green-800">Information</h4>
            <p className="text-sm text-green-700 mt-1">
              Après avoir effectué un virement, vous restez connecté sur votre compte. 
              Le virement sera traité par l'administrateur dans les plus brefs délais.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Transfers;