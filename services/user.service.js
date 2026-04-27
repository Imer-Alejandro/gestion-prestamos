import * as Crypto from "expo-crypto";
import { getDb } from "../database/db.js";

async function hashPassword(password) {
  return await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    password,
  );
}

export async function createUser(userData) {
  const db = await getDb();
  const passwordHash = await hashPassword(userData.password);

  const result = await db.runAsync(
    `INSERT INTO users 
      (full_name, email, phone, password_hash, created_at, is_active)
     VALUES (?, ?, ?, ?, ?, 1)`,
    [
      userData.full_name,
      userData.email,
      userData.phone,
      passwordHash,
      new Date().toISOString(),
    ],
  );

  return result.lastInsertRowId;
}

export async function getUserById(id) {
  const db = await getDb();
  return await db.getFirstAsync(`SELECT * FROM users WHERE id = ?`, [id]);
}

export async function updateUser(id, data) {
  const db = await getDb();

  await db.runAsync(
    `UPDATE users 
     SET full_name = ?, phone = ?, is_active = ?
     WHERE id = ?`,
    [data.full_name, data.phone, data.is_active, id],
  );
}

/* LOGIN SOLO POR CONTRASEÑA */
export async function loginWithPassword(password) {
  const db = await getDb();

  // Obtener el único usuario activo
  const user = await db.getFirstAsync(
    `SELECT * FROM users WHERE is_active = 1 LIMIT 1`,
  );

  if (!user) {
    throw new Error("No existe usuario registrado");
  }

  const passwordHash = await hashPassword(password);

  if (passwordHash !== user.password_hash) {
    throw new Error("Contraseña incorrecta");
  }
  await db.runAsync(`UPDATE users SET last_login = ? WHERE id = ?`, [
    new Date().toISOString(),
    user.id,
  ]);

  return user;
}

/* LOGIN CON EMAIL Y CONTRASEÑA */
export async function loginWithEmail(email, password) {
  const db = await getDb();

  console.log('🔐 Intentando login con:', email);

  // Buscar usuario por email
  const user = await db.getFirstAsync(
    `SELECT * FROM users WHERE email = ? AND is_active = 1`,
    [email.toLowerCase().trim()]
  );

  console.log('👤 Usuario encontrado:', user ? `${user.full_name} (${user.email})` : 'NO ENCONTRADO');

  if (!user) {
    throw new Error("Usuario no encontrado");
  }

  const passwordHash = await hashPassword(password);
  
  console.log('🔑 Hash de password ingresado:', passwordHash);
  console.log('🔑 Hash guardado en BD:', user.password_hash);
  console.log('✅ ¿Coinciden?', passwordHash === user.password_hash);

  if (passwordHash !== user.password_hash) {
    throw new Error("Contraseña incorrecta");
  }

  await db.runAsync(`UPDATE users SET last_login = ? WHERE id = ?`, [
    new Date().toISOString(),
    user.id,
  ]);

  return user;
}

/* CAMBIAR CONTRASEÑA */
export async function changePassword(userId, currentPassword, newPassword) {
  const db = await getDb();

  // Obtener el usuario actual
  const user = await db.getFirstAsync(`SELECT * FROM users WHERE id = ?`, [userId]);

  if (!user) {
    throw new Error("Usuario no encontrado");
  }

  // Validar contraseña actual
  const currentPasswordHash = await hashPassword(currentPassword);
  
  if (currentPasswordHash !== user.password_hash) {
    throw new Error("La contraseña actual es incorrecta");
  }

  // Validar que la nueva contraseña sea diferente
  if (currentPassword === newPassword) {
    throw new Error("La nueva contraseña debe ser diferente a la actual");
  }

  // Actualizar a la nueva contraseña
  const newPasswordHash = await hashPassword(newPassword);

  await db.runAsync(
    `UPDATE users SET password_hash = ? WHERE id = ?`,
    [newPasswordHash, userId]
  );

  return true;
}
