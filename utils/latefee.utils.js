/**
 * Utilidades para cálculo de multas por mora
 */

/**
 * Calcula la multa por mora según el tipo especificado
 * @param {number} referenceAmount - Monto de referencia (capital pendiente, cuota, etc.)
 * @param {string} feeType - Tipo de multa ('fixed', 'percentage', 'daily_percentage')
 * @param {number} feeValue - Valor de la multa
 * @param {number} daysOverdue - Días de atraso
 * @returns {number} Monto de la multa calculada
 */
export function calculateLateFee(referenceAmount, feeType, feeValue, daysOverdue) {
  if (!referenceAmount || !feeType || !feeValue || !daysOverdue || daysOverdue <= 0) {
    return 0;
  }

  switch (feeType) {
    case 'fixed':
      // Multa fija por día de atraso
      return feeValue * daysOverdue;

    case 'percentage':
      // Porcentaje del monto de referencia
      return referenceAmount * (feeValue / 100);

    case 'daily_percentage':
      // Porcentaje diario del monto de referencia
      return referenceAmount * (feeValue / 100) * daysOverdue;

    case 'percentage_per_day':
      // Porcentaje del monto por cada día de atraso
      return referenceAmount * (feeValue / 100) * daysOverdue;

    default:
      // Default: porcentaje fijo
      return referenceAmount * (feeValue / 100);
  }
}

/**
 * Calcula días de atraso entre dos fechas
 * @param {string|Date} dueDate - Fecha de vencimiento
 * @param {string|Date} currentDate - Fecha actual (opcional, default: hoy)
 * @returns {number} Días de atraso (0 si no está vencido)
 */
export function calculateDaysOverdue(dueDate, currentDate = new Date()) {
  const due = new Date(dueDate);
  const current = new Date(currentDate);

  // Resetear horas para comparación solo de fechas
  due.setHours(0, 0, 0, 0);
  current.setHours(0, 0, 0, 0);

  const diffTime = current - due;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  return Math.max(0, diffDays);
}

/**
 * Calcula multa acumulada con interés compuesto
 * @param {number} referenceAmount - Monto de referencia
 * @param {string} feeType - Tipo de multa
 * @param {number} feeValue - Valor de la multa
 * @param {number} daysOverdue - Días de atraso
 * @param {number} interestRate - Tasa de interés adicional (opcional)
 * @returns {Object} {lateFee: number, totalWithInterest: number}
 */
export function calculateLateFeeWithInterest(
  referenceAmount,
  feeType,
  feeValue,
  daysOverdue,
  interestRate = 0
) {
  const lateFee = calculateLateFee(referenceAmount, feeType, feeValue, daysOverdue);

  if (interestRate === 0) {
    return {
      lateFee,
      totalWithInterest: lateFee
    };
  }

  // Calcular interés sobre la multa
  const interestOnFee = lateFee * (interestRate / 100) * (daysOverdue / 365);

  return {
    lateFee,
    interestOnFee,
    totalWithInterest: lateFee + interestOnFee
  };
}

/**
 * Calcula multa escalonada según días de atraso
 * @param {number} referenceAmount - Monto de referencia
 * @param {Array} tiers - Array de niveles [{days: number, feeType: string, feeValue: number}]
 * @param {number} daysOverdue - Días de atraso
 * @returns {number} Monto de la multa escalonada
 */
export function calculateTieredLateFee(referenceAmount, tiers, daysOverdue) {
  if (!tiers || !Array.isArray(tiers) || tiers.length === 0) {
    return 0;
  }

  // Ordenar tiers por días (ascendente)
  const sortedTiers = tiers.sort((a, b) => a.days - b.days);

  // Encontrar el tier aplicable
  let applicableTier = sortedTiers[0]; // Default: primer tier

  for (const tier of sortedTiers) {
    if (daysOverdue >= tier.days) {
      applicableTier = tier;
    } else {
      break;
    }
  }

  return calculateLateFee(
    referenceAmount,
    applicableTier.feeType,
    applicableTier.feeValue,
    daysOverdue
  );
}

/**
 * Calcula multa con período de gracia
 * @param {number} referenceAmount - Monto de referencia
 * @param {string} feeType - Tipo de multa
 * @param {number} feeValue - Valor de la multa
 * @param {number} daysOverdue - Días de atraso
 * @param {number} graceDays - Días de gracia
 * @returns {number} Monto de la multa (0 si está en período de gracia)
 */
export function calculateLateFeeWithGracePeriod(
  referenceAmount,
  feeType,
  feeValue,
  daysOverdue,
  graceDays = 0
) {
  const effectiveDaysOverdue = Math.max(0, daysOverdue - graceDays);
  return calculateLateFee(referenceAmount, feeType, feeValue, effectiveDaysOverdue);
}

/**
 * Valida configuración de multa
 * @param {string} feeType - Tipo de multa
 * @param {number} feeValue - Valor de la multa
 * @returns {Object} {isValid: boolean, error?: string}
 */
export function validateLateFeeConfig(feeType, feeValue) {
  const validTypes = ['fixed', 'percentage', 'daily_percentage', 'percentage_per_day'];

  if (!validTypes.includes(feeType)) {
    return {
      isValid: false,
      error: `Tipo de multa inválido. Debe ser uno de: ${validTypes.join(', ')}`
    };
  }

  if (typeof feeValue !== 'number' || feeValue < 0) {
    return {
      isValid: false,
      error: 'El valor de la multa debe ser un número positivo'
    };
  }

  if (feeType === 'percentage' && feeValue > 100) {
    return {
      isValid: false,
      error: 'El porcentaje de multa no puede exceder 100%'
    };
  }

  return { isValid: true };
}

/**
 * Calcula multa máxima permitida
 * @param {number} referenceAmount - Monto de referencia
 * @param {number} maxPercentage - Porcentaje máximo (opcional, default: 50%)
 * @returns {number} Multa máxima permitida
 */
export function calculateMaxAllowedLateFee(referenceAmount, maxPercentage = 50) {
  return referenceAmount * (maxPercentage / 100);
}

/**
 * Formatea monto de multa para display
 * @param {number} amount - Monto a formatear
 * @param {string} currency - Código de moneda (default: 'COP')
 * @returns {string} Monto formateado
 */
export function formatLateFeeAmount(amount, currency = 'COP') {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}
