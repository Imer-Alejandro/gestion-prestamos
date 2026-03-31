/**
 * Utilidades para distribución inteligente de pagos
 */

/**
 * Distribuye un pago entre capital, interés y mora
 * @param {number} paymentAmount - Monto total del pago
 * @param {number} interestOwed - Interés pendiente
 * @param {number} capitalOwed - Capital pendiente
 * @param {number} lateFeesOwed - Mora pendiente
 * @param {string} priority - Prioridad de distribución ('mora_first', 'interest_first', 'proportional')
 * @returns {Object} Distribución del pago
 */
export function distributePayment(
  paymentAmount,
  interestOwed = 0,
  capitalOwed = 0,
  lateFeesOwed = 0,
  priority = 'mora_first'
) {
  if (paymentAmount <= 0) {
    return {
      capitalPortion: 0,
      interestPortion: 0,
      lateFeePortion: 0,
      remainingAmount: 0
    };
  }

  let remainingAmount = paymentAmount;
  let capitalPortion = 0;
  let interestPortion = 0;
  let lateFeePortion = 0;

  // Aplicar según prioridad
  switch (priority) {
    case 'mora_first':
      // 1. Mora primero
      lateFeePortion = Math.min(remainingAmount, lateFeesOwed);
      remainingAmount -= lateFeePortion;

      // 2. Interés
      interestPortion = Math.min(remainingAmount, interestOwed);
      remainingAmount -= interestPortion;

      // 3. Capital
      capitalPortion = Math.min(remainingAmount, capitalOwed);
      remainingAmount -= capitalPortion;
      break;

    case 'interest_first':
      // 1. Interés primero
      interestPortion = Math.min(remainingAmount, interestOwed);
      remainingAmount -= interestPortion;

      // 2. Mora
      lateFeePortion = Math.min(remainingAmount, lateFeesOwed);
      remainingAmount -= lateFeePortion;

      // 3. Capital
      capitalPortion = Math.min(remainingAmount, capitalOwed);
      remainingAmount -= capitalPortion;
      break;

    case 'proportional':
      // Distribución proporcional
      const totalOwed = interestOwed + capitalOwed + lateFeesOwed;

      if (totalOwed > 0) {
        const interestRatio = interestOwed / totalOwed;
        const capitalRatio = capitalOwed / totalOwed;
        const lateFeeRatio = lateFeesOwed / totalOwed;

        interestPortion = Math.min(remainingAmount * interestRatio, interestOwed);
        remainingAmount -= interestPortion;

        lateFeePortion = Math.min(remainingAmount * lateFeeRatio, lateFeesOwed);
        remainingAmount -= lateFeePortion;

        capitalPortion = Math.min(remainingAmount * capitalRatio, capitalOwed);
        remainingAmount -= capitalPortion;
      } else {
        // Si no hay deudas pendientes, todo va a capital
        capitalPortion = remainingAmount;
        remainingAmount = 0;
      }
      break;

    case 'capital_first':
    default:
      // 1. Capital primero
      capitalPortion = Math.min(remainingAmount, capitalOwed);
      remainingAmount -= capitalPortion;

      // 2. Interés
      interestPortion = Math.min(remainingAmount, interestOwed);
      remainingAmount -= interestPortion;

      // 3. Mora
      lateFeePortion = Math.min(remainingAmount, lateFeesOwed);
      remainingAmount -= lateFeePortion;
      break;
  }

  return {
    capitalPortion: Math.round(capitalPortion * 100) / 100,
    interestPortion: Math.round(interestPortion * 100) / 100,
    lateFeePortion: Math.round(lateFeePortion * 100) / 100,
    remainingAmount: Math.round(remainingAmount * 100) / 100,
    totalDistributed: Math.round((capitalPortion + interestPortion + lateFeePortion) * 100) / 100
  };
}

/**
 * Distribuye pago a una cuota específica
 * @param {number} paymentAmount - Monto del pago
 * @param {Object} installment - Objeto de la cuota
 * @param {number} lateFeesOwed - Mora pendiente adicional
 * @returns {Object} Distribución detallada
 */
export function distributePaymentToInstallment(
  paymentAmount,
  installment,
  lateFeesOwed = 0
) {
  const remainingCapital = installment.remaining_capital || 0;
  const remainingInterest = installment.remaining_interest || 0;
  const remainingLateFee = (installment.remaining_late_fee || 0) + lateFeesOwed;

  return distributePayment(
    paymentAmount,
    remainingInterest,
    remainingCapital,
    remainingLateFee,
    'mora_first' // Mora primero en cuotas
  );
}

/**
 * Calcula distribución óptima para múltiples cuotas
 * @param {number} paymentAmount - Monto total del pago
 * @param {Array} installments - Array de cuotas pendientes
 * @param {string} strategy - Estrategia ('oldest_first', 'smallest_first', 'proportional')
 * @returns {Object} Distribución por cuota
 */
export function distributePaymentAcrossInstallments(
  paymentAmount,
  installments,
  strategy = 'oldest_first'
) {
  if (!installments || installments.length === 0) {
    return { distributions: [], remainingAmount: paymentAmount };
  }

  let remainingAmount = paymentAmount;
  const distributions = [];

  // Ordenar cuotas según estrategia
  let sortedInstallments = [...installments];

  switch (strategy) {
    case 'oldest_first':
      sortedInstallments.sort((a, b) => new Date(a.due_date) - new Date(b.due_date));
      break;
    case 'smallest_first':
      sortedInstallments.sort((a, b) => a.scheduled_amount - b.scheduled_amount);
      break;
    case 'proportional':
      // Mantener orden original para distribución proporcional
      break;
    default:
      sortedInstallments.sort((a, b) => new Date(a.due_date) - new Date(b.due_date));
  }

  // Distribuir pago cuota por cuota
  for (const installment of sortedInstallments) {
    if (remainingAmount <= 0) break;

    const remainingCapital = installment.remaining_capital || 0;
    const remainingInterest = installment.remaining_interest || 0;
    const remainingLateFee = installment.remaining_late_fee || 0;

    const totalOwed = remainingCapital + remainingInterest + remainingLateFee;

    if (totalOwed <= 0) continue;

    const distribution = distributePayment(
      remainingAmount,
      remainingInterest,
      remainingCapital,
      remainingLateFee,
      'mora_first'
    );

    if (distribution.totalDistributed > 0) {
      distributions.push({
        installmentId: installment.id,
        installmentNumber: installment.installment_number,
        ...distribution
      });

      remainingAmount = distribution.remainingAmount;
    }
  }

  return {
    distributions,
    remainingAmount,
    totalDistributed: paymentAmount - remainingAmount
  };
}

/**
 * Valida distribución de pago
 * @param {Object} distribution - Objeto de distribución
 * @returns {Object} Resultado de validación
 */
export function validatePaymentDistribution(distribution) {
  const {
    capitalPortion = 0,
    interestPortion = 0,
    lateFeePortion = 0,
    remainingAmount = 0
  } = distribution;

  const totalDistributed = capitalPortion + interestPortion + lateFeePortion;

  // Verificar que no se distribuya más de lo pagado
  if (totalDistributed > (distribution.paymentAmount || 0)) {
    return {
      isValid: false,
      error: 'La distribución total excede el monto del pago'
    };
  }

  // Verificar que las porciones sean no negativas
  if (capitalPortion < 0 || interestPortion < 0 || lateFeePortion < 0) {
    return {
      isValid: false,
      error: 'Las porciones no pueden ser negativas'
    };
  }

  return { isValid: true };
}

/**
 * Calcula impacto de un pago en el saldo del préstamo
 * @param {number} currentBalance - Saldo actual del préstamo
 * @param {Object} distribution - Distribución del pago
 * @returns {Object} Nuevo estado del préstamo
 */
export function calculateLoanBalanceImpact(currentBalance, distribution) {
  const newBalance = Math.max(0, currentBalance - distribution.capitalPortion);

  return {
    previousBalance: currentBalance,
    newBalance,
    balanceReduction: distribution.capitalPortion,
    isFullyPaid: newBalance === 0
  };
}

/**
 * Genera resumen de distribución para display
 * @param {Object} distribution - Objeto de distribución
 * @param {string} currency - Código de moneda
 * @returns {string} Resumen formateado
 */
export function formatPaymentDistribution(distribution, currency = 'COP') {
  const formatter = new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  const parts = [];

  if (distribution.lateFeePortion > 0) {
    parts.push(`Mora: ${formatter.format(distribution.lateFeePortion)}`);
  }

  if (distribution.interestPortion > 0) {
    parts.push(`Interés: ${formatter.format(distribution.interestPortion)}`);
  }

  if (distribution.capitalPortion > 0) {
    parts.push(`Capital: ${formatter.format(distribution.capitalPortion)}`);
  }

  if (distribution.remainingAmount > 0) {
    parts.push(`Excedente: ${formatter.format(distribution.remainingAmount)}`);
  }

  return parts.join(' | ');
}

/**
 * Calcula distribución óptima para refinanciamiento
 * @param {number} paymentAmount - Monto disponible para pago
 * @param {Array} overdueInstallments - Cuotas vencidas
 * @param {Array} upcomingInstallments - Próximas cuotas
 * @returns {Object} Estrategia de distribución recomendada
 */
export function calculateOptimalPaymentStrategy(
  paymentAmount,
  overdueInstallments = [],
  upcomingInstallments = []
) {
  const totalOverdue = overdueInstallments.reduce((sum, inst) => {
    return sum + (inst.remaining_capital || 0) + (inst.remaining_interest || 0) + (inst.remaining_late_fee || 0);
  }, 0);

  const totalUpcoming = upcomingInstallments.reduce((sum, inst) => {
    return sum + (inst.remaining_capital || 0) + (inst.remaining_interest || 0);
  }, 0);

  // Si hay cuotas vencidas, priorizarlas
  if (totalOverdue > 0 && paymentAmount >= totalOverdue) {
    return {
      strategy: 'pay_overdue_first',
      recommendedAmount: totalOverdue,
      coversAllOverdue: true,
      remainingForUpcoming: paymentAmount - totalOverdue
    };
  }

  // Si no cubre todas las vencidas, distribuir proporcionalmente
  if (totalOverdue > 0) {
    return {
      strategy: 'proportional_overdue',
      recommendedAmount: paymentAmount,
      coversAllOverdue: false,
      overdueCoverage: (paymentAmount / totalOverdue) * 100
    };
  }

  // Solo cuotas futuras
  return {
    strategy: 'upcoming_installments',
    recommendedAmount: Math.min(paymentAmount, totalUpcoming),
    coversAllUpcoming: paymentAmount >= totalUpcoming
  };
}
