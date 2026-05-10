import { getDb } from "../database/db.js";
import { getLoanById } from "./loan.service.js";


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

import { distributePaymentToInstallment } from "../utils/payment-distribution.utils.js";

/* APPLY PAYMENT TO INSTALLMENT (Internal distribution) */
export async function applyPaymentToInstallment(installmentId, paymentAmount) {
  const db = await getDb();

  // Obtener la cuota actual
  const installment = await getInstallmentById(installmentId);
  if (!installment) throw new Error("Installment not found");

  // Usar la utilidad de distribución para desglosar el pago
  // Nota: lateFeeOwed se pasa como 0 porque refreshInstallmentMora ya debió actualizar late_fee_accrued
  const distribution = distributePaymentToInstallment(paymentAmount, installment);

  const newPaid = Math.round((installment.amount_paid || 0) + distribution.totalDistributed);
  const totalDue = Math.round(installment.scheduled_amount + (installment.late_fee_accrued || 0));

  // Determinar nuevo estado
  let newStatus = installment.status;
  if (newPaid >= totalDue || (totalDue - newPaid) < 1) {
    newStatus = "paid";
  } else if (newPaid > 0) {
    newStatus = "partial";
  }

  // Actualizar cuota con el desglose
  await db.runAsync(
    `UPDATE loan_installments
     SET amount_paid = ?, 
         remaining_capital = ?,
         remaining_interest = ?,
         remaining_late_fee = ?,
         status = ?, 
         updated_at = ?
     WHERE id = ?`,
    [
      newPaid, 
      distribution.remainingAmount === 0 ? Math.max(0, installment.remaining_capital - distribution.capitalPortion) : installment.remaining_capital - distribution.capitalPortion,
      Math.max(0, installment.remaining_interest - distribution.interestPortion),
      Math.max(0, (installment.remaining_late_fee || 0) - distribution.lateFeePortion),
      newStatus, 
      new Date().toISOString(), 
      installmentId
    ],
  );

  return { 
    ...distribution,
    previousPaid: installment.amount_paid || 0, 
    newPaid, 
    status: newStatus 
  };
}


/* CALCULATE AND UPDATE MORA FOR INSTALLMENT */
export async function refreshInstallmentMora(installmentId) {
  const db = await getDb();
  
  const inst = await db.getFirstAsync(`
    SELECT li.*, l.late_fee_type, l.late_fee_value, l.grace_days
    FROM loan_installments li
    JOIN loans l ON li.loan_id = l.id
    WHERE li.id = ?
  `, [installmentId]);

  if (!inst || inst.status === 'paid') return inst;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const dueDate = new Date(inst.due_date);
  dueDate.setHours(0, 0, 0, 0);
  
  const graceDate = new Date(dueDate);
  graceDate.setDate(graceDate.getDate() + (inst.grace_days || 0));
  graceDate.setHours(0, 0, 0, 0);

  if (today > graceDate && inst.late_fee_accrued === 0 && inst.late_fee_value > 0) {
    let mora = 0;
    if (inst.late_fee_type === 'percentage') {
      mora = Math.round(inst.scheduled_amount * (inst.late_fee_value / 100));
    } else {
      mora = Math.round(inst.late_fee_value);
    }

    await db.runAsync(
      `UPDATE loan_installments SET late_fee_accrued = ?, status = 'overdue', updated_at = ? WHERE id = ?`,
      [mora, new Date().toISOString(), installmentId]
    );
    
    // Devolver objeto actualizado
    return { ...inst, late_fee_accrued: mora, status: 'overdue' };
  }

  return inst;
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

/* GET PENDING INSTALLMENTS (inc. partial and overdue) */
export async function getPendingInstallments(loanId) {
  const db = await getDb();
  return await db.getAllAsync(
    `SELECT * FROM loan_installments
     WHERE loan_id = ? AND status IN ('pending', 'partial', 'overdue')
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
