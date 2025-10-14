import React, { useState } from 'react';
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  FileText, 
  User, 
  DollarSign,
  Calendar,
  AlertCircle,
  Eye,
  Download,
  Filter,
  Search
} from 'lucide-react';
import { useLoanApplications, useUsers } from '../../hooks/useData';
import { LoanApplication, User as UserType } from '../../types';
import { formatCurrency, calculateMonthlyPayment } from '../../utils/calculations';
import { loanApplicationService } from '../../services/database';
import { useAuth } from '../../context/AuthContext';
import { disableSessionTimer } from '../../hooks/useSessionTimeout';

const LoanValidation: React.FC = () => {
  const { user: currentUser } = useAuth();
  const { applications: mockLoanApplications, loading: applicationsLoading, error: applicationsError } = useLoanApplications();
  const { users: mockUsers, loading: usersLoading, error: usersError } = useUsers();
  const [selectedStatus, setSelectedStatus] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedApplication, setSelectedApplication] = useState<LoanApplication | null>(null);
  const [showModal, setShowModal] = useState(false);

  if (applicationsLoading || usersLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
        <span className="ml-2 text-gray-600">Chargement des données...</span>
      </div>
    );
  }

  if (applicationsError || usersError) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-800">Erreur lors du chargement des données: {applicationsError || usersError}</p>
      </div>
    );
  }

  const filteredApplications = mockLoanApplications.filter(app => {
    const matchesSearch = searchTerm === '' || 
      app.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.purpose.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (selectedStatus === 'all') return matchesSearch;
    return matchesSearch && app.status === selectedStatus;
  });

  const getApplicantInfo = (userId: string): UserType | undefined => {
    return mockUsers.find(user => user.id === userId);
  };

  const getLoanTypeLabel = (type: string): string => {
    const types: { [key: string]: string } = {
      'personal': 'Crédit Personnel',
      'investment': 'Prêt d\'Investissement',
      'business_real_estate': 'Crédit Immobilier Business',
      'personal_real_estate': 'Crédit Immobilier Personnel'
    };
    return types[type] || type;
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'approved': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string): string => {
    switch (status) {
      case 'pending': return 'En attente';
      case 'approved': return 'Approuvé';
      case 'rejected': return 'Rejeté';
      default: return status;
    }
  };

  const openApplicationDetails = (application: LoanApplication) => {
    setSelectedApplication(application);
    setShowModal(true);
  };

  const handleApprove = (applicationId: string) => {
    // Désactiver le timer de session pendant l'opération
    disableSessionTimer(10000); // 10 secondes
    
    if (window.confirm('Êtes-vous sûr de vouloir approuver cette demande de crédit ?')) {
      try {
        // Mettre à jour le statut dans la base de données
        loanApplicationService.updateStatus(applicationId, 'approved', currentUser?.id || 'admin')
          .then(() => {
            // Utiliser setTimeout pour éviter que l'alert interfère avec le timer de session
            setTimeout(() => {
              alert('✅ Demande de crédit approuvée avec succès !\n\nLe client sera notifié par email et le prêt sera activé dans son compte.');
            }, 100);
            
            // Rafraîchir les données
            window.location.reload();
          })
          .catch((error) => {
            console.error('Erreur lors de l\'approbation:', error);
            alert('❌ Erreur lors de l\'approbation. Veuillez réessayer.');
          });
      } catch (error) {
        console.error('Erreur lors de l\'approbation:', error);
        alert('❌ Erreur lors de l\'approbation. Veuillez réessayer.');
      }
    }
  };

  const handleReject = (applicationId: string) => {
    // Désactiver le timer de session pendant l'opération
    disableSessionTimer(10000); // 10 secondes
    
    const reason = prompt('Veuillez indiquer la raison du rejet (optionnel) :');
    
    if (window.confirm('Êtes-vous sûr de vouloir rejeter cette demande de crédit ?')) {
      try {
        // Mettre à jour le statut dans la base de données
        loanApplicationService.updateStatus(applicationId, 'rejected', currentUser?.id || 'admin')
          .then(() => {
            // Utiliser setTimeout pour éviter que l'alert interfère avec le timer de session
            setTimeout(() => {
              alert('✅ Demande de crédit rejetée.\n\nLe client sera notifié par email avec les raisons du refus.');
            }, 100);
            
            // Rafraîchir les données
            window.location.reload();
          })
          .catch((error) => {
            console.error('Erreur lors du rejet:', error);
            alert('❌ Erreur lors du rejet. Veuillez réessayer.');
          });
      } catch (error) {
        console.error('Erreur lors du rejet:', error);
        alert('❌ Erreur lors du rejet. Veuillez réessayer.');
      }
    }
  };

  const handleDownload = (applicationId: string) => {
    // In a real app, this would generate and download a PDF report
    console.log('Downloading application report:', applicationId);
    
    // Simulate PDF generation
    const application = mockLoanApplications.find(app => app.id === applicationId);
    if (application) {
      const applicant = getApplicantInfo(application.userId);
      const monthlyPayment = calculateMonthlyPayment(
        application.amount,
        application.interestRate,
        application.duration
      );
      
      // Create a simple text report (in a real app, this would be a PDF)
      const reportContent = `
RAPPORT DE DEMANDE DE CRÉDIT
============================

ID Demande: ${application.id}
Date: ${new Date(application.createdAt).toLocaleDateString('fr-FR')}

DEMANDEUR:
Nom: ${applicant ? `${applicant.firstName} ${applicant.lastName}` : 'N/A'}
Email: ${applicant?.email || 'N/A'}
Téléphone: ${applicant?.phone || 'N/A'}

DÉTAILS DU CRÉDIT:
Type: ${getLoanTypeLabel(application.loanType)}
Montant: ${formatCurrency(application.amount, application.currency)}
Durée: ${application.duration} mois
Taux: ${application.interestRate}%
Mensualité: ${formatCurrency(monthlyPayment, application.currency)}

ANALYSE:
Revenus mensuels: ${formatCurrency(application.monthlyIncome, application.currency)}
Ratio d'endettement: ${Math.round((monthlyPayment / application.monthlyIncome) * 100)}%

Objet: ${application.purpose}
Statut: ${getStatusLabel(application.status)}
      `;
      
      // Create and download the file
      const blob = new Blob([reportContent], { type: 'text/plain' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `rapport_credit_${applicationId}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      
      alert('Rapport téléchargé avec succès !');
    }
  };

  const pendingCount = mockLoanApplications.filter(app => app.status === 'pending').length;
  const approvedCount = mockLoanApplications.filter(app => app.status === 'approved').length;
  const rejectedCount = mockLoanApplications.filter(app => app.status === 'rejected').length;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-3">
          <CheckCircle className="h-8 w-8 text-orange-600" />
          <h1 className="text-3xl font-bold text-gray-900">Validation des Crédits</h1>
        </div>
        <div className="flex items-center space-x-4">
          <div className="text-sm text-gray-500">
            {pendingCount} demande(s) en attente
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Demandes</p>
              <p className="text-2xl font-bold text-gray-900">{mockLoanApplications.length}</p>
            </div>
            <FileText className="h-8 w-8 text-blue-500" />
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
              <p className="text-sm text-gray-600">Approuvées</p>
              <p className="text-2xl font-bold text-green-600">{approvedCount}</p>
            </div>
            <CheckCircle className="h-8 w-8 text-green-500" />
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Rejetées</p>
              <p className="text-2xl font-bold text-red-600">{rejectedCount}</p>
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
              placeholder="Rechercher une demande..."
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
                onChange={(e) => setSelectedStatus(e.target.value as 'all' | 'pending' | 'approved' | 'rejected')}
                className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                <option value="all">Toutes les demandes</option>
                <option value="pending">En attente</option>
                <option value="approved">Approuvées</option>
                <option value="rejected">Rejetées</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Applications List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Demandes de Crédit</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left py-3 px-6 font-medium text-gray-700">Demandeur</th>
                <th className="text-left py-3 px-6 font-medium text-gray-700">Type de Crédit</th>
                <th className="text-left py-3 px-6 font-medium text-gray-700">Montant</th>
                <th className="text-left py-3 px-6 font-medium text-gray-700">Durée</th>
                <th className="text-left py-3 px-6 font-medium text-gray-700">Mensualité</th>
                <th className="text-left py-3 px-6 font-medium text-gray-700">Date</th>
                <th className="text-left py-3 px-6 font-medium text-gray-700">Statut</th>
                <th className="text-left py-3 px-6 font-medium text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredApplications.map((application) => {
                const applicant = getApplicantInfo(application.userId);
                const monthlyPayment = calculateMonthlyPayment(
                  application.amount,
                  application.interestRate,
                  application.duration
                );
                
                return (
                  <tr key={application.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-4 px-6">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                          <User className="h-5 w-5 text-orange-600" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">
                            {applicant ? `${applicant.firstName} ${applicant.lastName}` : 'N/A'}
                          </p>
                          <p className="text-sm text-gray-500">ID: {application.userId}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <span className="text-sm text-gray-900">
                        {getLoanTypeLabel(application.loanType)}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <span className="text-sm font-medium text-gray-900">
                        {formatCurrency(application.amount, application.currency)}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <span className="text-sm text-gray-900">
                        {application.duration} mois
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <span className="text-sm font-medium text-green-600">
                        {formatCurrency(monthlyPayment, application.currency)}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <span className="text-sm text-gray-600">
                        {new Date(application.createdAt).toLocaleDateString('fr-FR')}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(application.status)}`}>
                        {getStatusLabel(application.status)}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => openApplicationDetails(application)}
                          className="p-1 text-blue-600 hover:text-blue-800"
                          title="Voir détails"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        {application.status === 'pending' && (
                          <>
                            <button
                              onClick={() => handleApprove(application.id)}
                              className="p-1 text-green-600 hover:text-green-800"
                              title="Approuver"
                            >
                              <CheckCircle className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleReject(application.id)}
                              className="p-1 text-red-600 hover:text-red-800"
                              title="Rejeter"
                            >
                              <XCircle className="h-4 w-4" />
                            </button>
                          </>
                        )}
                        <button
                          onClick={() => handleDownload(application.id)}
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

      {/* Application Details Modal */}
      {showModal && selectedApplication && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold text-gray-900">
                  Détails de la Demande #{selectedApplication.id}
                </h2>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ×
                </button>
              </div>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Applicant Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900">Informations du Demandeur</h3>
                  {(() => {
                    const applicant = getApplicantInfo(selectedApplication.userId);
                    return applicant ? (
                      <div className="space-y-3">
                        <div className="flex items-center space-x-3">
                          <User className="h-4 w-4 text-gray-400" />
                          <span className="text-sm text-gray-600">Nom:</span>
                          <span className="text-sm font-medium">{applicant.firstName} {applicant.lastName}</span>
                        </div>
                        <div className="flex items-center space-x-3">
                          <span className="text-sm text-gray-600">Email:</span>
                          <span className="text-sm font-medium">{applicant.email}</span>
                        </div>
                        <div className="flex items-center space-x-3">
                          <span className="text-sm text-gray-600">Téléphone:</span>
                          <span className="text-sm font-medium">{applicant.phone}</span>
                        </div>
                        <div className="flex items-center space-x-3">
                          <span className="text-sm text-gray-600">Revenus mensuels:</span>
                          <span className="text-sm font-medium text-green-600">
                            {formatCurrency(selectedApplication.monthlyIncome, selectedApplication.currency)}
                          </span>
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500">Informations non disponibles</p>
                    );
                  })()}
                </div>

                {/* Loan Details */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900">Détails du Crédit</h3>
                  <div className="space-y-3">
                    <div className="flex items-center space-x-3">
                      <FileText className="h-4 w-4 text-gray-400" />
                      <span className="text-sm text-gray-600">Type:</span>
                      <span className="text-sm font-medium">{getLoanTypeLabel(selectedApplication.loanType)}</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <DollarSign className="h-4 w-4 text-gray-400" />
                      <span className="text-sm text-gray-600">Montant:</span>
                      <span className="text-sm font-medium text-blue-600">
                        {formatCurrency(selectedApplication.amount, selectedApplication.currency)}
                      </span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Calendar className="h-4 w-4 text-gray-400" />
                      <span className="text-sm text-gray-600">Durée:</span>
                      <span className="text-sm font-medium">{selectedApplication.duration} mois</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <span className="text-sm text-gray-600">Taux d'intérêt:</span>
                      <span className="text-sm font-medium">{selectedApplication.interestRate}%</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <span className="text-sm text-gray-600">Mensualité estimée:</span>
                      <span className="text-sm font-medium text-green-600">
                        {formatCurrency(
                          calculateMonthlyPayment(
                            selectedApplication.amount,
                            selectedApplication.interestRate,
                            selectedApplication.duration
                          ),
                          selectedApplication.currency
                        )}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Purpose and Analysis */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Objet du Crédit</h3>
                <p className="text-sm text-gray-700 bg-gray-50 p-4 rounded-lg">
                  {selectedApplication.purpose}
                </p>
              </div>

              {/* Financial Analysis */}
              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="text-lg font-semibold text-blue-900 mb-3">Analyse Financière</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center">
                    <p className="text-sm text-blue-700">Ratio d'Endettement</p>
                    <p className="text-xl font-bold text-blue-900">
                      {Math.round((calculateMonthlyPayment(
                        selectedApplication.amount,
                        selectedApplication.interestRate,
                        selectedApplication.duration
                      ) / selectedApplication.monthlyIncome) * 100)}%
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-blue-700">Capacité de Remboursement</p>
                    <p className="text-xl font-bold text-blue-900">
                      {selectedApplication.monthlyIncome > calculateMonthlyPayment(
                        selectedApplication.amount,
                        selectedApplication.interestRate,
                        selectedApplication.duration
                      ) * 3 ? 'Bonne' : 'Limitée'}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-blue-700">Recommandation</p>
                    <p className="text-xl font-bold text-blue-900">
                      {selectedApplication.monthlyIncome > calculateMonthlyPayment(
                        selectedApplication.amount,
                        selectedApplication.interestRate,
                        selectedApplication.duration
                      ) * 3 ? 'Favorable' : 'À étudier'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              {selectedApplication.status === 'pending' && (
                <div className="flex justify-end space-x-4 pt-4 border-t border-gray-200">
                  <button
                    onClick={() => {
                      handleReject(selectedApplication.id);
                      setShowModal(false);
                    }}
                    className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                  >
                    <XCircle className="h-4 w-4" />
                    <span>Rejeter</span>
                  </button>
                  <button
                    onClick={() => {
                      handleApprove(selectedApplication.id);
                      setShowModal(false);
                    }}
                    className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    <CheckCircle className="h-4 w-4" />
                    <span>Approuver</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LoanValidation;