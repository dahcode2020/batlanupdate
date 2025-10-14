import React, { useState } from 'react';
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar, 
  CreditCard,
  Download,
  Edit,
  Save,
  X,
  Eye,
  EyeOff,
  Shield,
  FileText,
  Building,
  Camera,
  Upload
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useUserAccounts } from '../../hooks/useData';
import { generateRIB, formatRIBForEmail } from '../../utils/ribGenerator';

const ClientProfile: React.FC = () => {
  const { user } = useAuth();
  const { accounts: mockAccounts, loading: accountsLoading, error: accountsError } = useUserAccounts(user?.id);
  const [isEditing, setIsEditing] = useState(false);
  const [showRIB, setShowRIB] = useState(false);
  const [profilePhoto, setProfilePhoto] = useState<string | null>(null);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [editData, setEditData] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    email: user?.email || '',
    phone: user?.phone || '',
    address: user?.address || ''
  });

  const userAccounts = mockAccounts.filter(acc => acc.userId === user?.id);
  const primaryAccount = userAccounts[0]; // Premier compte comme compte principal

  // Générer le RIB pour le compte principal
  const ribInfo = primaryAccount ? generateRIB(
    user?.firstName || '',
    user?.lastName || '',
    user?.address || ''
  ) : null;

  const handleSaveProfile = () => {
    // En réalité, ceci ferait un appel API pour mettre à jour le profil
    console.log('Mise à jour du profil:', editData);
    
    // Simulation de la sauvegarde
    setTimeout(() => {
      alert('✅ Profil mis à jour avec succès !');
      setIsEditing(false);
    }, 1000);
  };

  const handlePhotoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validation du fichier
    if (!file.type.startsWith('image/')) {
      alert('❌ Veuillez sélectionner un fichier image valide (JPG, PNG, GIF)');
      return;
    }

    if (file.size > 5 * 1024 * 1024) { // 5MB max
      alert('❌ La taille du fichier ne doit pas dépasser 5MB');
      return;
    }

    setIsUploadingPhoto(true);

    // Créer une URL temporaire pour prévisualiser l'image
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      
      // Simulation d'upload (en réalité, ceci ferait un appel API)
      setTimeout(() => {
        setProfilePhoto(result);
        setIsUploadingPhoto(false);
        alert('📸 Photo de profil mise à jour avec succès !');
        
        // En réalité, on sauvegarderait l'URL retournée par l'API
        console.log('Photo uploadée:', file.name, file.size, 'bytes');
      }, 2000);
    };
    
    reader.readAsDataURL(file);
  };

  const removeProfilePhoto = () => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer votre photo de profil ?')) {
      setProfilePhoto(null);
      alert('🗑️ Photo de profil supprimée');
      
      // En réalité, ceci ferait un appel API pour supprimer la photo
      console.log('Photo de profil supprimée');
    }
  };
  const downloadRIB = () => {
    if (!ribInfo) return;
    
    const ribContent = formatRIBForEmail(ribInfo);
    const blob = new Blob([ribContent], { type: 'text/plain;charset=utf-8' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `RIB_${user?.firstName}_${user?.lastName}_${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    
    alert('📄 RIB téléchargé avec succès !');
  };

  const sendRIBByEmail = () => {
    if (!ribInfo || !user?.email) return;
    
    // Simulation d'envoi par email
    const emailContent = `
Bonjour ${user.firstName} ${user.lastName},

Voici votre Relevé d'Identité Bancaire (RIB) :

${formatRIBForEmail(ribInfo)}

Cordialement,
L'équipe Banque Atlantique
    `;
    
    console.log('Email envoyé à:', user.email);
    console.log('Contenu:', emailContent);
    
    alert(`📧 RIB envoyé par email à ${user.email} !`);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-3">
          <User className="h-8 w-8 text-orange-600" />
          <h1 className="text-3xl font-bold text-gray-900">Mon Profil</h1>
        </div>
        <div className="flex items-center space-x-4">
          {!isEditing ? (
            <button
              onClick={() => setIsEditing(true)}
              className="flex items-center space-x-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
            >
              <Edit className="h-4 w-4" />
              <span>Modifier</span>
            </button>
          ) : (
            <div className="flex space-x-2">
              <button
                onClick={() => setIsEditing(false)}
                className="flex items-center space-x-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                <X className="h-4 w-4" />
                <span>Annuler</span>
              </button>
              <button
                onClick={handleSaveProfile}
                className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <Save className="h-4 w-4" />
                <span>Sauvegarder</span>
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Informations Personnelles */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900">Informations Personnelles</h2>
            <Shield className="h-5 w-5 text-green-500" />
          </div>

          <div className="space-y-4">
            <div className="flex items-center space-x-6">
              <div className="relative">
                <div className="w-20 h-20 rounded-full overflow-hidden bg-orange-100 flex items-center justify-center border-4 border-white shadow-lg">
                  {profilePhoto ? (
                    <img 
                      src={profilePhoto} 
                      alt="Photo de profil" 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-orange-600 font-bold text-2xl">
                      {user?.firstName?.[0]}{user?.lastName?.[0]}
                    </span>
                  )}
                </div>
                
                {/* Bouton de modification de photo */}
                <div className="absolute -bottom-1 -right-1">
                  <label className="cursor-pointer">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoUpload}
                      className="hidden"
                      disabled={isUploadingPhoto}
                    />
                    <div className={`w-8 h-8 bg-orange-600 rounded-full flex items-center justify-center text-white hover:bg-orange-700 transition-colors shadow-lg ${
                      isUploadingPhoto ? 'opacity-50 cursor-not-allowed' : ''
                    }`}>
                      {isUploadingPhoto ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      ) : (
                        <Camera className="h-4 w-4" />
                      )}
                    </div>
                  </label>
                </div>
              </div>
              
              <div>
                <h3 className="text-xl font-bold text-gray-900">
                  {user?.firstName} {user?.lastName}
                </h3>
                <p className="text-gray-500">Client depuis {new Date(user?.createdAt || '').toLocaleDateString('fr-FR')}</p>
                
                {/* Actions photo */}
                <div className="flex items-center space-x-3 mt-2">
                  <label className="cursor-pointer text-sm text-orange-600 hover:text-orange-700 flex items-center space-x-1">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoUpload}
                      className="hidden"
                      disabled={isUploadingPhoto}
                    />
                    <Upload className="h-3 w-3" />
                    <span>{profilePhoto ? 'Changer' : 'Ajouter'} photo</span>
                  </label>
                  
                  {profilePhoto && (
                    <button
                      onClick={removeProfilePhoto}
                      className="text-sm text-red-600 hover:text-red-700 flex items-center space-x-1"
                    >
                      <X className="h-3 w-3" />
                      <span>Supprimer</span>
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Prénom</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={editData.firstName}
                    onChange={(e) => setEditData({...editData, firstName: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                ) : (
                  <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                    <User className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-900">{user?.firstName}</span>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Nom</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={editData.lastName}
                    onChange={(e) => setEditData({...editData, lastName: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                ) : (
                  <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                    <User className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-900">{user?.lastName}</span>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                {isEditing ? (
                  <input
                    type="email"
                    value={editData.email}
                    onChange={(e) => setEditData({...editData, email: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                ) : (
                  <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                    <Mail className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-900">{user?.email}</span>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Téléphone</label>
                {isEditing ? (
                  <input
                    type="tel"
                    value={editData.phone}
                    onChange={(e) => setEditData({...editData, phone: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                ) : (
                  <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                    <Phone className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-900">{user?.phone}</span>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Adresse</label>
                {isEditing ? (
                  <textarea
                    value={editData.address}
                    onChange={(e) => setEditData({...editData, address: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    rows={3}
                  />
                ) : (
                  <div className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                    <MapPin className="h-4 w-4 text-gray-400 mt-0.5" />
                    <span className="text-gray-900">{user?.address}</span>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Date d'inscription</label>
                <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                  <Calendar className="h-4 w-4 text-gray-400" />
                  <span className="text-gray-900">
                    {new Date(user?.createdAt || '').toLocaleDateString('fr-FR', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* RIB et Informations Bancaires */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900">Relevé d'Identité Bancaire (RIB)</h2>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setShowRIB(!showRIB)}
                className="p-2 text-gray-400 hover:text-gray-600"
                title={showRIB ? "Masquer RIB" : "Afficher RIB"}
              >
                {showRIB ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
              <Building className="h-5 w-5 text-blue-500" />
            </div>
          </div>

          {ribInfo && (
            <div className="space-y-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="font-medium text-blue-900 mb-3">Informations Bancaires</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-blue-700">Banque :</span>
                    <span className="font-medium text-blue-900">{ribInfo.bankName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-blue-700">Adresse :</span>
                    <span className="font-medium text-blue-900">{ribInfo.bankAddress}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-blue-700">Code BIC/SWIFT :</span>
                    <span className="font-medium text-blue-900">{ribInfo.bic}</span>
                  </div>
                </div>
              </div>

              <div className="bg-green-50 p-4 rounded-lg">
                <h3 className="font-medium text-green-900 mb-3">Coordonnées du Compte</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-green-700">Titulaire :</span>
                    <span className="font-medium text-green-900">{ribInfo.clientName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-green-700">Numéro de compte :</span>
                    <span className="font-medium text-green-900 font-mono">
                      {showRIB ? ribInfo.accountNumber : '••••••••••••••••••'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-green-700">IBAN :</span>
                    <span className="font-medium text-green-900 font-mono">
                      {showRIB ? ribInfo.iban : 'TG53TG138010••••••••••••••••••'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={downloadRIB}
                  className="flex-1 flex items-center justify-center space-x-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Download className="h-4 w-4" />
                  <span>Télécharger RIB</span>
                </button>
                <button
                  onClick={sendRIBByEmail}
                  className="flex-1 flex items-center justify-center space-x-2 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  <Mail className="h-4 w-4" />
                  <span>Envoyer par Email</span>
                </button>
              </div>

              <div className="bg-yellow-50 p-4 rounded-lg">
                <div className="flex items-start space-x-3">
                  <FileText className="h-5 w-5 text-yellow-500 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-medium text-yellow-800">Utilisation du RIB</h4>
                    <p className="text-sm text-yellow-700 mt-1">
                      Ce RIB est nécessaire pour recevoir des virements, mettre en place des prélèvements 
                      ou pour toute opération bancaire nécessitant vos coordonnées de compte.
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="flex items-start space-x-3">
                  <Camera className="h-5 w-5 text-blue-500 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-medium text-blue-800">Photo de Profil</h4>
                    <p className="text-sm text-blue-700 mt-1">
                      Ajoutez une photo de profil pour personnaliser votre compte. 
                      Formats acceptés : JPG, PNG, GIF (max 5MB).
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Résumé des Comptes */}
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-gray-900">Mes Comptes</h2>
          <CreditCard className="h-5 w-5 text-gray-400" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {userAccounts.map((account, index) => (
            <div key={account.id} className="p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-medium text-gray-900">
                  {account.accountType === 'savings' ? 'Compte Épargne' : 'Compte Courant'}
                  {index === 0 && <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">Principal</span>}
                </h3>
                <span className={`text-xs px-2 py-1 rounded-full ${
                  account.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                  {account.status === 'active' ? 'Actif' : 'Suspendu'}
                </span>
              </div>
              <p className="text-sm text-gray-500 mb-2">{account.accountNumber}</p>
              <p className="text-lg font-bold text-gray-900">
                {account.balance.toLocaleString('fr-FR', {
                  style: 'currency',
                  currency: account.currency
                })}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ClientProfile;