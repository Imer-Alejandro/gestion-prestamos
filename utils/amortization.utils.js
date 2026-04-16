export function generateFrenchAmortization({
  principal,
  rate,
  installments,
  startDate,
  paymentFrequency,
  interestRatePeriod = 'monthly',
}) {
  // Adjust rate to monthly
  let monthlyRate = rate / 100;
  if (interestRatePeriod === 'annual') {
    monthlyRate = monthlyRate / 12;
  } else if (interestRatePeriod === 'daily') {
    monthlyRate = monthlyRate * 30; // approximate
  }

  // Rounding the base installment amount to integer
  const cuotaBase = (principal * monthlyRate) / (1 - Math.pow(1 + monthlyRate, -installments));
  const cuota = Math.round(cuotaBase);

  let saldo = principal;
  let currentDate = new Date(startDate);

  const schedule = [];

  for (let i = 1; i <= installments; i++) {
    let interest = Math.round(saldo * monthlyRate);
    let capital = cuota - interest;

    // Last installment adjustment: ensure saldo becomes exactly 0
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

    // Adjust date based on frequency
    if (paymentFrequency === 'weekly') {
      currentDate.setDate(currentDate.getDate() + 7);
    } else if (paymentFrequency === 'biweekly') {
      currentDate.setDate(currentDate.getDate() + 14);
    } else { // monthly
      currentDate.setMonth(currentDate.getMonth() + 1);
    }
  }

  return schedule;
}

