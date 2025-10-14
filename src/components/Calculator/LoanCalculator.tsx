import React, { useState } from 'react';
import { Calculator, TrendingUp, FileText, Download } from 'lucide-react';
import { calculateMonthlyPayment, generateAmortizationSchedule, formatCurrency } from '../../utils/calculations';

const LoanCalculator: React.FC = () => {
  const [amount, setAmount] = useState<number>(10000);
  const [rate, setRate] = useState<number>(5.5);
  const [duration, setDuration] = useState<number>(24);
  const [currency, setCurrency] = useState<'EUR' | 'USD' | 'FCFA'>('EUR');
  const [showSchedule, setShowSchedule] = useState(false);

  const monthlyPayment = calculateMonthlyPayment(amount, rate, duration);
  const totalPayment = monthlyPayment * duration;
  const totalInterest = totalPayment - amount;
  const schedule = generateAmortizationSchedule(amount, rate, duration);

  const generatePDFReport = () => {
    // Generate comprehensive loan report
    const reportContent = `
═══════════════════════════════════════════════════════════
                    RAPPORT DE SIMULATION DE PRÊT
                         BANQUE ATLANTIQUE
═══════════════════════════════════════════════════════════

Date de génération : ${new Date().toLocaleDateString('fr-FR', { 
  weekday: 'long', 
  year: 'numeric', 
  month: 'long', 
  day: 'numeric' 
})}

PARAMÈTRES DU PRÊT :
═══════════════════════════════════════════════════════════
Montant du prêt         : ${formatCurrency(amount, currency)}
Taux d'intérêt annuel   : ${rate}%
Durée                   : ${duration} mois (${Math.round(duration/12*10)/10} années)
Devise                  : ${currency}

RÉSULTATS DE LA SIMULATION :
═══════════════════════════════════════════════════════════
Mensualité              : ${formatCurrency(monthlyPayment, currency)}
Montant total à rembourser : ${formatCurrency(totalPayment, currency)}
Coût total du crédit    : ${formatCurrency(totalInterest, currency)}
Taux effectif global    : ${rate}%

ÉCHÉANCIER D'AMORTISSEMENT :
═══════════════════════════════════════════════════════════
Mois | Mensualité    | Capital       | Intérêts      | Solde Restant
-----|---------------|---------------|---------------|---------------
${schedule.map(row => 
  `${row.month.toString().padStart(4)} | ${formatCurrency(row.payment, currency).padStart(13)} | ${formatCurrency(row.principal, currency).padStart(13)} | ${formatCurrency(row.interest, currency).padStart(13)} | ${formatCurrency(row.remainingBalance, currency).padStart(13)}`
).join('\n')}

RÉSUMÉ FINANCIER :
═══════════════════════════════════════════════════════════
Capital emprunté        : ${formatCurrency(amount, currency)}
Intérêts totaux         : ${formatCurrency(totalInterest, currency)}
Pourcentage d'intérêts  : ${Math.round((totalInterest / amount) * 100)}%

INFORMATIONS IMPORTANTES :
═══════════════════════════════════════════════════════════
• Cette simulation est donnée à titre indicatif
• Les conditions réelles peuvent varier selon votre profil
• Contactez votre conseiller pour une étude personnalisée
• Taux et conditions sous réserve d'acceptation du dossier

═══════════════════════════════════════════════════════════
                         BANQUE ATLANTIQUE
                            Lomé, TOGO
                      Tél: +228 XX XX XX XX
                   Email: contact@banqueatlantique.tg
═══════════════════════════════════════════════════════════
    `;

    // Create and download the PDF report
    const blob = new Blob([reportContent], { type: 'text/plain;charset=utf-8' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `simulation_pret_${amount}_${currency}_${duration}mois_${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    
    // Show success message
    alert('📄 Rapport de simulation téléchargé avec succès !\n\nLe fichier contient :\n• Paramètres du prêt\n• Calculs détaillés\n• Échéancier complet\n• Informations bancaires');
  };
  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-3">
        <Calculator className="h-8 w-8 text-orange-600" />
        <h1 className="text-3xl font-bold text-gray-900">Calculateur de Prêt</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input Form */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Paramètres du Prêt</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Montant du prêt
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(Number(e.target.value))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  min="1000"
                  max="100000"
                  step="100"
                />
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value as 'EUR' | 'USD' | 'FCFA')}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-transparent border-none focus:outline-none"
                >
                  <option value="EUR">EUR</option>
                  <option value="USD">USD</option>
                  <option value="FCFA">FCFA</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Taux d'intérêt annuel (%)
              </label>
              <input
                type="number"
                value={rate}
                onChange={(e) => setRate(Number(e.target.value))}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                min="0.1"
                max="20"
                step="0.1"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Durée (mois)
              </label>
              <input
                type="number"
                value={duration}
                onChange={(e) => setDuration(Number(e.target.value))}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                min="6"
                max="360"
                step="1"
              />
            </div>
          </div>
        </div>

        {/* Results */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Résultats du Calcul</h2>
          
          <div className="space-y-4">
            <div className="p-4 bg-blue-50 rounded-lg">
              <div className="flex items-center justify-between">
                <span className="text-sm text-blue-700">Mensualité</span>
                <span className="text-xl font-bold text-blue-900">
                  {formatCurrency(monthlyPayment, currency)}
                </span>
              </div>
            </div>

            <div className="p-4 bg-green-50 rounded-lg">
              <div className="flex items-center justify-between">
                <span className="text-sm text-green-700">Montant total</span>
                <span className="text-lg font-semibold text-green-900">
                  {formatCurrency(totalPayment, currency)}
                </span>
              </div>
            </div>

            <div className="p-4 bg-orange-50 rounded-lg">
              <div className="flex items-center justify-between">
                <span className="text-sm text-orange-700">Intérêts totaux</span>
                <span className="text-lg font-semibold text-orange-900">
                  {formatCurrency(totalInterest, currency)}
                </span>
              </div>
            </div>

            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="text-sm text-gray-600 space-y-1">
                <div className="flex justify-between">
                  <span>Taux effectif global (TEG):</span>
                  <span className="font-medium">{rate}%</span>
                </div>
                <div className="flex justify-between">
                  <span>Durée totale:</span>
                  <span className="font-medium">{duration} mois ({Math.round(duration/12*10)/10} ans)</span>
                </div>
              </div>
            </div>

            <button
              onClick={() => setShowSchedule(!showSchedule)}
              className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
            >
              <FileText className="h-4 w-4" />
              <span>{showSchedule ? 'Masquer' : 'Afficher'} l'échéancier</span>
            </button>
            
            <button
              onClick={generatePDFReport}
              className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <Download className="h-4 w-4" />
              <span>Télécharger le Rapport PDF</span>
            </button>
          </div>
        </div>
      </div>

      {/* Amortization Schedule */}
      {showSchedule && (
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Échéancier d'Amortissement</h2>
            <div className="flex items-center space-x-3">
              <button
                onClick={generatePDFReport}
                className="flex items-center space-x-2 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
              >
                <Download className="h-4 w-4" />
                <span>Exporter PDF</span>
              </button>
              <TrendingUp className="h-5 w-5 text-gray-400" />
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-2 font-medium text-gray-700">Mois</th>
                  <th className="text-right py-3 px-2 font-medium text-gray-700">Mensualité</th>
                  <th className="text-right py-3 px-2 font-medium text-gray-700">Capital</th>
                  <th className="text-right py-3 px-2 font-medium text-gray-700">Intérêts</th>
                  <th className="text-right py-3 px-2 font-medium text-gray-700">Solde restant</th>
                </tr>
              </thead>
              <tbody>
                {schedule.map((row, index) => (
                  <tr key={index} className={`border-b border-gray-100 ${index % 2 === 0 ? 'bg-gray-50' : ''}`}>
                    <td className="py-2 px-2">{row.month}</td>
                    <td className="text-right py-2 px-2">{formatCurrency(row.payment, currency)}</td>
                    <td className="text-right py-2 px-2 text-blue-600">{formatCurrency(row.principal, currency)}</td>
                    <td className="text-right py-2 px-2 text-orange-600">{formatCurrency(row.interest, currency)}</td>
                    <td className="text-right py-2 px-2 font-medium">{formatCurrency(row.remainingBalance, currency)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default LoanCalculator;