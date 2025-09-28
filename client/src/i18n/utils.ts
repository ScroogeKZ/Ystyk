import { useLanguage } from './LanguageContext';

// Locale mappings for Kazakhstan market
const localeMap = {
  ru: 'ru-KZ',
  kk: 'kk-KZ', 
  en: 'en-KZ'
} as const;

export function useFormatters() {
  const { language } = useLanguage();
  const locale = localeMap[language];
  
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: 'KZT',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };
  
  const formatNumber = (value: number) => {
    return new Intl.NumberFormat(locale).format(value);
  };
  
  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat(locale, {
      year: 'numeric',
      month: '2-digit', 
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };
  
  const formatDateShort = (date: Date) => {
    return new Intl.DateTimeFormat(locale, {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(date);
  };
  
  return {
    formatCurrency,
    formatNumber,
    formatDate,
    formatDateShort,
  };
}