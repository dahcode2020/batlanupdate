import { AmortizationSchedule } from '../types';

export const calculateMonthlyPayment = (
  principal: number,
  annualRate: number,
  months: number
): number => {
  const monthlyRate = annualRate / 100 / 12;
  if (monthlyRate === 0) return principal / months;
  
  const payment = principal * (monthlyRate * Math.pow(1 + monthlyRate, months)) / 
                  (Math.pow(1 + monthlyRate, months) - 1);
  return Math.round(payment * 100) / 100;
};

export const generateAmortizationSchedule = (
  principal: number,
  annualRate: number,
  months: number
): AmortizationSchedule[] => {
  const monthlyRate = annualRate / 100 / 12;
  const monthlyPayment = calculateMonthlyPayment(principal, annualRate, months);
  const schedule: AmortizationSchedule[] = [];
  
  let remainingBalance = principal;
  
  for (let month = 1; month <= months; month++) {
    const interestPayment = remainingBalance * monthlyRate;
    const principalPayment = monthlyPayment - interestPayment;
    remainingBalance -= principalPayment;
    
    schedule.push({
      month,
      payment: Math.round(monthlyPayment * 100) / 100,
      principal: Math.round(principalPayment * 100) / 100,
      interest: Math.round(interestPayment * 100) / 100,
      remainingBalance: Math.max(0, Math.round(remainingBalance * 100) / 100)
    });
  }
  
  return schedule;
};

export const formatCurrency = (amount: number, currency: string): string => {
  const formatter = new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2
  });
  return formatter.format(amount);
};

export const convertCurrency = (
  amount: number,
  fromCurrency: string,
  toCurrency: string
): number => {
  // Mock exchange rates
  const rates: { [key: string]: number } = {
    'EUR': 1,
    'USD': 1.08,
    'FCFA': 655.957
  };
  
  if (fromCurrency === toCurrency) return amount;
  
  const eurAmount = amount / rates[fromCurrency];
  return Math.round(eurAmount * rates[toCurrency] * 100) / 100;
};