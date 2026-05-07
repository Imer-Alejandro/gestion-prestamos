import * as Crypto from "expo-crypto";
import { getDb } from "../database/db.js";

// Generar código aleatorio de 6 dígitos
export function generateVerificationCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Generar token aleatorio para recuperación de contraseña
export async function generateResetToken() {
  return await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    Math.random().toString(36).substring(2, 15) +
      Math.random().toString(36).substring(2, 15)
  );
}

/**
 * Enviar código de validación de correo (Simulado - en producción usar servicio real)
 * En un app real, esto llamaría a un backend que envía emails
 */
export async function sendVerificationEmail(email, fullName, code) {
  try {
    console.log("📧 Email de validación enviado a:", email);
    console.log(`👤 Usuario: ${fullName}`);
    console.log(`🔐 Código: ${code}`);
    console.log("⏰ Válido por: 10 minutos");
    console.log("🔔 EN DESARROLLO: El código aparecerá en una alerta");

    // En producción, aquí harías una llamada a tu backend/servicio de email
    // await fetch('YOUR_BACKEND_URL/send-verification-email', {
    //   method: 'POST',
    //   body: JSON.stringify({ email, fullName, code })
    // })

    // Para desarrollo, retornar el código
    return {
      success: true,
      message: `Código enviado a ${email}. Revisa tu bandeja de entrada.`,
      code: code, // Agregado para debugging en desarrollo
    };
  } catch (error) {
    console.error("Error enviando email:", error);
    throw new Error("No se pudo enviar el código de validación");
  }
}

/**
 * Enviar código de recuperación de contraseña (Simulado)
 */
export async function sendPasswordResetEmail(email, fullName, code) {
  try {
    console.log("📧 Email de recuperación de contraseña enviado a:", email);
    console.log(`👤 Usuario: ${fullName}`);
    console.log(`🔐 Código: ${code}`);
    console.log("⏰ Válido por: 15 minutos");

    return {
      success: true,
      message: `Código de recuperación enviado a ${email}`,
    };
  } catch (error) {
    console.error("Error enviando email de reset:", error);
    throw new Error("No se pudo enviar el código de recuperación");
  }
}

/**
 * Crear registro de validación de correo
 */
export async function createEmailValidation(userId, email) {
  const db = await getDb();
  const code = generateVerificationCode();

  // Expira en 10 minutos
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

  // Eliminar validaciones previas no usadas
  await db.runAsync(
    "DELETE FROM email_validations WHERE user_id = ? AND is_used = 0",
    [userId]
  );

  const result = await db.runAsync(
    `INSERT INTO email_validations 
    (user_id, email, validation_code, created_at, expires_at)
    VALUES (?, ?, ?, ?, ?)`,
    [userId, email, code, new Date().toISOString(), expiresAt]
  );

  return { id: result.lastInsertRowId, code };
}

/**
 * Verificar código de validación de correo
 */
export async function verifyEmailCode(userId, email, providedCode) {
  const db = await getDb();

  // Obtener validación pendiente
  const validation = await db.getFirstAsync(
    `SELECT * FROM email_validations 
    WHERE user_id = ? AND email = ? AND is_used = 0 
    AND expires_at > datetime('now')
    ORDER BY created_at DESC LIMIT 1`,
    [userId, email]
  );

  if (!validation) {
    throw new Error("Código expirado o no encontrado. Solicita uno nuevo.");
  }

  // Verificar intentos
  if (validation.attempts >= validation.max_attempts) {
    await db.runAsync(
      "DELETE FROM email_validations WHERE id = ?",
      [validation.id]
    );
    throw new Error("Demasiados intentos. Solicita un código nuevo.");
  }

  // Verificar código
  if (validation.validation_code !== providedCode) {
    // Incrementar intentos
    await db.runAsync(
      "UPDATE email_validations SET attempts = attempts + 1 WHERE id = ?",
      [validation.id]
    );

    const remainingAttempts =
      validation.max_attempts - validation.attempts - 1;
    throw new Error(
      `Código incorrecto. ${remainingAttempts} intentos restantes.`
    );
  }

  // Marcar como usado
  await db.runAsync(
    `UPDATE email_validations 
    SET is_used = 1, used_at = ? WHERE id = ?`,
    [new Date().toISOString(), validation.id]
  );

  // Actualizar usuario como verificado
  await db.runAsync(
    `UPDATE users 
    SET email_verified = 1, email_verified_at = ? 
    WHERE id = ?`,
    [new Date().toISOString(), userId]
  );

  return { success: true, message: "Correo validado correctamente" };
}

/**
 * Crear registro de recuperación de contraseña
 */
export async function createPasswordReset(userId, email) {
  const db = await getDb();
  const code = generateVerificationCode();

  // Expira en 15 minutos
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();

  // Eliminar resets previos no usados
  await db.runAsync(
    "DELETE FROM password_resets WHERE user_id = ? AND is_used = 0",
    [userId]
  );

  const result = await db.runAsync(
    `INSERT INTO password_resets 
    (user_id, email, reset_code, created_at, expires_at)
    VALUES (?, ?, ?, ?, ?)`,
    [userId, email, code, new Date().toISOString(), expiresAt]
  );

  return { id: result.lastInsertRowId, code };
}

/**
 * Verificar código de recuperación de contraseña
 */
export async function verifyPasswordResetCode(email, providedCode) {
  const db = await getDb();

  // Obtener usuario por email
  const user = await db.getFirstAsync(
    "SELECT id FROM users WHERE email = ?",
    [email]
  );

  if (!user) {
    throw new Error("Usuario no encontrado");
  }

  // Obtener reset pendiente
  const reset = await db.getFirstAsync(
    `SELECT * FROM password_resets 
    WHERE user_id = ? AND email = ? AND is_used = 0 
    AND expires_at > datetime('now')
    ORDER BY created_at DESC LIMIT 1`,
    [user.id, email]
  );

  if (!reset) {
    throw new Error("Código expirado o no encontrado. Solicita uno nuevo.");
  }

  // Verificar intentos
  if (reset.attempts >= reset.max_attempts) {
    await db.runAsync(
      "DELETE FROM password_resets WHERE id = ?",
      [reset.id]
    );
    throw new Error("Demasiados intentos. Solicita un código nuevo.");
  }

  // Verificar código
  if (reset.reset_code !== providedCode) {
    await db.runAsync(
      "UPDATE password_resets SET attempts = attempts + 1 WHERE id = ?",
      [reset.id]
    );

    const remainingAttempts = reset.max_attempts - reset.attempts - 1;
    throw new Error(
      `Código incorrecto. ${remainingAttempts} intentos restantes.`
    );
  }

  // Marcar como usado
  await db.runAsync(
    `UPDATE password_resets 
    SET is_used = 1, used_at = ? WHERE id = ?`,
    [new Date().toISOString(), reset.id]
  );

  return { userId: user.id, success: true };
}

/**
 * Obtener estado de validación de email
 */
export async function getEmailValidationStatus(userId) {
  const db = await getDb();

  const user = await db.getFirstAsync(
    "SELECT email, email_verified, email_verified_at FROM users WHERE id = ?",
    [userId]
  );

  return {
    email: user?.email || "",
    isVerified: user?.email_verified === 1,
    verifiedAt: user?.email_verified_at,
  };
}

/**
 * Verificar si email está disponible
 */
export async function checkEmailAvailability(email) {
  const db = await getDb();

  const existing = await db.getFirstAsync(
    "SELECT id FROM users WHERE email = ?",
    [email.trim()]
  );

  return !existing;
}
