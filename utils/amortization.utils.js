export function generateFrenchAmortization({
  principal,
  rate,
  installments,
  startDate,
  paymentFrequency,
  interestRatePeriod = 'monthly',
}) {
  // Primero obtenemos la tasa en decimal
  let rateDecimal = rate / 100;

  // Convertimos la tasa a diaria para tener una base común
  let dailyRate = rateDecimal;
  if (interestRatePeriod === 'monthly') {
    dailyRate = rateDecimal / 30; // Mes aproximado
  } else if (interestRatePeriod === 'annual') {
    dailyRate = rateDecimal / 365;
  }

  // Calculamos la tasa del periodo (periodRate) según la frecuencia de pago
  let periodRate = dailyRate;
  if (paymentFrequency === 'weekly') {
    periodRate = dailyRate * 7;
  } else if (paymentFrequency === 'biweekly') {
    periodRate = dailyRate * 14;
  } else if (paymentFrequency === 'monthly') {
    periodRate = dailyRate * 30;
  }
  // Si paymentFrequency es 'daily', periodRate ya es dailyRate

  // Formula Amortización Francesa: A = (P * r) / (1 - (1+r)^-n)
  // Redondeamos la cuota base a entero
  let cuotaBase;
  if (periodRate === 0) {
    cuotaBase = principal / installments;
  } else {
    cuotaBase = (principal * periodRate) / (1 - Math.pow(1 + periodRate, -installments));
  }
  const cuota = Math.round(cuotaBase);

  let saldo = principal;
  // Asegurar que la fecha sea tratada como local (YYYY, MM-1, DD)
  // Si startDate es un string "YYYY-MM-DD", dividirlo para evitar desfases de UTC
  let currentDate;
  if (typeof startDate === 'string' && startDate.includes('-')) {
    const [year, month, day] = startDate.split('-').map(Number);
    currentDate = new Date(year, month - 1, day);
  } else {
    currentDate = new Date(startDate);
  }
  currentDate.setHours(0, 0, 0, 0);

  const schedule = [];

  for (let i = 1; i <= installments; i++) {
    // Ajustar fecha según frecuencia ANTES de asignar al vencimiento
    // La primera cuota debe ser un periodo después de la fecha de inicio
    if (paymentFrequency === 'daily') {
      currentDate.setDate(currentDate.getDate() + 1);
    } else if (paymentFrequency === 'weekly') {
      currentDate.setDate(currentDate.getDate() + 7);
    } else if (paymentFrequency === 'biweekly') {
      currentDate.setDate(currentDate.getDate() + 14);
    } else { // monthly
      currentDate.setMonth(currentDate.getMonth() + 1);
    }

    let interest = Math.round(saldo * periodRate);
    let capital = cuota - interest;

    // Ajuste en la última cuota para asegurar que el saldo sea exactamente 0
    if (i === installments) {
      capital = saldo;
      interest = Math.max(0, cuota - capital);
    }

    saldo -= capital;

    schedule.push({
      installment_number: i,
      due_date: new Date(currentDate).toISOString(),
      scheduled_amount: capital + interest,
      capital_amount: capital,
      interest_amount: interest,
      remaining_capital: Math.max(0, Math.round(saldo)),
      remaining_interest: 0,
      status: "pending",
    });
  }

  return schedule;
}

