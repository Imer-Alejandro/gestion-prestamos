import { getDb } from "../database/db.js";

export async function createClient(data) {
  const db = await getDb();

  const result = await db.runAsync(
    `INSERT INTO clients (
      user_id, first_name, last_name,
      document_type, document_number,
      birth_date, gender,
      phone_primary, phone_secondary, email,
      address_line, city, province, country,
      occupation, workplace, monthly_income,
      reference_name, reference_phone,
      credit_limit, notes,
      created_at, is_active
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`,
    [
      data.user_id,
      data.first_name,
      data.last_name,
      data.document_type,
      data.document_number,
      data.birth_date,
      data.gender,
      data.phone_primary,
      data.phone_secondary,
      data.email,
      data.address_line,
      data.city,
      data.province,
      data.country,
      data.occupation,
      data.workplace,
      data.monthly_income,
      data.reference_name,
      data.reference_phone,
      data.credit_limit,
      data.notes,
      new Date().toISOString(),
    ],
  );

  return result.lastInsertRowId;
}

/* GET ALL CLIENTS BY USER WITH FINANCIAL INFO */
export async function getClients(userId) {
  const db = await getDb();
  
  // Obtener todos los clientes del usuario
  const clients = await db.getAllAsync(
    `SELECT * FROM clients WHERE user_id = ? AND is_active = 1`,
    [userId],
  );

  // Para cada cliente, calcular su información financiera
  const clientsWithFinancialInfo = await Promise.all(
    clients.map(async (client) => {
      // Obtener todos los préstamos activos del cliente
      const loans = await db.getAllAsync(
        `SELECT * FROM loans WHERE client_id = ? AND status != 'closed'`,
        [client.id]
      );

      let totalDebt = 0;
      let totalPaid = 0;
      let pendingDebt = 0;
      let hasOverdueLoans = false;
      let hasSoonOverdueLoans = false;

      // Calcular totales y estado
      for (const loan of loans) {
        const principalAmount = loan.principal_amount || 0;
        const paidAmount = loan.total_paid || 0;
        
        totalDebt += principalAmount;
        totalPaid += paidAmount;
        pendingDebt += (principalAmount - paidAmount);

        // Verificar estado de mora
        if (loan.due_date && loan.status === 'active') {
          const dueDate = new Date(loan.due_date);
          const today = new Date();
          const graceDays = loan.grace_days || 0;
          
          // Fecha límite considerando días de gracia
          const graceDate = new Date(dueDate);
          graceDate.setDate(graceDate.getDate() + graceDays);
          
          // En mora: ya pasó la fecha con días de gracia
          if (today > graceDate) {
            hasOverdueLoans = true;
          } 
          // Próximo a mora: faltan 7 días o menos para vencer
          else {
            const daysUntilDue = Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24));
            if (daysUntilDue <= 7) {
              hasSoonOverdueLoans = true;
            }
          }
        }
      }

      // Determinar estado del cliente
      let status = 'al-dia'; // al día
      if (hasOverdueLoans) {
        status = 'en-mora'; // en mora
      } else if (hasSoonOverdueLoans) {
        status = 'proximo-mora'; // próximo a mora
      }

      return {
        ...client,
        totalDebt,
        totalPaid,
        pendingDebt,
        status,
        activeLoansCount: loans.length,
      };
    })
  );

  return clientsWithFinancialInfo;
}

/* GET CLIENT BY ID */
export async function getClientById(id) {
  const db = await getDb();
  return await db.getFirstAsync(`SELECT * FROM clients WHERE id = ?`, [id]);
}

/* UPDATE CLIENT */
export async function updateClient(id, data) {
  const db = await getDb();

  await db.runAsync(
    `UPDATE clients
     SET phone_primary = ?, address_line = ?, updated_at = ?
     WHERE id = ?`,
    [data.phone_primary, data.address_line, new Date().toISOString(), id],
  );
}

/* SOFT DELETE */
export async function deactivateClient(id) {
  const db = await getDb();
  await db.runAsync(`UPDATE clients SET is_active = 0 WHERE id = ?`, [id]);
}
