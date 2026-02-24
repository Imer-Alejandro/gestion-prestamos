export function generateFrenchAmortization({
  principal,
  rate,
  installments,
  startDate,
  paymentFrequency,
}) {
  const schedule = [];
  const monthlyRate = rate / 100;

  const cuota =
    (principal * monthlyRate) / (1 - Math.pow(1 + monthlyRate, -installments));

  let saldo = principal;
  let currentDate = new Date(startDate);

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
      remaining_capital: capital,
      remaining_interest: interest,
      status: "pending",
    });

    currentDate.setMonth(currentDate.getMonth() + 1);
  }

  return schedule;
}
