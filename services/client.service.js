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

/* GET ALL CLIENTS BY USER */
export async function getClients(userId) {
  const db = await getDb();
  return await db.getAllAsync(
    `SELECT * FROM clients WHERE user_id = ? AND is_active = 1`,
    [userId],
  );
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
