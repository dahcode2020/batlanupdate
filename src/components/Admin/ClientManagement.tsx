import React, { useState } from 'react';
import { Users, Search, Plus, CreditCard as Edit, Eye, EyeOff, Trash2, Filter, UserCheck, UserX, Phone, Mail, MapPin, Calendar, Save, X, Lock } from 'lucide-react';
import { useUsers, useAllAccounts } from '../../hooks/useData';
import { userService, accountService } from '../../services/database';
import { User, Account } from '../../types';
import { formatCurrency } from '../../utils/calculations';
import { generateRIB, formatRIBForEmail } from '../../utils/ribGenerator';
import { disableSessionTimer } from '../../hooks/useSessionTimeout';

const ClientManagement: React.FC = () => {
  const { users: mockUsers, loading: usersLoading, error: usersError, refetch: refetchUsers } = useUsers();
  const { accounts: mockAccounts, loading: accountsLoading, error: accountsError, refetch: refetchAccounts } = useAllAccounts();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'suspended'>('all');
  const [showHidden, setShowHidden] = useState(false);
  const [selectedClient, setSelectedClient] = useState<User | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [showNewClientModal, setShowNewClientModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingClient, setEditingClient] = useState<User | null>(null);
  const [isCreatingClient, setIsCreatingClient] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showNewClientPassword, setShowNewClientPassword] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [changePassword, setChangePassword] = useState(false);
  const [newClient, setNewClient] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    username: '',
    password: '',
    accountType: 'courant' as 'courant' | 'epargne' | 'succession',
    initialAmount: 0,
    photoId: null as File | null,
    identityDocument: null as File | null,
    residenceProof: null as File | null
  });

  if (usersLoading || accountsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
        <span className="ml-2 text-gray-600">Chargement des données...</span>
      </div>
    );
  }

  if (usersError || accountsError) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-800">Erreur lors du chargement des données: {usersError || accountsError}</p>
      </div>
    );
  }

  const clients = mockUsers.filter(user => user.role === 'client');

  const filteredClients = clients.filter(client => {
    const matchesSearch = (client.firstName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (client.lastName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (client.email || '').toLowerCase().includes(searchTerm.toLowerCase());

    const matchesHiddenFilter = showHidden || !client.hidden;

    if (filterStatus === 'all') return matchesSearch && matchesHiddenFilter;
    return matchesSearch && matchesHiddenFilter;
  });

  const getClientAccounts = (clientId: string): Account[] => {
    return mockAccounts.filter(account => account.userId === clientId);
  };

  const getClientTotalBalance = (clientId: string): number => {
    return getClientAccounts(clientId).reduce((sum, account) => sum + account.balance, 0);
  };

  const openClientDetails = (client: User) => {
    setSelectedClient(client);
    setShowModal(true);
  };

  const handleNewClient = () => {
    setShowNewClientModal(true);
  };

  const handleEditClient = (client: User) => {
    setEditingClient(client);
    setShowEditModal(true);
    setShowPassword(false);
    setNewPassword('');
    setChangePassword(false);
  };

  const handleToggleHidden = async (clientId: string) => {
    disableSessionTimer(10000);
    setProcessingId(clientId);

    try {
      await userService.toggleHidden(clientId);
      await refetchUsers();
      setTimeout(() => {
        alert('Statut du client modifié avec succès');
      }, 100);
    } catch (error) {
      console.error('Erreur lors du changement de statut:', error);
      alert('Erreur lors du changement de statut');
    } finally {
      setProcessingId(null);
    }
  };

  const handleDeleteClient = async (clientId: string) => {
    disableSessionTimer(10000);

    if (!window.confirm('Êtes-vous sûr de vouloir supprimer ce client ?')) return;

    setProcessingId(clientId);

    try {
      await userService.delete(clientId);
      await Promise.all([refetchUsers(), refetchAccounts()]);
      setSelectedClient(null);
      setShowModal(false);
      alert('Client supprimé avec succès.');
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
      alert('Erreur lors de la suppression. Veuillez réessayer.');
    } finally {
      setProcessingId(null);
    }
  };

  const handleSaveNewClient = async () => {
    setIsCreatingClient(true);
    
    // Désactiver le timer de session pendant l'opération
    disableSessionTimer(20000); // 20 secondes
    
    try {
      // Validation des champs requis
      if (!newClient.firstName || !newClient.lastName || !newClient.email || !newClient.username || !newClient.password) {
        const missingFields = [];
        if (!newClient.firstName) missingFields.push('Prénom');
        if (!newClient.lastName) missingFields.push('Nom');
        if (!newClient.email) missingFields.push('Email');
        if (!newClient.username) missingFields.push('Nom d\'utilisateur');
        if (!newClient.password) missingFields.push('Mot de passe');
        
        alert(`❌ Champs obligatoires manquants :\n${missingFields.join(', ')}`);
        setIsCreatingClient(false);
        return;
      }

      console.log('🚀 Début de la création du client...');
      console.log('Création du client avec les données:', {
        username: newClient.username,
        firstName: newClient.firstName,
        lastName: newClient.lastName,
        email: newClient.email
      });

      // Créer l'utilisateur dans la base de données
      const newUser = await userService.create({
        username: newClient.username,
        password: newClient.password, // En production, hasher le mot de passe
        role: 'client',
        firstName: newClient.firstName,
        lastName: newClient.lastName,
        email: newClient.email,
        phone: newClient.phone,
        address: newClient.address
      });
      
      console.log('Utilisateur créé avec succès:', newUser);

      // Générer un numéro de compte unique
      const accountNumber = `TG53TG138010${Date.now().toString().slice(-8)}${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`;
      
      console.log('Création du compte avec le numéro:', accountNumber);

      // Créer le compte bancaire initial
      await accountService.create({
        userId: newUser.id,
        accountNumber: accountNumber,
        accountType: newClient.accountType === 'courant' ? 'current' : 'savings',
        balance: newClient.initialAmount,
        currency: 'EUR',
        status: 'active'
      });
      
      console.log('Compte créé avec succès');

      // Rafraîchir les données
      await refetchUsers();
      await refetchAccounts();
      
      console.log('Données rafraîchies');

      // Envoyer l'email de bienvenue
      sendWelcomeEmail(newClient);
      
      alert('✅ Nouveau client créé avec succès dans la base de données !');
      
      // Réinitialiser le formulaire
      setShowNewClientModal(false);
      setNewClient({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        address: '',
        username: '',
        password: '',
        accountType: 'courant',
        initialAmount: 0,
        photoId: null,
        identityDocument: null,
        residenceProof: null
      });
      
    } catch (error) {
      console.error('Erreur détaillée lors de la création du client:', error);
      
      // Afficher l'erreur spécifique pour le débogage
      let errorMessage = 'Erreur inconnue';
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      } else if (error && typeof error === 'object' && 'message' in error) {
        errorMessage = (error as any).message;
      } else if (error && typeof error === 'object' && 'code' in error) {
        const supabaseError = error as any;
        errorMessage = `Code: ${supabaseError.code}\nMessage: ${supabaseError.message}\nDétails: ${supabaseError.details || 'Aucun détail'}`;
      }
      
      // Messages d'erreur spécifiques selon le type d'erreur
      if (errorMessage.includes('403') || errorMessage.includes('Forbidden')) {
        alert(`❌ Erreur d'autorisation (403)\n\nProblème possible :\n• Variables d'environnement Supabase manquantes\n• Politiques de sécurité trop restrictives\n• Clé API incorrecte\n\nVérifiez la console pour plus de détails.`);
      } else if (errorMessage.includes('duplicate') || errorMessage.includes('unique')) {
        alert(`❌ Conflit de données\n\nUn utilisateur avec ce nom d'utilisateur ou cet email existe déjà.\n\nVeuillez choisir des valeurs différentes.`);
      } else {
        alert(`❌ Erreur lors de la création du client:\n\n${errorMessage}\n\nVeuillez vérifier la console pour plus de détails.`);
      }
    } finally {
      setIsCreatingClient(false);
    }
  };

  const sendWelcomeEmail = (clientData: any) => {
    // In a real app, this would send an actual email
    const ribInfo = generateRIB(clientData.firstName, clientData.lastName, clientData.address);
    const ribFormatted = formatRIBForEmail(ribInfo);
    
    const emailContent = `
      Bonjour ${clientData.firstName} ${clientData.lastName},
      
      Bienvenue à la Banque Atlantique !
      
      Votre compte ${clientData.accountType === 'courant' ? 'courant' : clientData.accountType === 'epargne' ? 'd\'épargne' : 'de succession'} a été créé avec succès.
      
      IDENTIFIANTS DE CONNEXION :
      
      Nom d'utilisateur : ${clientData.username}
      Mot de passe : ${clientData.password}
      
      Pour votre sécurité, nous vous recommandons de changer votre mot de passe lors de votre première connexion.
      
      ${ribFormatted}
      
      INFORMATIONS IMPORTANTES :
      - Votre dépôt initial de ${clientData.initialAmount}€ sera crédité sur votre compte
      - Vous pouvez accéder à votre espace client 24h/24 et 7j/7
      - Votre conseiller vous contactera dans les 48h pour finaliser l'ouverture
      
      Pour toute question, n'hésitez pas à nous contacter.
      
      Cordialement,
      L'équipe Banque Atlantique
      
      ---
      BANQUE ATLANTIQUE
      Lomé, TOGO
      Tél: +228 XX XX XX XX
      Email: contact@banqueatlantique.tg
    `;
    
    console.log('Email envoyé à:', clientData.email);
    console.log('Contenu:', emailContent);
    console.log('RIB généré:', ribInfo);
    
    // Show confirmation
    setTimeout(() => {
      alert(`Email de bienvenue envoyé à ${clientData.email} avec les identifiants de connexion et le RIB.\n\nNuméro de compte: ${ribInfo.accountNumber}\nIBAN: ${ribInfo.iban}`);
    }, 1000);
  };

  const handleFileUpload = (field: 'photoId' | 'identityDocument' | 'residenceProof', file: File | null) => {
    setNewClient({...newClient, [field]: file});
  };

  const handleSaveEditClient = async () => {
    if (!editingClient) return;

    // Désactiver le timer de session pendant l'opération
    disableSessionTimer(10000);

    try {
      const updates: Partial<User> = {
        firstName: editingClient.firstName,
        lastName: editingClient.lastName,
        email: editingClient.email,
        phone: editingClient.phone,
        address: editingClient.address
      };

      // Si le mot de passe est modifié
      if (changePassword && newPassword.trim()) {
        updates.password = newPassword;
      }

      await userService.update(editingClient.id, updates);
      await refetchUsers();

      alert('Client modifié avec succès');
      setShowEditModal(false);
      setEditingClient(null);
      setShowPassword(false);
      setNewPassword('');
      setChangePassword(false);
    } catch (error) {
      console.error('Error updating client:', error);
      alert('Erreur lors de la mise à jour du client');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-3">
          <Users className="h-8 w-8 text-orange-600" />
          <h1 className="text-3xl font-bold text-gray-900">Gestion des Clients</h1>
        </div>
        <button onClick={handleNewClient} className="flex items-center space-x-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors">
          <Plus className="h-4 w-4" />
          <span>Nouveau Client</span>
        </button>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher un client..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Filter className="h-4 w-4 text-gray-400" />
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as 'all' | 'active' | 'suspended')}
                className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                <option value="all">Tous les clients</option>
                <option value="active">Clients actifs</option>
                <option value="suspended">Clients suspendus</option>
              </select>
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="showHidden"
                checked={showHidden}
                onChange={(e) => setShowHidden(e.target.checked)}
                className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
              />
              <label htmlFor="showHidden" className="text-sm text-gray-700 cursor-pointer">
                Afficher les clients masqués
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Clients</p>
              <p className="text-2xl font-bold text-gray-900">{clients.length}</p>
            </div>
            <Users className="h-8 w-8 text-blue-500" />
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Clients Actifs</p>
              <p className="text-2xl font-bold text-green-600">{clients.length}</p>
            </div>
            <UserCheck className="h-8 w-8 text-green-500" />
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Nouveaux ce mois</p>
              <p className="text-2xl font-bold text-orange-600">2</p>
            </div>
            <Plus className="h-8 w-8 text-orange-500" />
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Comptes Totaux</p>
              <p className="text-2xl font-bold text-purple-600">{mockAccounts.length}</p>
            </div>
            <UserX className="h-8 w-8 text-purple-500" />
          </div>
        </div>
      </div>

      {/* Clients Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Liste des Clients</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left py-3 px-6 font-medium text-gray-700">Client</th>
                <th className="text-left py-3 px-6 font-medium text-gray-700">Contact</th>
                <th className="text-left py-3 px-6 font-medium text-gray-700">Comptes</th>
                <th className="text-left py-3 px-6 font-medium text-gray-700">Solde Total</th>
                <th className="text-left py-3 px-6 font-medium text-gray-700">Date d'inscription</th>
                <th className="text-left py-3 px-6 font-medium text-gray-700">Statut</th>
                <th className="text-left py-3 px-6 font-medium text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredClients.map((client) => {
                const clientAccounts = getClientAccounts(client.id);
                const totalBalance = getClientTotalBalance(client.id);
                
                return (
                  <tr key={client.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-4 px-6">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                          <span className="text-orange-600 font-medium">
                            {(client.firstName || '')[0]}{(client.lastName || '')[0]}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">
                            {client.firstName} {client.lastName}
                          </p>
                          <p className="text-sm text-gray-500">ID: {client.id}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2 text-sm text-gray-600">
                          <Mail className="h-3 w-3" />
                          <span>{client.email}</span>
                        </div>
                        <div className="flex items-center space-x-2 text-sm text-gray-600">
                          <Phone className="h-3 w-3" />
                          <span>{client.phone}</span>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <span className="text-sm font-medium text-gray-900">
                        {clientAccounts.length} compte(s)
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <span className="text-sm font-bold text-green-600">
                        {formatCurrency(totalBalance, 'EUR')}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <span className="text-sm text-gray-600">
                        {new Date(client.createdAt).toLocaleDateString('fr-FR')}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      {client.hidden ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                          Masqué
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          Actif
                        </span>
                      )}
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => openClientDetails(client)}
                          className="p-1 text-blue-600 hover:text-blue-800"
                          title="Voir détails"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleEditClient(client)}
                          className="p-1 text-green-600 hover:text-green-800"
                          title="Modifier"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleToggleHidden(client.id)}
                          disabled={processingId === client.id}
                          className="p-1 text-yellow-600 hover:text-yellow-800 disabled:opacity-50 disabled:cursor-not-allowed"
                          title={client.hidden ? 'Afficher' : 'Masquer'}
                        >
                          {processingId === client.id ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-yellow-600"></div>
                          ) : client.hidden ? (
                            <Eye className="h-4 w-4" />
                          ) : (
                            <EyeOff className="h-4 w-4" />
                          )}
                        </button>
                        <button
                          onClick={() => handleDeleteClient(client.id)}
                          disabled={processingId === client.id}
                          className="p-1 text-red-600 hover:text-red-800 disabled:opacity-50 disabled:cursor-not-allowed"
                          title="Supprimer"
                        >
                          {processingId === client.id ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600"></div>
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
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

      {/* Client Details Modal */}
      {showModal && selectedClient && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold text-gray-900">
                  Détails du Client - {selectedClient.firstName} {selectedClient.lastName}
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
              {/* Personal Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900">Informations Personnelles</h3>
                  <div className="space-y-3">
                    <div className="flex items-center space-x-3">
                      <Users className="h-4 w-4 text-gray-400" />
                      <span className="text-sm text-gray-600">Nom complet:</span>
                      <span className="text-sm font-medium">{selectedClient.firstName} {selectedClient.lastName}</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Mail className="h-4 w-4 text-gray-400" />
                      <span className="text-sm text-gray-600">Email:</span>
                      <span className="text-sm font-medium">{selectedClient.email}</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Phone className="h-4 w-4 text-gray-400" />
                      <span className="text-sm text-gray-600">Téléphone:</span>
                      <span className="text-sm font-medium">{selectedClient.phone}</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <MapPin className="h-4 w-4 text-gray-400" />
                      <span className="text-sm text-gray-600">Adresse:</span>
                      <span className="text-sm font-medium">{selectedClient.address}</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Calendar className="h-4 w-4 text-gray-400" />
                      <span className="text-sm text-gray-600">Inscription:</span>
                      <span className="text-sm font-medium">
                        {new Date(selectedClient.createdAt).toLocaleDateString('fr-FR')}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Account Summary */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900">Résumé des Comptes</h3>
                  <div className="space-y-3">
                    {getClientAccounts(selectedClient.id).map((account) => (
                      <div key={account.id} className="p-3 bg-gray-50 rounded-lg">
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              {account.accountType === 'savings' ? 'Épargne' : 'Courant'}
                            </p>
                            <p className="text-xs text-gray-500">{account.accountNumber}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-bold text-green-600">
                              {formatCurrency(account.balance, account.currency)}
                            </p>
                            <p className="text-xs text-gray-500">{account.currency}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-blue-900">Solde Total:</span>
                      <span className="text-lg font-bold text-blue-900">
                        {formatCurrency(getClientTotalBalance(selectedClient.id), 'EUR')}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* New Client Modal */}
      {showNewClientModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold text-gray-900">Nouveau Client</h2>
                <button
                  onClick={() => setShowNewClientModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Prénom</label>
                  <input
                    type="text"
                    value={newClient.firstName}
                    onChange={(e) => setNewClient({...newClient, firstName: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    placeholder="Prénom du client"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Nom</label>
                  <input
                    type="text"
                    value={newClient.lastName}
                    onChange={(e) => setNewClient({...newClient, lastName: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    placeholder="Nom du client"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                <input
                  type="email"
                  value={newClient.email}
                  onChange={(e) => setNewClient({...newClient, email: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="email@exemple.com"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Téléphone</label>
                <input
                  type="tel"
                  value={newClient.phone}
                  onChange={(e) => setNewClient({...newClient, phone: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="+33123456789"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Adresse</label>
                <textarea
                  value={newClient.address}
                  onChange={(e) => setNewClient({...newClient, address: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  rows={3}
                  placeholder="Adresse complète du client"
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Nom d'utilisateur</label>
                  <input
                    type="text"
                    value={newClient.username}
                    onChange={(e) => setNewClient({...newClient, username: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    placeholder="nom_utilisateur"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Mot de passe</label>
                  <div className="relative">
                    <input
                      type={showNewClientPassword ? 'text' : 'password'}
                      value={newClient.password}
                      onChange={(e) => setNewClient({...newClient, password: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 pr-10"
                      placeholder="Mot de passe"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewClientPassword(!showNewClientPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showNewClientPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Type de compte</label>
                  <select
                    value={newClient.accountType}
                    onChange={(e) => setNewClient({...newClient, accountType: e.target.value as 'courant' | 'epargne' | 'succession'})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  >
                    <option value="courant">Compte Courant</option>
                    <option value="epargne">Compte Épargne</option>
                    <option value="succession">Compte Succession</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Montant Initial (EUR)</label>
                  <input
                    type="number"
                    value={newClient.initialAmount}
                    onChange={(e) => setNewClient({...newClient, initialAmount: Number(e.target.value)})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                  />
                </div>
              </div>
              
              <div className="space-y-4">
                <h4 className="text-md font-medium text-gray-900 border-t pt-4">Documents Requis</h4>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Photo d'identité du client</label>
                  <div className="flex items-center space-x-3">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleFileUpload('photoId', e.target.files?.[0] || null)}
                      className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-orange-50 file:text-orange-700 hover:file:bg-orange-100"
                    />
                    {newClient.photoId && (
                      <span className="text-sm text-green-600">✓ Fichier sélectionné</span>
                    )}
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Pièce d'identité (CNI, Passeport)</label>
                  <div className="flex items-center space-x-3">
                    <input
                      type="file"
                      accept="image/*,.pdf"
                      onChange={(e) => handleFileUpload('identityDocument', e.target.files?.[0] || null)}
                      className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-orange-50 file:text-orange-700 hover:file:bg-orange-100"
                    />
                    {newClient.identityDocument && (
                      <span className="text-sm text-green-600">✓ Fichier sélectionné</span>
                    )}
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Justificatif de résidence</label>
                  <div className="flex items-center space-x-3">
                    <input
                      type="file"
                      accept="image/*,.pdf"
                      onChange={(e) => handleFileUpload('residenceProof', e.target.files?.[0] || null)}
                      className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-orange-50 file:text-orange-700 hover:file:bg-orange-100"
                    />
                    {newClient.residenceProof && (
                      <span className="text-sm text-green-600">✓ Fichier sélectionné</span>
                    )}
                  </div>
                </div>
                
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="flex items-start space-x-3">
                    <Mail className="h-5 w-5 text-blue-500 mt-0.5" />
                    <div>
                      <h5 className="text-sm font-medium text-blue-900">Notification automatique</h5>
                      <p className="text-sm text-blue-700 mt-1">
                        Un email de bienvenue avec les identifiants de connexion sera automatiquement envoyé au client à l'adresse : <strong>{newClient.email || 'email@exemple.com'}</strong>
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="p-6 border-t border-gray-200 flex justify-end space-x-4">
              <button
                onClick={() => setShowNewClientModal(false)}
                disabled={isCreatingClient}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={handleSaveNewClient}
                disabled={isCreatingClient}
                className="flex items-center space-x-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isCreatingClient ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Création en cours...</span>
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    <span>Créer le Client</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Client Modal */}
      {showEditModal && editingClient && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold text-gray-900">
                  Modifier Client - {editingClient.firstName} {editingClient.lastName}
                </h2>
                <button
                  onClick={() => setShowEditModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Prénom</label>
                  <input
                    type="text"
                    value={editingClient.firstName}
                    onChange={(e) => setEditingClient({...editingClient, firstName: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Nom</label>
                  <input
                    type="text"
                    value={editingClient.lastName}
                    onChange={(e) => setEditingClient({...editingClient, lastName: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                <input
                  type="email"
                  value={editingClient.email}
                  onChange={(e) => setEditingClient({...editingClient, email: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Téléphone</label>
                <input
                  type="tel"
                  value={editingClient.phone}
                  onChange={(e) => setEditingClient({...editingClient, phone: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Adresse</label>
                <textarea
                  value={editingClient.address}
                  onChange={(e) => setEditingClient({...editingClient, address: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  rows={3}
                />
              </div>

              <div className="border-t pt-4 mt-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-md font-medium text-gray-900 flex items-center space-x-2">
                    <Lock className="h-4 w-4 text-gray-500" />
                    <span>Mot de passe</span>
                  </h3>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Mot de passe actuel
                    </label>
                    <div className="flex items-center space-x-2">
                      <div className="relative flex-1">
                        <input
                          type={showPassword ? 'text' : 'password'}
                          value={editingClient.password}
                          disabled
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="changePassword"
                      checked={changePassword}
                      onChange={(e) => {
                        setChangePassword(e.target.checked);
                        if (!e.target.checked) setNewPassword('');
                      }}
                      className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                    />
                    <label htmlFor="changePassword" className="text-sm text-gray-700 cursor-pointer">
                      Modifier le mot de passe
                    </label>
                  </div>

                  {changePassword && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Nouveau mot de passe
                      </label>
                      <input
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                        placeholder="Entrez le nouveau mot de passe"
                      />
                      {newPassword && newPassword.length < 6 && (
                        <p className="mt-1 text-sm text-red-600">
                          Le mot de passe doit contenir au moins 6 caractères
                        </p>
                      )}
                    </div>
                  )}

                  <div className="bg-yellow-50 p-3 rounded-lg">
                    <p className="text-sm text-yellow-800">
                      <strong>Note:</strong> Le client sera informé du changement de mot de passe par email.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 flex justify-end space-x-4">
              <button
                onClick={() => setShowEditModal(false)}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={handleSaveEditClient}
                className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <Save className="h-4 w-4" />
                <span>Sauvegarder</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClientManagement;