/**
 * Utilidades para cálculo de intereses
 */

/**
 * Calcula el interés simple
 * @param {number} principal - Capital principal
 * @param {number} rate - Tasa de interés (en porcentaje, ej: 2.5 para 2.5%)
 * @param {number} time - Tiempo
 * @param {string} timeUnit - Unidad del tiempo ('days', 'months', 'years')
 * @returns {number} Interés calculado
 */
export function calculateSimpleInterest(principal, rate, time, timeUnit = 'months') {
  if (!principal || !rate || !time) return 0;

  // Convertir tasa a decimal
  const rateDecimal = rate / 100;

  // Convertir tiempo a años para cálculo consistente
  let timeInYears;
  switch (timeUnit) {
    case 'days':
      timeInYears = time / 365;
      break;
    case 'months':
      timeInYears = time / 12;
      break;
    case 'years':
    default:
      timeInYears = time;
      break;
  }

  return principal * rateDecimal * timeInYears;
}

/**
 * Calcula el interés compuesto
 * @param {number} principal - Capital principal
 * @param {number} rate - Tasa de interés (en porcentaje)
 * @param {number} time - Tiempo
 * @param {string} timeUnit - Unidad del tiempo
 * @param {number} compoundingFrequency - Frecuencia de capitalización por año
 * @returns {number} Interés calculado
 */
export function calculateCompoundInterest(
  principal,
  rate,
  time,
  timeUnit = 'months',
  compoundingFrequency = 12
) {
  if (!principal || !rate || !time) return 0;

  const rateDecimal = rate / 100;

  // Convertir tiempo a años
  let timeInYears;
  switch (timeUnit) {
    case 'days':
      timeInYears = time / 365;
      break;
    case 'months':
      timeInYears = time / 12;
      break;
    case 'years':
    default:
      timeInYears = time;
      break;
  }

  const amount = principal * Math.pow(1 + rateDecimal / compoundingFrequency, compoundingFrequency * timeInYears);
  return amount - principal;
}

/**
 * Calcula interés según la base especificada
 * @param {number} principal - Capital principal
 * @param {number} rate - Tasa de interés (en porcentaje)
 * @param {string} calculationBase - Base de cálculo ('monthly', 'annual', 'daily')
 * @param {number} days - Días transcurridos (opcional, default 30)
 * @returns {number} Interés calculado
 */
export function calculateInterestByBase(principal, rate, calculationBase, days = 30) {
  if (!principal || !rate) return 0;

  switch (calculationBase) {
    case 'daily':
      // Interés diario = (capital × tasa × días) / 365
      return (principal * (rate / 100) * days) / 365;

    case 'monthly':
      // Interés mensual = capital × (tasa/100) × (días/30)
      return principal * (rate / 100) * (days / 30);

    case 'annual':
      // Interés anual = capital × (tasa/100) × (días/365)
      return principal * (rate / 100) * (days / 365);

    default:
      // Default: mensual
      return principal * (rate / 100) * (days / 30);
  }
}

/**
 * Calcula el interés acumulado para un período
 * @param {number} principal - Capital principal
 * @param {number} rate - Tasa de interés
 * @param {string} calculationBase - Base de cálculo
 * @param {Date} startDate - Fecha de inicio
 * @param {Date} endDate - Fecha de fin
 * @returns {number} Interés acumulado
 */
export function calculateAccruedInterest(principal, rate, calculationBase, startDate, endDate) {
  if (!principal || !rate || !startDate || !endDate) return 0;

  const start = new Date(startDate);
  const end = new Date(endDate);
  const daysDiff = Math.ceil((end - start) / (1000 * 60 * 60 * 24));

  return calculateInterestByBase(principal, rate, calculationBase, daysDiff);
}

/**
 * Calcula la tasa efectiva anual (TEA)
 * @param {number} nominalRate - Tasa nominal
 * @param {string} period - Período de la tasa nominal ('monthly', 'quarterly', etc.)
 * @returns {number} TEA en porcentaje
 */
export function calculateEffectiveAnnualRate(nominalRate, period = 'monthly') {
  if (!nominalRate) return 0;

  const nominalDecimal = nominalRate / 100;

  let compoundingPeriods;
  switch (period) {
    case 'daily':
      compoundingPeriods = 365;
      break;
    case 'weekly':
      compoundingPeriods = 52;
      break;
    case 'monthly':
      compoundingPeriods = 12;
      break;
    case 'quarterly':
      compoundingPeriods = 4;
      break;
    case 'semiannual':
      compoundingPeriods = 2;
      break;
    case 'annual':
      compoundingPeriods = 1;
      break;
    default:
      compoundingPeriods = 12;
  }

  const effectiveRate = Math.pow(1 + nominalDecimal / compoundingPeriods, compoundingPeriods) - 1;
  return effectiveRate * 100;
}

/**
 * Convierte tasa de un período a otro
 * @param {number} rate - Tasa actual
 * @param {string} fromPeriod - Período actual
 * @param {string} toPeriod - Período deseado
 * @returns {number} Tasa convertida
 */
export function convertInterestRate(rate, fromPeriod, toPeriod) {
  if (!rate || fromPeriod === toPeriod) return rate;

  const periods = {
    'daily': 365,
    'weekly': 52,
    'monthly': 12,
    'quarterly': 4,
    'semiannual': 2,
    'annual': 1
  };

  const fromPeriodsPerYear = periods[fromPeriod] || 12;
  const toPeriodsPerYear = periods[toPeriod] || 12;

  // Convertir a tasa efectiva anual primero
  const effectiveAnnual = Math.pow(1 + (rate / 100) / fromPeriodsPerYear, fromPeriodsPerYear) - 1;

  // Convertir a la nueva periodicidad
  const convertedRate = (Math.pow(1 + effectiveAnnual, 1 / toPeriodsPerYear) - 1) * toPeriodsPerYear;

  return convertedRate * 100;
}
