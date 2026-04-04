import { getDb } from "../database/db.js";

/* GENERATE AND SAVE INSTALLMENTS */
export async function generateAndSaveInstallments(loanId, schedule) {
  const db = await getDb();

  for (const installment of schedule) {
    await db.runAsync(
      `INSERT INTO loan_installments (
        loan_id,
        installment_number,
        due_date,
        scheduled_amount,
        capital_amount,
        interest_amount,
        remaining_capital,
        remaining_interest,
        remaining_late_fee,
        late_fee_accrued,
        amount_paid,
        status,
        created_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        loanId,
        installment.installment_number,
        installment.due_date,
        installment.scheduled_amount,
        installment.capital_amount,
        installment.interest_amount,
        installment.remaining_capital,
        0, // remaining_interest
        0, // remaining_late_fee
        0, // late_fee_accrued
        0, // amount_paid
        installment.status || "pending",
        new Date().toISOString(),
      ],
    );
  }
}

/* GET INSTALLMENTS BY LOAN */
export async function getInstallmentsByLoan(loanId) {
  const db = await getDb();
  return await db.getAllAsync(
    `SELECT * FROM loan_installments WHERE loan_id = ? ORDER BY installment_number`,
    [loanId],
  );
}

/* GET INSTALLMENT BY ID */
export async function getInstallmentById(id) {
  const db = await getDb();
  return await db.getFirstAsync(
    `SELECT * FROM loan_installments WHERE id = ?`,
    [id],
  );
}

/* UPDATE INSTALLMENT STATUS */
export async function updateInstallmentStatus(installmentId, status) {
  const db = await getDb();
  await db.runAsync(
    `UPDATE loan_installments SET status = ?, updated_at = ? WHERE id = ?`,
    [status, new Date().toISOString(), installmentId],
  );
}

/* APPLY PAYMENT TO INSTALLMENT */
export async function applyPaymentToInstallment(installmentId, paymentAmount) {
  const db = await getDb();

  // Obtener la cuota actual
  const installment = await getInstallmentById(installmentId);
  if (!installment) throw new Error("Installment not found");

  const currentPaid = installment.amount_paid || 0;
  const newPaid = currentPaid + paymentAmount;

  // Determinar nuevo estado
  let newStatus = installment.status;
  if (newPaid >= installment.scheduled_amount) {
    newStatus = "paid";
  } else if (newPaid > 0) {
    newStatus = "partial";
  }

  // Actualizar cuota
  await db.runAsync(
    `UPDATE loan_installments
     SET amount_paid = ?, status = ?, updated_at = ?
     WHERE id = ?`,
    [newPaid, newStatus, new Date().toISOString(), installmentId],
  );

  return { previousPaid: currentPaid, newPaid, status: newStatus };
}

/* GET OVERDUE INSTALLMENTS */
export async function getOverdueInstallments(loanId) {
  const db = await getDb();
  const now = new Date().toISOString();

  return await db.getAllAsync(
    `SELECT * FROM loan_installments
     WHERE loan_id = ? AND due_date < ? AND status IN ('pending', 'partial')
     ORDER BY due_date`,
    [loanId, now],
  );
}

/* GET PENDING INSTALLMENTS */
export async function getPendingInstallments(loanId) {
  const db = await getDb();
  return await db.getAllAsync(
    `SELECT * FROM loan_installments
     WHERE loan_id = ? AND status IN ('pending', 'partial')
     ORDER BY installment_number`,
    [loanId],
  );
}

/* UPDATE LATE FEES FOR INSTALLMENT */
export async function updateInstallmentLateFees(installmentId, lateFeeAmount) {
  const db = await getDb();

  await db.runAsync(
    `UPDATE loan_installments
     SET late_fee_accrued = late_fee_accrued + ?, updated_at = ?
     WHERE id = ?`,
    [lateFeeAmount, new Date().toISOString(), installmentId],
  );
}

/* GET INSTALLMENT SUMMARY BY LOAN */
export async function getInstallmentSummary(loanId) {
  const db = await getDb();

  const result = await db.getFirstAsync(
    `SELECT
      COUNT(*) as total_installments,
      SUM(CASE WHEN status = 'paid' THEN 1 ELSE 0 END) as paid_installments,
      SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending_installments,
      SUM(CASE WHEN status = 'partial' THEN 1 ELSE 0 END) as partial_installments,
      SUM(CASE WHEN status = 'overdue' THEN 1 ELSE 0 END) as overdue_installments,
      SUM(scheduled_amount) as total_scheduled,
      SUM(amount_paid) as total_paid,
      SUM(late_fee_accrued) as total_late_fees
     FROM loan_installments
     WHERE loan_id = ?`,
    [loanId],
  );

  return result;
}
