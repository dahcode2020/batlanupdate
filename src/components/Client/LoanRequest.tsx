import React, { useState } from 'react';
import { 
  FileText, 
  DollarSign, 
  Calendar, 
  User, 
  Upload,
  CheckCircle,
  AlertCircle,
  Calculator,
  Send
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { calculateMonthlyPayment, formatCurrency } from '../../utils/calculations';
import { loanApplicationService } from '../../services/database';
import { useNotifications } from '../../hooks/useNotifications';
import { disableSessionTimer } from '../../hooks/useSessionTimeout';

const LoanRequest: React.FC = () => {
  const { user } = useAuth();
  const { addNotification } = useNotifications();
  const [formData, setFormData] = useState({
    loanType: 'personal' as 'personal' | 'investment' | 'business_real_estate' | 'personal_real_estate',
    amount: 10000,
    currency: 'EUR' as 'EUR' | 'USD' | 'FCFA',
    duration: 24,
    purpose: '',
    monthlyIncome: 0,
    employmentStatus: 'employed' as 'employed' | 'self_employed' | 'retired' | 'unemployed',
    employerName: '',
    workExperience: 0,
    documents: {
      incomeProof: null as File | null,
      identityDocument: null as File | null,
      residenceProof: null as File | null,
      businessPlan: null as File | null
    }
  });

  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loanTypes = {
    personal: { label: 'Crédit Personnel', rate: 5.5, maxAmount: 50000 },
    investment: { label: 'Prêt d\'Investissement', rate: 4.8, maxAmount: 100000 },
    business_real_estate: { label: 'Crédit Immobilier Business', rate: 4.2, maxAmount: 500000 },
    personal_real_estate: { label: 'Crédit Immobilier Personnel', rate: 3.9, maxAmount: 300000 }
  };

  const currentLoanType = loanTypes[formData.loanType];
  const monthlyPayment = calculateMonthlyPayment(formData.amount, currentLoanType.rate, formData.duration);
  const totalPayment = monthlyPayment * formData.duration;
  const totalInterest = totalPayment - formData.amount;

  const handleFileUpload = (field: keyof typeof formData.documents, file: File | null) => {
    setFormData({
      ...formData,
      documents: {
        ...formData.documents,
        [field]: file
      }
    });
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    
    // Désactiver le timer de session pendant l'opération
    disableSessionTimer(15000); // 15 secondes
    
    try {
      // Validation des champs obligatoires
      if (!formData.purpose.trim()) {
        alert('❌ Veuillez décrire l\'objet du crédit');
        setIsSubmitting(false);
        return;
      }
      
      if (formData.monthlyIncome <= 0) {
        alert('❌ Veuillez indiquer vos revenus mensuels');
        setIsSubmitting(false);
        return;
      }
      
      if (!formData.documents.incomeProof || !formData.documents.identityDocument || !formData.documents.residenceProof) {
        alert('❌ Veuillez joindre tous les documents obligatoires');
        setIsSubmitting(false);
        return;
      }

      // Créer la demande de crédit dans la base de données
      const newApplication = await loanApplicationService.create({
        userId: user!.id,
        loanType: formData.loanType,
        amount: formData.amount,
        currency: formData.currency,
        duration: formData.duration,
        interestRate: currentLoanType.rate,
        purpose: formData.purpose,
        monthlyIncome: formData.monthlyIncome,
        status: 'pending'
      });

      console.log('✅ Demande de crédit créée:', newApplication);

      // Ajouter une notification locale
      addNotification({
        title: 'Demande de crédit soumise',
        message: `Votre demande de crédit de ${formatCurrency(formData.amount, formData.currency)} a été soumise avec succès.`,
        type: 'success',
        read: false,
        relatedId: newApplication.id,
        relatedType: 'loan_application'
      });

      // Utiliser setTimeout pour éviter que l'alert interfère avec le timer de session
      setTimeout(() => {
        alert(`🎉 Demande de crédit soumise avec succès !

Détails de votre demande :
• Référence : ${newApplication.id}
• Type : ${currentLoanType.label}
• Montant : ${formatCurrency(formData.amount, formData.currency)}
• Durée : ${formData.duration} mois
• Mensualité estimée : ${formatCurrency(monthlyPayment, formData.currency)}

Votre demande sera examinée dans les 48h ouvrables.
Vous recevrez une notification par email dès qu'une décision sera prise.`);
      }, 100);
      
      // Reset form but stay on page
      setTimeout(() => {
        const shouldReset = window.confirm('Voulez-vous faire une nouvelle demande de crédit ?\n\nCliquez "OK" pour réinitialiser le formulaire\nCliquez "Annuler" pour rester sur cette demande');
      
        if (shouldReset) {
          setCurrentStep(1);
          setFormData({
            loanType: 'personal',
            amount: 10000,
            currency: 'EUR',
            duration: 24,
            purpose: '',
            monthlyIncome: 0,
            employmentStatus: 'employed',
            employerName: '',
            workExperience: 0,
            documents: {
              incomeProof: null,
              identityDocument: null,
              residenceProof: null,
              businessPlan: null
            }
          });
        }
      }, 500);
      
    } catch (error) {
      console.error('❌ Erreur lors de la création de la demande:', error);
      
      // Messages d'erreur spécifiques
      let errorMessage = 'Erreur inconnue';
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      
      if (errorMessage.includes('duplicate') || errorMessage.includes('unique')) {
        alert('❌ Une demande similaire existe déjà. Veuillez attendre le traitement de votre demande précédente.');
      } else if (errorMessage.includes('403') || errorMessage.includes('unauthorized')) {
        alert('❌ Erreur d\'autorisation. Veuillez vous reconnecter et réessayer.');
      } else {
        alert(`❌ Erreur lors de la soumission de la demande:\n\n${errorMessage}\n\nVeuillez réessayer ou contacter le support.`);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitOld = async () => {
    setIsSubmitting(true);
    
    // Old simulation code - keeping as backup
    setTimeout(() => {

      alert(`🎉 Demande de crédit soumise avec succès !

Détails de votre demande :
• Type : ${currentLoanType.label}
• Montant : ${formatCurrency(formData.amount, formData.currency)}
• Durée : ${formData.duration} mois
• Mensualité estimée : ${formatCurrency(monthlyPayment, formData.currency)}

Votre demande sera examinée dans les 48h ouvrables.
Vous recevrez une notification par email dès qu'une décision sera prise.

Numéro de référence : LR${Date.now().toString().slice(-6)}`);
      
      setIsSubmitting(false);
      // Reset form
      setCurrentStep(1);
      setFormData({
        loanType: 'personal',
        amount: 10000,
        currency: 'EUR',
        duration: 24,
        purpose: '',
        monthlyIncome: 0,
        employmentStatus: 'employed',
        employerName: '',
        workExperience: 0,
        documents: {
          incomeProof: null,
          identityDocument: null,
          residenceProof: null,
          businessPlan: null
        }
      });
    }, 2000);
  };

  const renderStep1 = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-900">Informations du Prêt</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Type de crédit</label>
          <select
            value={formData.loanType}
            onChange={(e) => setFormData({...formData, loanType: e.target.value as any})}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
          >
            {Object.entries(loanTypes).map(([key, type]) => (
              <option key={key} value={key}>{type.label}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Devise</label>
          <select
            value={formData.currency}
            onChange={(e) => setFormData({...formData, currency: e.target.value as any})}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
          >
            <option value="EUR">EUR - Euro</option>
            <option value="USD">USD - Dollar US</option>
            <option value="FCFA">FCFA - Franc CFA</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Montant demandé (max: {formatCurrency(currentLoanType.maxAmount, formData.currency)})
          </label>
          <input
            type="number"
            value={formData.amount}
            onChange={(e) => setFormData({...formData, amount: Number(e.target.value)})}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
            min="1000"
            max={currentLoanType.maxAmount}
            step="100"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Durée (mois)</label>
          <input
            type="number"
            value={formData.duration}
            onChange={(e) => setFormData({...formData, duration: Number(e.target.value)})}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
            min="6"
            max="360"
            step="1"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Objet du crédit</label>
        <textarea
          value={formData.purpose}
          onChange={(e) => setFormData({...formData, purpose: e.target.value})}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
          rows={4}
          placeholder="Décrivez l'utilisation prévue du crédit..."
        />
      </div>

      {/* Loan Preview */}
      <div className="bg-blue-50 p-6 rounded-lg">
        <h4 className="text-md font-semibold text-blue-900 mb-4">Aperçu du Crédit</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <p className="text-blue-700">Taux d'intérêt</p>
            <p className="font-bold text-blue-900">{currentLoanType.rate}%</p>
          </div>
          <div>
            <p className="text-blue-700">Mensualité</p>
            <p className="font-bold text-blue-900">{formatCurrency(monthlyPayment, formData.currency)}</p>
          </div>
          <div>
            <p className="text-blue-700">Total à rembourser</p>
            <p className="font-bold text-blue-900">{formatCurrency(totalPayment, formData.currency)}</p>
          </div>
          <div>
            <p className="text-blue-700">Coût du crédit</p>
            <p className="font-bold text-blue-900">{formatCurrency(totalInterest, formData.currency)}</p>
          </div>
        </div>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-900">Informations Financières</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Revenus mensuels nets</label>
          <input
            type="number"
            value={formData.monthlyIncome}
            onChange={(e) => setFormData({...formData, monthlyIncome: Number(e.target.value)})}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
            min="0"
            step="100"
            placeholder="Montant en EUR"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Statut professionnel</label>
          <select
            value={formData.employmentStatus}
            onChange={(e) => setFormData({...formData, employmentStatus: e.target.value as any})}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
          >
            <option value="employed">Salarié</option>
            <option value="self_employed">Indépendant</option>
            <option value="retired">Retraité</option>
            <option value="unemployed">Sans emploi</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Nom de l'employeur</label>
          <input
            type="text"
            value={formData.employerName}
            onChange={(e) => setFormData({...formData, employerName: e.target.value})}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
            placeholder="Nom de votre employeur"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Ancienneté (années)</label>
          <input
            type="number"
            value={formData.workExperience}
            onChange={(e) => setFormData({...formData, workExperience: Number(e.target.value)})}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
            min="0"
            max="50"
            step="0.5"
          />
        </div>
      </div>

      {/* Financial Analysis */}
      {formData.monthlyIncome > 0 && (
        <div className="bg-green-50 p-6 rounded-lg">
          <h4 className="text-md font-semibold text-green-900 mb-4">Analyse Financière</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <p className="text-green-700 text-sm">Ratio d'Endettement</p>
              <p className="text-2xl font-bold text-green-900">
                {Math.round((monthlyPayment / formData.monthlyIncome) * 100)}%
              </p>
            </div>
            <div className="text-center">
              <p className="text-green-700 text-sm">Reste à Vivre</p>
              <p className="text-2xl font-bold text-green-900">
                {formatCurrency(formData.monthlyIncome - monthlyPayment, formData.currency)}
              </p>
            </div>
            <div className="text-center">
              <p className="text-green-700 text-sm">Évaluation</p>
              <p className="text-2xl font-bold text-green-900">
                {(monthlyPayment / formData.monthlyIncome) < 0.33 ? 'Favorable' : 'À étudier'}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-900">Documents Justificatifs</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Justificatif de revenus <span className="text-red-500">*</span>
          </label>
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
            <input
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              onChange={(e) => handleFileUpload('incomeProof', e.target.files?.[0] || null)}
              className="w-full"
            />
            {formData.documents.incomeProof && (
              <p className="text-sm text-green-600 mt-2">✓ {formData.documents.incomeProof.name}</p>
            )}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            CNI ou Passeport <span className="text-red-500">*</span>
          </label>
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
            <input
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              onChange={(e) => handleFileUpload('identityDocument', e.target.files?.[0] || null)}
              className="w-full"
            />
            {formData.documents.identityDocument && (
              <p className="text-sm text-green-600 mt-2">✓ {formData.documents.identityDocument.name}</p>
            )}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Certificat de Résidence ou Copie facture Électricité/Eau/Gaz/Téléphone <span className="text-red-500">*</span>
          </label>
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
            <input
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              onChange={(e) => handleFileUpload('residenceProof', e.target.files?.[0] || null)}
              className="w-full"
            />
            {formData.documents.residenceProof && (
              <p className="text-sm text-green-600 mt-2">✓ {formData.documents.residenceProof.name}</p>
            )}
          </div>
        </div>

        {formData.loanType === 'investment' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Plan d'affaires</label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
              <input
                type="file"
                accept=".pdf,.doc,.docx"
                onChange={(e) => handleFileUpload('businessPlan', e.target.files?.[0] || null)}
                className="w-full"
              />
              {formData.documents.businessPlan && (
                <p className="text-sm text-green-600 mt-2">✓ {formData.documents.businessPlan.name}</p>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="bg-yellow-50 p-4 rounded-lg">
        <div className="flex items-start space-x-3">
          <AlertCircle className="h-5 w-5 text-yellow-500 mt-0.5" />
          <div>
            <h4 className="text-sm font-medium text-yellow-800">Documents requis</h4>
            <p className="text-sm text-yellow-700 mt-1">
              Les documents marqués d'un astérisque (*) sont obligatoires pour traiter votre demande.
              Formats acceptés : PDF, JPG, PNG (max 5MB par fichier).
            </p>
          </div>
        </div>
      </div>

      {/* Success Message */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center mt-0.5">
            <span className="text-white text-xs">i</span>
          </div>
          <div>
            <h4 className="text-sm font-medium text-blue-800">Information</h4>
            <p className="text-sm text-blue-700 mt-1">
              Après avoir soumis votre demande de crédit, vous restez connecté sur votre compte. 
              Votre demande sera examinée par l'administrateur dans les 48h ouvrables.
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-3">
        <FileText className="h-8 w-8 text-orange-600" />
        <h1 className="text-3xl font-bold text-gray-900">Demande de Crédit</h1>
      </div>

      {/* Progress Steps */}
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
        <div className="flex items-center justify-between">
          {[1, 2, 3].map((step) => (
            <div key={step} className="flex items-center">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-medium ${
                currentStep >= step 
                  ? 'bg-orange-600 text-white' 
                  : 'bg-gray-200 text-gray-600'
              }`}>
                {currentStep > step ? <CheckCircle className="h-5 w-5" /> : step}
              </div>
              <div className="ml-3">
                <p className={`text-sm font-medium ${
                  currentStep >= step ? 'text-orange-600' : 'text-gray-500'
                }`}>
                  {step === 1 ? 'Informations du Prêt' : 
                   step === 2 ? 'Situation Financière' : 'Documents'}
                </p>
              </div>
              {step < 3 && (
                <div className={`w-16 h-1 mx-4 ${
                  currentStep > step ? 'bg-orange-600' : 'bg-gray-200'
                }`}></div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Form Content */}
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
        {currentStep === 1 && renderStep1()}
        {currentStep === 2 && renderStep2()}
        {currentStep === 3 && renderStep3()}

        {/* Navigation Buttons */}
        <div className="flex justify-between pt-6 border-t border-gray-200">
          <button
            onClick={() => setCurrentStep(Math.max(1, currentStep - 1))}
            disabled={currentStep === 1}
            className="px-6 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Précédent
          </button>
          
          {currentStep < 3 ? (
            <button
              onClick={() => setCurrentStep(currentStep + 1)}
              className="px-6 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
            >
              Suivant
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={isSubmitting || !formData.documents.incomeProof || !formData.documents.identityDocument || !formData.documents.residenceProof}
              className="flex items-center space-x-2 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Envoi en cours...</span>
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  <span>Soumettre la Demande</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default LoanRequest;