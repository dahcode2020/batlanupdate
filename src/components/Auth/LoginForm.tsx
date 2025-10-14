import React, { useState } from 'react';
import { Eye, EyeOff, Lock, Mail } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { config } from '../../config/environment';

const LoginForm: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login, loginAttempts, isLocked } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (isLocked) {
      setError('Compte temporairement verrouillé. Veuillez patienter.');
      return;
    }
    
    setIsLoading(true);
    
    try {
      await login(email, password);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Erreur de connexion. Veuillez réessayer.');
    } finally {
      setIsLoading(false);
    }
  };

  const getRemainingAttempts = () => {
    return config.security.maxLoginAttempts - loginAttempts;
  };
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-orange-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <img 
            src="/BACI-Logo-slogan.png" 
            alt="Banque Atlantique" 
            className="mx-auto h-16 w-auto mb-6"
          />
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Connexion Sécurisée
          </h2>
          <p className="text-gray-600">
            Accédez à votre espace de gestion
          </p>
          {config.app.environment === 'production' && (
            <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-sm text-green-800">
                🔒 Connexion sécurisée SSL - Vos données sont protégées
              </p>
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl shadow-lg p-8">
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLocked}
                  className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder="Entrez votre email"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Mot de passe
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLocked}
                  className="block w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder="Entrez votre mot de passe"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={isLocked}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400" />
                  )}
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                {error}
              </div>
            )}

            {loginAttempts > 0 && !isLocked && (
              <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded-lg">
                ⚠️ {getRemainingAttempts()} tentative(s) restante(s) avant verrouillage temporaire
              </div>
            )}

            {isLocked && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                🔒 Compte temporairement verrouillé pour 15 minutes suite à trop de tentatives échouées
              </div>
            )}
            <button
              type="submit"
              disabled={isLoading || isLocked}
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <div className="flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Connexion...</span>
                </div>
              ) : isLocked ? (
                'Compte verrouillé'
              ) : (
                'Se connecter'
              )}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-gray-200">
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-4">
                Vous n'avez pas encore de compte ?
              </p>
              <button
                onClick={() => {
                  alert('🏦 Demande d\'inscription\n\nPour ouvrir un compte à la Banque Atlantique :\n\n1. Rendez-vous dans une de nos agences\n2. Munissez-vous de vos pièces justificatives :\n   • CNI ou Passeport\n   • Justificatif de revenus\n   • Justificatif de domicile\n\n3. Un conseiller vous accompagnera dans la création de votre compte\n\nAgences :\n📍 Lomé Centre - Rue du Commerce\n📍 Lomé Bè - Avenue de la Paix\n📍 Kara - Boulevard Central\n\n📞 Hotline : +228 XX XX XX XX\n📧 contact@banqueatlantique.tg');
                }}
                className="w-full flex justify-center items-center space-x-2 py-3 px-4 border-2 border-orange-600 text-orange-600 rounded-lg hover:bg-orange-50 transition-colors font-medium"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                </svg>
                <span>Demande d'Inscription</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginForm;