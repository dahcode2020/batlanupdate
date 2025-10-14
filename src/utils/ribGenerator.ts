// Générateur de RIB pour les nouveaux clients
export interface RIBInfo {
  clientName: string;
  clientAddress: string;
  accountNumber: string;
  iban: string;
  bic: string;
  bankName: string;
  bankAddress: string;
}

export const generateAccountNumber = (): string => {
  // Génère un numéro de compte unique de 18 chiffres
  const timestamp = Date.now().toString();
  const random = Math.floor(Math.random() * 1000000).toString().padStart(6, '0');
  const accountNumber = (timestamp + random).slice(-18);
  return accountNumber;
};

export const generateIBAN = (accountNumber: string): string => {
  // Format: TG53TG138010 + numéro de compte de 18 chiffres
  return `TG53TG138010${accountNumber}`;
};

export const generateRIB = (firstName: string, lastName: string, address: string): RIBInfo => {
  const accountNumber = generateAccountNumber();
  const iban = generateIBAN(accountNumber);
  
  return {
    clientName: `${firstName} ${lastName}`,
    clientAddress: address,
    accountNumber: accountNumber,
    iban: iban,
    bic: 'ATTGTGTGXXX',
    bankName: 'BANQUE ATLANTIQUE',
    bankAddress: 'Lomé TOGO'
  };
};

export const formatRIBForEmail = (ribInfo: RIBInfo): string => {
  return `
═══════════════════════════════════════════════════════════
                    RELEVÉ D'IDENTITÉ BANCAIRE (RIB)
═══════════════════════════════════════════════════════════

TITULAIRE DU COMPTE :
Nom et Prénoms : ${ribInfo.clientName}
Adresse : ${ribInfo.clientAddress}

COORDONNÉES BANCAIRES :
Nom de la Banque : ${ribInfo.bankName}
Adresse de la Banque : ${ribInfo.bankAddress}

Numéro de Compte : ${ribInfo.accountNumber}
IBAN : ${ribInfo.iban}
BIC/SWIFT : ${ribInfo.bic}

═══════════════════════════════════════════════════════════
Ce RIB est nécessaire pour tous vos virements et prélèvements.
Conservez-le précieusement.
═══════════════════════════════════════════════════════════
  `;
};