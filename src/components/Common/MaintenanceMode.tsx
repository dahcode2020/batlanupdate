import React from 'react';
import { Wrench, Clock, Mail, Phone } from 'lucide-react';
import { config } from '../../config/environment';

const MaintenanceMode: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-orange-100 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 text-center">
        <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <Wrench className="h-8 w-8 text-orange-600" />
        </div>
        
        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          Maintenance en cours
        </h1>
        
        <p className="text-gray-600 mb-6">
          Nous effectuons actuellement une maintenance de notre système pour améliorer votre expérience. 
          Nous serons de retour très bientôt.
        </p>
        
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-6">
          <div className="flex items-center justify-center space-x-2 text-orange-800">
            <Clock className="h-4 w-4" />
            <span className="text-sm font-medium">Durée estimée : 30 minutes</span>
          </div>
        </div>
        
        <div className="space-y-3">
          <p className="text-sm text-gray-600">
            Pour toute urgence, contactez-nous :
          </p>
          
          <div className="flex flex-col space-y-2">
            <a
              href={`tel:${config.contact.phone}`}
              className="flex items-center justify-center space-x-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
            >
              <Phone className="h-4 w-4" />
              <span>{config.contact.phone}</span>
            </a>
            
            <a
              href={`mailto:${config.contact.supportEmail}`}
              className="flex items-center justify-center space-x-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              <Mail className="h-4 w-4" />
              <span>{config.contact.supportEmail}</span>
            </a>
          </div>
        </div>
        
        <p className="text-xs text-gray-500 mt-6">
          Merci pour votre patience et votre compréhension.
        </p>
      </div>
    </div>
  );
};

export default MaintenanceMode;