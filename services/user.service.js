import * as Crypto from "expo-crypto";
import { getDb } from "../database/db.js";
import { PlanManager } from "./quota.service.js";

async function hashPassword(password) {
  return await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    password,
  );
}

const PLAN_SECRET_SALT = "imer-ale-loan-mgmt-2026-secure-plan-salt";

export async function generatePlanHash(userId, planType) {
  const dataToHash = `${userId}|${planType}|${PLAN_SECRET_SALT}`;
  return await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    dataToHash
  );
}

export async function createUser(userData) {
  const db = await getDb();

  // Validar si el email ya existe
  if (userData.email && userData.email.trim() !== '') {
    const existingEmail = await db.getFirstAsync(
      'SELECT id FROM users WHERE email = ?',
      [userData.email.trim()]
    );
    if (existingEmail) {
      throw new Error("El correo electrónico ya se encuentra registrado para otro usuario.");
    }
  }

  // Validar si el teléfono ya existe
  if (userData.phone && userData.phone.trim() !== '') {
    const existingPhone = await db.getFirstAsync(
      'SELECT id FROM users WHERE phone = ?',
      [userData.phone.trim()]
    );
    if (existingPhone) {
      throw new Error("El teléfono ya se encuentra registrado para otro usuario.");
    }
  }

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

  const userId = result.lastInsertRowId;

  // Si vienen datos de la organización, guardarlos
  if (userData.organizacion) {
    const org = userData.organizacion;
    const planType = org.plan_type || 'basic';
    const planHash = await generatePlanHash(userId, planType);

    await db.runAsync(
      `INSERT INTO organizations 
        (user_id, name, type, slogan, logo_path, address, phone, email, rnc, currency, plan_type, plan_hash, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        userId,
        org.nombre || org.name,
        org.tipo || org.type,
        org.eslogan || org.slogan || null,
        org.logo || org.logo_path || null,
        org.direccion || org.address || null,
        org.phone || null,
        org.email || null,
        org.rnc || null,
        org.currency || 'DOP',
        planType,
        planHash,
        new Date().toISOString(),
      ]
    );
  }

  return userId;
}

export async function getUserById(id) {
  const db = await getDb();
  const user = await db.getFirstAsync(`SELECT * FROM users WHERE id = ?`, [id]);
  if (user) {
    const org = await db.getFirstAsync(`SELECT * FROM organizations WHERE user_id = ?`, [id]);
    user.organization = org;
  }
  return user;
}

export async function getOrganizationByUserId(userId) {
  const db = await getDb();
  return await db.getFirstAsync(`SELECT * FROM organizations WHERE user_id = ?`, [userId]);
}

export async function updateOrganization(userId, data) {
  const db = await getDb();
  await db.runAsync(
    `UPDATE organizations 
     SET name = ?, type = ?, slogan = ?, logo_path = ?, address = ?, phone = ?, email = ?, rnc = ?, currency = ?, updated_at = ?
     WHERE user_id = ?`,
    [
      data.name,
      data.type,
      data.slogan || null,
      data.logo_path || null,
      data.address || null,
      data.phone || null,
      data.email || null,
      data.rnc || null,
      data.currency || 'DOP',
      new Date().toISOString(),
      userId
    ]
  );

  // ── Registrar operación exitosa ──────────────────────────
  await PlanManager.registerOperation(userId, 'updateUserData');
  // ─────────────────────────────────────────────────────────
}

export async function updateUserPlan(userId, planType) {
  const db = await getDb();
  const planHash = await generatePlanHash(userId, planType);
  
  await db.runAsync(
    `UPDATE organizations 
     SET plan_type = ?, plan_hash = ?, updated_at = ?
     WHERE user_id = ?`,
    [planType, planHash, new Date().toISOString(), userId]
  );
  
  return true;
}

export async function verifyPlanIntegrity(userId, storedPlanType, storedPlanHash) {
  const expectedHash = await generatePlanHash(userId, storedPlanType);
  return expectedHash === storedPlanHash;
}

export async function updateUser(id, data) {
  const db = await getDb();

  // Validar si el teléfono ya existe
  if (data.phone && data.phone.trim() !== '') {
    const existingPhone = await db.getFirstAsync(
      'SELECT id FROM users WHERE phone = ? AND id != ?',
      [data.phone.trim(), id]
    );
    if (existingPhone) {
      throw new Error("El teléfono ya se encuentra registrado para otro usuario.");
    }
  }

  await db.runAsync(
    `UPDATE users 
     SET full_name = ?, phone = ?, is_active = ?
     WHERE id = ?`,
    [data.full_name, data.phone, data.is_active, id],
  );

  // ── Registrar operación exitosa ──────────────────────────
  await PlanManager.registerOperation(id, 'updateUserData');
  // ─────────────────────────────────────────────────────────
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

  const org = await db.getFirstAsync(`SELECT * FROM organizations WHERE user_id = ?`, [user.id]);
  user.organization = org;

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
