import { getDb } from "../database/db.js";
import { generateFrenchAmortization, generateFlatAmortization } from "../utils/amortization.utils.js";
import { generateAndSaveInstallments } from "./installment.service.js";

function generateContractNumber() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Excluyendo 0, O, I, 1 por claridad
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/* CREATE LOAN */
export async function createLoan(data) {
  // Validaciones básicas
  if (!data.user_id || !data.client_id || !data.principal_amount) {
    throw new Error("Missing required fields: user_id, client_id, principal_amount");
  }

  if (data.interest_rate === undefined || !data.installments || !data.start_date) {
    throw new Error("Missing required fields: interest_rate, installments, start_date");
  }

  const db = await getDb();
  const contractNumber = data.contract_number && data.contract_number.trim() !== '' 
    ? data.contract_number 
    : generateContractNumber();

  // Generar cuotas primero para calcular interés total
  let totalInterest = 0;
  let schedule = [];
  const amortizationType = data.amortization_type || "francesa";

  // Usar interest_calculation_base como fuente de verdad si interest_rate_period no está presente
  const ratePeriod = data.interest_rate_period || data.interest_calculation_base || "monthly";

  if (amortizationType === "francesa") {
    schedule = generateFrenchAmortization({
      principal: data.principal_amount,
      rate: data.interest_rate,
      installments: data.installments,
      startDate: data.start_date,
      paymentFrequency: data.payment_frequency || "monthly",
      interestRatePeriod: ratePeriod,
    });
  } else if (amortizationType === "plana") {
    schedule = generateFlatAmortization({
      principal: data.principal_amount,
      rate: data.interest_rate,
      installments: data.installments,
      startDate: data.start_date,
      paymentFrequency: data.payment_frequency || "monthly",
    });
  }

  totalInterest = schedule.reduce((sum, inst) => sum + inst.interest_amount, 0);


  const initialBalance = data.principal_amount + totalInterest;

  const result = await db.runAsync(
    `INSERT INTO loans (
      user_id,
      client_id,
      current_balance,
      total_interest,
      total_late_fees,
      contract_number,
      loan_type,
      principal_amount,
      disbursed_amount,
      interest_rate,
      interest_calculation_base,
      interest_rate_period,
      late_fee_type,
      late_fee_value,
      amortization_type,
      installments,
      start_date,
      due_date,
      payment_frequency,
      grace_days,
      status,
      total_paid,
      comments,
      created_at
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      data.user_id,
      data.client_id,
      initialBalance, // current_balance inicial = principal + intereses
      totalInterest, // total_interest proyectado
      0, // total_late_fees
      contractNumber,
      data.loan_type || "personal",
      data.principal_amount,
      data.disbursed_amount,
      data.interest_rate,
      data.interest_calculation_base,
      data.interest_rate_period,
      data.late_fee_type,
      data.late_fee_value,
      amortizationType,
      data.installments,
      data.start_date,
      data.due_date,
      data.payment_frequency,
      data.grace_days || 0,
      "active",
      0, // total_paid
      data.comments || null, // comments
      new Date().toISOString(),
    ],
  );


  const loanId = result.lastInsertRowId;

  // Guardar cuotas generadas
  if (schedule.length > 0) {
    try {
      await generateAndSaveInstallments(loanId, schedule);
    } catch (error) {
      console.error("Error saving installments:", error);
    }
  }

  // Notificación de éxito (Feedback inmediato silencioso)
  try {
    const { sendLocalNotification } = await import("./notification.service");
    await sendLocalNotification(
      "🎉 Préstamo Creado",
      `El préstamo por $${data.principal_amount.toLocaleString()} ha sido registrado correctamente.`,
      { screen: '/prestamos_abonos', params: { initialTab: 'prestamos' } },
      data.user_id,
      'success',
      true // Silent: solo interna
    );
  } catch (error) {
    console.error("Error enviando notificación de préstamo:", error);
  }

  return loanId;
}

/* GET LOAN BY ID */
export async function getLoanById(id) {
  const db = await getDb();
  return await db.getFirstAsync(`SELECT * FROM loans WHERE id = ?`, [id]);
}

/* UPDATE LOAN */
export async function updateLoan(id, data) {
  const db = await getDb();

  const fields = [];
  const values = [];

  if (data.contract_number !== undefined) {
    fields.push("contract_number = ?");
    values.push(data.contract_number);
  }
  if (data.loan_type !== undefined) {
    fields.push("loan_type = ?");
    values.push(data.loan_type);
  }
  if (data.principal_amount !== undefined) {
    fields.push("principal_amount = ?");
    values.push(data.principal_amount);
  }
  if (data.disbursed_amount !== undefined) {
    fields.push("disbursed_amount = ?");
    values.push(data.disbursed_amount);
  }
  if (data.interest_rate !== undefined) {
    fields.push("interest_rate = ?");
    values.push(data.interest_rate);
  }
  if (data.interest_calculation_base !== undefined) {
    fields.push("interest_calculation_base = ?");
    values.push(data.interest_calculation_base);
  }
  if (data.interest_rate_period !== undefined) {
    fields.push("interest_rate_period = ?");
    values.push(data.interest_rate_period);
  }
  if (data.late_fee_type !== undefined) {
    fields.push("late_fee_type = ?");
    values.push(data.late_fee_type);
  }
  if (data.late_fee_value !== undefined) {
    fields.push("late_fee_value = ?");
    values.push(data.late_fee_value);
  }
  if (data.amortization_type !== undefined) {
    fields.push("amortization_type = ?");
    values.push(data.amortization_type);
  }
  if (data.installments !== undefined) {
    fields.push("installments = ?");
    values.push(data.installments);
  }
  if (data.start_date !== undefined) {
    fields.push("start_date = ?");
    values.push(data.start_date);
  }
  if (data.due_date !== undefined) {
    fields.push("due_date = ?");
    values.push(data.due_date);
  }
  if (data.payment_frequency !== undefined) {
    fields.push("payment_frequency = ?");
    values.push(data.payment_frequency);
  }
  if (data.grace_days !== undefined) {
    fields.push("grace_days = ?");
    values.push(data.grace_days);
  }
  if (data.status !== undefined) {
    fields.push("status = ?");
    values.push(data.status);
  }
  if (data.comments !== undefined) {
    fields.push("comments = ?");
    values.push(data.comments);
  }

  if (fields.length === 0) return;

  fields.push("updated_at = ?");
  values.push(new Date().toISOString());
  values.push(id);

  await db.runAsync(
    `UPDATE loans SET ${fields.join(", ")} WHERE id = ?`,
    values,
  );
}

/* GET LOANS BY CLIENT */
export async function getLoansByClient(clientId) {
  const db = await getDb();
  return await db.getAllAsync(
    `SELECT * FROM loans WHERE client_id = ? ORDER BY created_at DESC`,
    [clientId]
  );
}


/* UPDATE CURRENT BALANCE */
export async function updateCurrentBalance(loanId, newBalance) {
  const db = await getDb();
  await db.runAsync(
    `UPDATE loans SET current_balance = ?, updated_at = ? WHERE id = ?`,
    [newBalance, new Date().toISOString(), loanId],
  );
}

/* GET LOANS BY STATUS */
export async function getLoansByStatus(userId, status) {
  const db = await getDb();
  return await db.getAllAsync(
    `SELECT * FROM loans WHERE user_id = ? AND status = ? ORDER BY created_at DESC`,
    [userId, status],
  );
}


/* DELETE LOAN */
export async function deleteLoan(id) {
  const db = await getDb();
  await db.runAsync(`DELETE FROM loans WHERE id = ?`, [id]);
}

/* VOID LOAN (soft-delete) */
export async function voidLoan(id) {
  const db = await getDb();
  await db.runAsync(
    `UPDATE loans SET status = 'voided', updated_at = ?, closed_at = ? WHERE id = ?`,
    [new Date().toISOString(), new Date().toISOString(), id]
  );
}
/* GET LOANS WITH FILTERS */
export async function getLoans(userId, filters = {}) {
  const db = await getDb();
  let query = `SELECT * FROM loans WHERE user_id = ?`;
  const params = [userId];

  // Siempre excluir préstamos anulados (a menos que se pida explícitamente)
  if (filters.status && filters.status !== 'all') {
    query += ` AND status = ?`;
    params.push(filters.status);
  } else {
    // Por defecto, nunca mostrar préstamos anulados
    query += ` AND status != 'voided'`;
  }

  if (filters.payment_frequency && filters.payment_frequency !== 'all') {
    query += ` AND payment_frequency = ?`;
    params.push(filters.payment_frequency);
  }

  if (filters.date) {
    query += ` AND start_date = ?`;
    params.push(filters.date);
  }

  query += ` ORDER BY created_at DESC`;

  return await db.getAllAsync(query, params);
}

