import { getDb } from "../database/db.js";
import { PlanManager } from "./quota.service.js";

export async function createClient(data) {
  // ── Validación de cuota ──────────────────────────────────
  const quotaCheck = await PlanManager.canExecute(data.user_id, 'registerClient');
  if (!quotaCheck.allowed) throw new Error(quotaCheck.reason);
  // ─────────────────────────────────────────────────────────

  const db = await getDb();

  // Validar si el email ya existe
  if (data.email && data.email.trim() !== '') {
    const existingEmail = await db.getFirstAsync(
      'SELECT id FROM clients WHERE email = ?',
      [data.email.trim()]
    );
    if (existingEmail) {
      throw new Error("El correo electrónico ya se encuentra registrado para otro cliente.");
    }
  }

  // Validar si el teléfono primario ya existe
  if (data.phone_primary && data.phone_primary.trim() !== '') {
    const existingPhone = await db.getFirstAsync(
      'SELECT id FROM clients WHERE phone_primary = ? OR phone_secondary = ?',
      [data.phone_primary.trim(), data.phone_primary.trim()]
    );
    if (existingPhone) {
      throw new Error("El teléfono principal ya se encuentra registrado para otro cliente.");
    }
  }

  // Validar si el teléfono secundario ya existe
  if (data.phone_secondary && data.phone_secondary.trim() !== '') {
    const existingPhone2 = await db.getFirstAsync(
      'SELECT id FROM clients WHERE phone_primary = ? OR phone_secondary = ?',
      [data.phone_secondary.trim(), data.phone_secondary.trim()]
    );
    if (existingPhone2) {
      throw new Error("El teléfono secundario ya se encuentra registrado para otro cliente.");
    }
  }

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
      signature_svg,
      is_dirty,
      created_at, is_active
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`,
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
      data.signature_svg || null,
      1, // is_dirty = 1
      new Date().toISOString(),
    ],
  );

  // ── Registrar operación exitosa ──────────────────────────
  await PlanManager.registerOperation(data.user_id, 'registerClient');
  // ─────────────────────────────────────────────────────────

  return result.lastInsertRowId;
}

/* GET ALL CLIENTS BY USER WITH FINANCIAL INFO (With Pagination) */
export async function getClients(userId, limit = 20, offset = 0) {
  const db = await getDb();

  // Obtener todos los clientes del usuario (más recientes primero) con paginación
  const clients = await db.getAllAsync(
    `SELECT * FROM clients 
     WHERE user_id = ? AND is_active = 1 
     ORDER BY created_at DESC
     LIMIT ? OFFSET ?`,
    [userId, limit, offset],
  );


  // Para cada cliente, calcular su información financiera
  const clientsWithFinancialInfo = await Promise.all(
    clients.map(async (client) => {
      // Obtener todos los préstamos activos del cliente
      const loans = await db.getAllAsync(
        `SELECT * FROM loans WHERE client_id = ? AND status NOT IN ('closed', 'voided')`,
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
        pendingDebt += (loan.current_balance || 0);

        // Verificar estado de mora
        if (loan.due_date && loan.status === 'active') {
          const dueDate = new Date(loan.due_date);
          dueDate.setHours(0, 0, 0, 0);
          
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          
          const graceDays = loan.grace_days || 0;

          // Fecha límite considerando días de gracia
          const graceDate = new Date(dueDate);
          graceDate.setDate(graceDate.getDate() + graceDays);
          graceDate.setHours(0, 0, 0, 0);

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

/**
 * Obtiene solo los clientes que tienen préstamos activos.
 * Útil para la selección de clientes al registrar abonos.
 */
export async function getClientsWithActiveLoans(userId) {
  const db = await getDb();
  const clients = await db.getAllAsync(
    `SELECT DISTINCT c.* FROM clients c
     JOIN loans l ON c.id = l.client_id
     WHERE c.user_id = ? AND c.is_active = 1 AND l.status IN ('active', 'overdue')
     ORDER BY c.first_name ASC`,
    [userId],
  );
  return clients;
}

/* GET CLIENT BY ID WITH FINANCIAL INFO */
export async function getClientById(id) {
  const db = await getDb();
  const client = await db.getFirstAsync(`SELECT * FROM clients WHERE id = ?`, [id]);
  
  if (!client) return null;

  // Obtener todos los préstamos activos del cliente
  const loans = await db.getAllAsync(
    `SELECT * FROM loans WHERE client_id = ? AND status != 'closed' AND status != 'voided'`,
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
    pendingDebt += (loan.current_balance || 0);

    // Verificar estado de mora
    if (loan.due_date && loan.status === 'active') {
      const dueDate = new Date(loan.due_date);
      dueDate.setHours(0, 0, 0, 0);
      
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const graceDays = loan.grace_days || 0;

      // Fecha límite considerando días de gracia
      const graceDate = new Date(dueDate);
      graceDate.setDate(graceDate.getDate() + graceDays);
      graceDate.setHours(0, 0, 0, 0);

      // En mora: ya pasó la fecha con días de gracia
      if (today > graceDate) {
        hasOverdueLoans = true;
      }
      // Próximo a mora: faltan 7 días o menos para vencer
      else {
        const diffTime = dueDate.getTime() - today.getTime();
        const daysUntilDue = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        if (daysUntilDue <= 7) {
          hasSoonOverdueLoans = true;
        }
      }
    }
  }

  // Determinar estado del cliente
  let status = 'al-dia';
  if (hasOverdueLoans) {
    status = 'en-mora';
  } else if (hasSoonOverdueLoans) {
    status = 'proximo-mora';
  }

  return {
    ...client,
    totalDebt,
    totalPaid,
    pendingDebt,
    status,
    activeLoansCount: loans.length,
  };
}

/* UPDATE CLIENT */
export async function updateClient(id, data) {
  // ── Validación de cuota ──────────────────────────────────
  const quotaCheck = await PlanManager.canExecute(data.user_id, 'editClient');
  if (!quotaCheck.allowed) throw new Error(quotaCheck.reason);
  // ─────────────────────────────────────────────────────────

  const db = await getDb();

  // Validar si el documento ya existe (excluyendo este cliente)
  if (data.document_number && data.document_number.trim() !== '') {
    const existingDoc = await db.getFirstAsync(
      'SELECT id FROM clients WHERE document_number = ? AND id != ?',
      [data.document_number.trim(), id]
    );
    if (existingDoc) {
      throw new Error("El número de documento ya se encuentra registrado para otro cliente.");
    }
  }

  // Validar si el email ya existe (excluyendo este cliente)
  if (data.email && data.email.trim() !== '') {
    const existingEmail = await db.getFirstAsync(
      'SELECT id FROM clients WHERE email = ? AND id != ?',
      [data.email.trim(), id]
    );
    if (existingEmail) {
      throw new Error("El correo electrónico ya se encuentra registrado para otro cliente.");
    }
  }

  // Validar si el teléfono primario ya existe (excluyendo este cliente)
  if (data.phone_primary && data.phone_primary.trim() !== '') {
    const existingPhone = await db.getFirstAsync(
      'SELECT id FROM clients WHERE (phone_primary = ? OR phone_secondary = ?) AND id != ?',
      [data.phone_primary.trim(), data.phone_primary.trim(), id]
    );
    if (existingPhone) {
      throw new Error("El teléfono principal ya se encuentra registrado para otro cliente.");
    }
  }

  // Validar si el teléfono secundario ya existe (excluyendo este cliente)
  if (data.phone_secondary && data.phone_secondary.trim() !== '') {
    const existingPhone2 = await db.getFirstAsync(
      'SELECT id FROM clients WHERE (phone_primary = ? OR phone_secondary = ?) AND id != ?',
      [data.phone_secondary.trim(), data.phone_secondary.trim(), id]
    );
    if (existingPhone2) {
      throw new Error("El teléfono secundario ya se encuentra registrado para otro cliente.");
    }
  }

  await db.runAsync(
    `UPDATE clients
     SET first_name = ?,
         last_name = ?,
         document_type = ?,
         document_number = ?,
         birth_date = ?,
         gender = ?,
         phone_primary = ?,
         phone_secondary = ?,
         email = ?,
         address_line = ?,
         city = ?,
         province = ?,
         country = ?,
         occupation = ?,
         workplace = ?,
         monthly_income = ?,
         reference_name = ?,
         reference_phone = ?,
         notes = ?,
         signature_svg = ?,
         updated_at = ?,
         is_dirty = 1
     WHERE id = ?`,
    [
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
      data.notes,
      data.signature_svg || null,
      new Date().toISOString(),
      id,
    ],
  );

  // ── Registrar operación exitosa ──────────────────────────
  await PlanManager.registerOperation(data.user_id, 'editClient');
  // ─────────────────────────────────────────────────────────
}


/* SOFT DELETE */
export async function deactivateClient(id, userId) {
  // ── Validación de cuota ──────────────────────────────────
  const quotaCheck = await PlanManager.canExecute(userId, 'deactivateClient');
  if (!quotaCheck.allowed) throw new Error(quotaCheck.reason);
  // ─────────────────────────────────────────────────────────

  const db = await getDb();
  await db.runAsync(`UPDATE clients SET is_active = 0, is_dirty = 1, updated_at = ? WHERE id = ?`, [new Date().toISOString(), id]);

  // ── Registrar operación exitosa ──────────────────────────
  await PlanManager.registerOperation(userId, 'deactivateClient');
  // ─────────────────────────────────────────────────────────
}
