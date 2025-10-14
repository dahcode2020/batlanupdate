import React, { useState } from 'react';
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  ArrowUpRight, 
  User, 
  DollarSign,
  Calendar,
  AlertCircle,
  Eye,
  Download,
  Filter,
  Search,
  CreditCard,
  Building
} from 'lucide-react';
import { useAllTransactions, useUsers, useAllAccounts } from '../../hooks/useData';
import { useAuth } from '../../context/AuthContext';
import { Transaction, User as UserType, Account } from '../../types';
import { formatCurrency } from '../../utils/calculations';
import { transactionService } from '../../services/database';
import { disableSessionTimer } from '../../hooks/useSessionTimeout';

const TransferValidation: React.FC = () => {
  const { user } = useAuth();
  const { transactions: mockTransactions, loading: transactionsLoading, error: transactionsError, refetch: refetchTransactions } = useAllTransactions();
  const { users: mockUsers, loading: usersLoading, error: usersError } = useUsers();
  const { accounts: mockAccounts, loading: accountsLoading, error: accountsError } = useAllAccounts();
  const [selectedStatus, setSelectedStatus] = useState<'all' | 'pending' | 'completed' | 'failed'>('pending');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);

  if (transactionsLoading || usersLoading || accountsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
        <span className="ml-2 text-gray-600">Chargement des données...</span>
      </div>
    );
  }

  if (transactionsError || usersError || accountsError) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-800">Erreur lors du chargement des données: {transactionsError || usersError || accountsError}</p>
      </div>
    );
  }

  // Filtrer seulement les virements
  const transfers = mockTransactions.filter(trans => trans.type === 'transfer');
  
  const filteredTransfers = transfers.filter(transfer => {
    const matchesSearch = searchTerm === '' || 
      transfer.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transfer.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (selectedStatus === 'all') return matchesSearch;
    return matchesSearch && transfer.status === selectedStatus;
  });

  const getAccountInfo = (accountId: string | undefined): Account | undefined => {
    if (!accountId) return undefined;
    return mockAccounts.find(acc => acc.id === accountId);
  };

  const getUserInfo = (userId: string): UserType | undefined => {
    return mockUsers.find(user => user.id === userId);
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'failed': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string): string => {
    switch (status) {
      case 'pending': return 'En attente';
      case 'completed': return 'Validé';
      case 'failed': return 'Rejeté';
      default: return status;
    }
  };

  const openTransferDetails = (transfer: Transaction) => {
    setSelectedTransaction(transfer);
    setShowModal(true);
  };

  const handleApprove = async (transferId: string) => {
    // Désactiver le timer de session pendant l'opération
    disableSessionTimer(10000); // 10 secondes
    
    if (window.confirm('Êtes-vous sûr de vouloir valider ce virement ?')) {
      setProcessingId(transferId);
      try {
        // Mettre à jour le statut à "completed"
        await transactionService.updateStatus(transferId, 'completed');
        
        // Utiliser setTimeout pour éviter que l'alert interfère avec le timer de session
        setTimeout(() => {
          alert('✅ Virement validé avec succès !\n\nLe client sera notifié et les soldes des comptes ont été mis à jour.');
        }, 100);
        
        // Rafraîchir les données
        await refetchTransactions();
        setShowModal(false);
      } catch (error) {
        console.error('Erreur lors de la validation:', error);
        alert('❌ Erreur lors de la validation. Veuillez réessayer.');
      } finally {
        setProcessingId(null);
      }
    }
  };

  const handleReject = (transferId: string) => {
    setSelectedTransaction(transfers.find(t => t.id === transferId) || null);
    setShowRejectModal(true);
    setRejectReason('');
  };

  const confirmReject = async () => {
    // Désactiver le timer de session pendant l'opération
    disableSessionTimer(10000); // 10 secondes
    
    if (!selectedTransaction || !rejectReason.trim()) {
      alert('Veuillez indiquer un motif de rejet');
      return;
    }

    setProcessingId(selectedTransaction.id);
    try {
      // Mettre à jour le statut à "failed" avec le motif
      await transactionService.updateStatusWithReason(selectedTransaction.id, 'failed', rejectReason);
      
      // Utiliser setTimeout pour éviter que l'alert interfère avec le timer de session
      setTimeout(() => {
        alert('✅ Virement rejeté.\n\nLe client sera notifié avec le motif du rejet.');
      }, 100);
      
      // Rafraîchir les données
      await refetchTransactions();
      setShowRejectModal(false);
      setShowModal(false);
    } catch (error) {
      console.error('Erreur lors du rejet:', error);
      alert('❌ Erreur lors du rejet. Veuillez réessayer.');
    } finally {
      setProcessingId(null);
    }
  };

  const handleDownload = (transferId: string) => {
    const transfer = transfers.find(t => t.id === transferId);
    if (!transfer) return;

    const fromAccount = getAccountInfo(transfer.fromAccountId);
    const toAccount = getAccountInfo(transfer.toAccountId);
    const fromUser = fromAccount ? getUserInfo(fromAccount.userId) : null;
    const toUser = toAccount ? getUserInfo(toAccount.userId) : null;
    
    const reportContent = `
RAPPORT DE VIREMENT
===================

ID Transaction: ${transfer.id}
Date: ${new Date(transfer.createdAt).toLocaleDateString('fr-FR')}

ÉMETTEUR:
Nom: ${fromUser ? `${fromUser.firstName} ${fromUser.lastName}` : 'N/A'}
Compte: ${fromAccount?.accountNumber || 'N/A'}
Email: ${fromUser?.email || 'N/A'}

BÉNÉFICIAIRE:
${toUser ? `Nom: ${toUser.firstName} ${toUser.lastName}` : 'Externe'}
${toAccount ? `Compte: ${toAccount.accountNumber}` : 'Compte externe'}

DÉTAILS:
Montant: ${formatCurrency(transfer.amount, transfer.currency)}
Type: ${transfer.type}
Description: ${transfer.description}
Statut: ${getStatusLabel(transfer.status)}
    `;
    
    const blob = new Blob([reportContent], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `rapport_virement_${transferId}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    
    alert('Rapport téléchargé avec succès !');
  };

  const pendingCount = transfers.filter(t => t.status === 'pending').length;
  const completedCount = transfers.filter(t => t.status === 'completed').length;
  const failedCount = transfers.filter(t => t.status === 'failed').length;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-3">
          <ArrowUpRight className="h-8 w-8 text-orange-600" />
          <h1 className="text-3xl font-bold text-gray-900">Validation des Virements</h1>
        </div>
        <div className="flex items-center space-x-4">
          <div className="text-sm text-gray-500">
            {pendingCount} virement(s) en attente
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Virements</p>
              <p className="text-2xl font-bold text-gray-900">{transfers.length}</p>
            </div>
            <ArrowUpRight className="h-8 w-8 text-blue-500" />
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">En Attente</p>
              <p className="text-2xl font-bold text-yellow-600">{pendingCount}</p>
            </div>
            <Clock className="h-8 w-8 text-yellow-500" />
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Validés</p>
              <p className="text-2xl font-bold text-green-600">{completedCount}</p>
            </div>
            <CheckCircle className="h-8 w-8 text-green-500" />
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Rejetés</p>
              <p className="text-2xl font-bold text-red-600">{failedCount}</p>
            </div>
            <XCircle className="h-8 w-8 text-red-500" />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher un virement..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Filter className="h-4 w-4 text-gray-400" />
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value as 'all' | 'pending' | 'completed' | 'failed')}
                className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                <option value="all">Tous les virements</option>
                <option value="pending">En attente</option>
                <option value="completed">Validés</option>
                <option value="failed">Rejetés</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Transfers List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Virements à Traiter</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left py-3 px-6 font-medium text-gray-700">Émetteur</th>
                <th className="text-left py-3 px-6 font-medium text-gray-700">Bénéficiaire</th>
                <th className="text-left py-3 px-6 font-medium text-gray-700">Montant</th>
                <th className="text-left py-3 px-6 font-medium text-gray-700">Type</th>
                <th className="text-left py-3 px-6 font-medium text-gray-700">Date</th>
                <th className="text-left py-3 px-6 font-medium text-gray-700">Statut</th>
                <th className="text-left py-3 px-6 font-medium text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredTransfers.map((transfer) => {
                const fromAccount = getAccountInfo(transfer.fromAccountId);
                const toAccount = getAccountInfo(transfer.toAccountId);
                const fromUser = fromAccount ? getUserInfo(fromAccount.userId) : null;
                const toUser = toAccount ? getUserInfo(toAccount.userId) : null;
                
                return (
                  <tr key={transfer.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-4 px-6">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <User className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">
                            {fromUser ? `${fromUser.firstName} ${fromUser.lastName}` : 'N/A'}
                          </p>
                          <p className="text-sm text-gray-500">{fromAccount?.accountNumber}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                          {toUser ? <User className="h-4 w-4 text-green-600" /> : <Building className="h-4 w-4 text-green-600" />}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {toUser ? `${toUser.firstName} ${toUser.lastName}` : 'Externe'}
                          </p>
                          <p className="text-xs text-gray-500">{toAccount?.accountNumber || 'Compte externe'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <span className="text-sm font-medium text-gray-900">
                        {formatCurrency(transfer.amount, transfer.currency)}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <span className="text-sm text-gray-900">
                        {transfer.description.includes('interne') ? 'Interne' :
                         transfer.description.includes('externe') ? 'Externe' :
                         transfer.description.includes('crypto') ? 'Crypto' : 'Virement'}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <span className="text-sm text-gray-600">
                        {new Date(transfer.createdAt).toLocaleDateString('fr-FR')}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(transfer.status)}`}>
                        {getStatusLabel(transfer.status)}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => openTransferDetails(transfer)}
                          className="p-1 text-blue-600 hover:text-blue-800"
                          title="Voir détails"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        {transfer.status === 'pending' && (
                          <>
                            <button
                              onClick={() => handleApprove(transfer.id)}
                              disabled={processingId === transfer.id}
                              className="p-1 text-green-600 hover:text-green-800 disabled:opacity-50"
                              title="Valider"
                            >
                              <CheckCircle className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleReject(transfer.id)}
                              disabled={processingId === transfer.id}
                              className="p-1 text-red-600 hover:text-red-800 disabled:opacity-50"
                              title="Rejeter"
                            >
                              <XCircle className="h-4 w-4" />
                            </button>
                          </>
                        )}
                        <button
                          onClick={() => handleDownload(transfer.id)}
                          className="p-1 text-gray-600 hover:text-gray-800"
                          title="Télécharger"
                        >
                          <Download className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Transfer Details Modal */}
      {showModal && selectedTransaction && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold text-gray-900">
                  Détails du Virement #{selectedTransaction.id}
                </h2>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ×
                </button>
              </div>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Informations Émetteur</h3>
                  {(() => {
                    const fromAccount = getAccountInfo(selectedTransaction.fromAccountId);
                    const fromUser = fromAccount ? getUserInfo(fromAccount.userId) : null;
                    return (
                      <div className="space-y-2">
                        <p><span className="font-medium">Nom:</span> {fromUser ? `${fromUser.firstName} ${fromUser.lastName}` : 'N/A'}</p>
                        <p><span className="font-medium">Compte:</span> {fromAccount?.accountNumber}</p>
                        <p><span className="font-medium">Email:</span> {fromUser?.email}</p>
                      </div>
                    );
                  })()}
                </div>
                
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Détails du Virement</h3>
                  <div className="space-y-2">
                    <p><span className="font-medium">Montant:</span> {formatCurrency(selectedTransaction.amount, selectedTransaction.currency)}</p>
                    <p><span className="font-medium">Date:</span> {new Date(selectedTransaction.createdAt).toLocaleString('fr-FR')}</p>
                    <p><span className="font-medium">Statut:</span> 
                      <span className={`ml-2 px-2 py-1 rounded-full text-xs ${getStatusColor(selectedTransaction.status)}`}>
                        {getStatusLabel(selectedTransaction.status)}
                      </span>
                    </p>
                  </div>
                </div>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Description</h3>
                <p className="text-gray-700 bg-gray-50 p-3 rounded-lg">{selectedTransaction.description}</p>
              </div>

              {selectedTransaction.status === 'pending' && (
                <div className="flex justify-end space-x-4 pt-4 border-t border-gray-200">
                  <button
                    onClick={() => handleReject(selectedTransaction.id)}
                    className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                  >
                    <XCircle className="h-4 w-4" />
                    <span>Rejeter</span>
                  </button>
                  <button
                    onClick={() => handleApprove(selectedTransaction.id)}
                    className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    <CheckCircle className="h-4 w-4" />
                    <span>Valider</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">Motif de Rejet</h2>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Veuillez indiquer le motif du rejet
                </label>
                <textarea
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  rows={4}
                  placeholder="Ex: Solde insuffisant, documents manquants, informations incorrectes..."
                />
              </div>
              
              <div className="flex justify-end space-x-4">
                <button
                  onClick={() => setShowRejectModal(false)}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Annuler
                </button>
                <button
                  onClick={confirmReject}
                  disabled={!rejectReason.trim() || processingId !== null}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                >
                  {processingId ? 'Traitement...' : 'Confirmer le Rejet'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TransferValidation;