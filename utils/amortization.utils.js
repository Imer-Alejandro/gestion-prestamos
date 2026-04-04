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

  const cuota =
    (principal * monthlyRate) / (1 - Math.pow(1 + monthlyRate, -installments));

  let saldo = principal;
  let currentDate = new Date(startDate);

  const schedule = [];

  for (let i = 1; i <= installments; i++) {
    const interest = saldo * monthlyRate;
    const capital = cuota - interest;
    saldo -= capital;

    schedule.push({
      installment_number: i,
      due_date: new Date(currentDate).toISOString(),
      scheduled_amount: cuota,
      capital_amount: capital,
      interest_amount: interest,
      remaining_capital: saldo,
      remaining_interest: 0, // interest is paid
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
