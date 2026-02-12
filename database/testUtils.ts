/**
 * Script de prueba para crear un usuario de prueba
 * Ejecuta esto para tener un usuario listo para probar el login
 */

import { getDatabase } from "./db";
import * as Crypto from "expo-crypto";

async function hashPassword(password: string) {
  return await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    password,
  );
}

export async function createTestUser() {
  try {
    const db = await getDatabase();
    
    // Verificar si ya existe un usuario
    const existingUser = await db.getFirstAsync(
      `SELECT * FROM users WHERE is_active = 1 LIMIT 1`
    );
    
    if (existingUser) {
      console.log("✅ Ya existe un usuario de prueba:", existingUser);
      return existingUser;
    }
    
    // Crear usuario de prueba
    const passwordHash = await hashPassword("test123");
    
    const result = await db.runAsync(
      `INSERT INTO users 
        (full_name, email, phone, password_hash, created_at, is_active)
       VALUES (?, ?, ?, ?, ?, 1)`,
      [
        "Usuario de Prueba",
        "test@example.com",
        "+18091234567",
        passwordHash,
        new Date().toISOString(),
      ]
    );
    
    const newUser = await db.getFirstAsync(
      `SELECT * FROM users WHERE id = ?`,
      [result.lastInsertRowId]
    );
    
    console.log("✅ Usuario de prueba creado:");
    console.log("   Nombre: Usuario de Prueba");
    console.log("   Email: test@example.com");
    console.log("   Contraseña: test123");
    console.log("   ID:", newUser?.id);
    
    return newUser;
  } catch (error) {
    console.error("❌ Error creando usuario de prueba:", error);
    throw error;
  }
}

// Función para limpiar todos los usuarios (útil para testing)
export async function clearAllUsers() {
  try {
    const db = await getDatabase();
    await db.runAsync(`DELETE FROM users`);
    console.log("✅ Todos los usuarios eliminados");
  } catch (error) {
    console.error("❌ Error eliminando usuarios:", error);
  }
}

// Función para listar todos los usuarios
export async function listAllUsers() {
  try {
    const db = await getDatabase();
    const users = await db.getAllAsync(`SELECT * FROM users`);
    console.log("👥 Usuarios en la base de datos:");
    users.forEach((user: any) => {
      console.log(`   - ID: ${user.id}, Nombre: ${user.full_name}, Email: ${user.email}`);
    });
    return users;
  } catch (error) {
    console.error("❌ Error listando usuarios:", error);
  }
}

// Función para crear clientes de prueba
export async function createTestClients() {
  try {
    const db = await getDatabase();
    
    // Verificar si ya hay clientes
    const existingClients = await db.getAllAsync(`SELECT COUNT(*) as count FROM clients`);
    if (existingClients[0].count > 0) {
      console.log("✅ Ya existen clientes de prueba");
      return;
    }
    
    // Obtener el usuario de prueba
    const user = await db.getFirstAsync(`SELECT * FROM users WHERE email = 'test@example.com'`);
    
    if (!user) {
      console.log("⚠️ No se encontró usuario de prueba para crear clientes");
      return;
    }
    
    console.log("📝 Creando clientes de prueba...");
    
    const testClients = [
      {
        first_name: "Juan",
        last_name: "Pérez García",
        document_type: "Cédula",
        document_number: "001-0123456-7",
        phone_primary: "+18091112222",
        address_line: "Calle Principal #123, Los Jardines",
        city: "Santo Domingo",
      },
      {
        first_name: "María",
        last_name: "Rodríguez Santos",
        document_type: "Cédula",
        document_number: "001-0234567-8",
        phone_primary: "+18092223333",
        address_line: "Av. Winston Churchill #45, Piantini",
        city: "Santo Domingo",
      },
      {
        first_name: "Carlos",
        last_name: "Martínez López",
        document_type: "Cédula",
        document_number: "001-0345678-9",
        phone_primary: "+18093334444",
        address_line: "Calle El Sol #67, Gazcue",
        city: "Santo Domingo",
      },
      {
        first_name: "Ana",
        last_name: "González Fernández",
        document_type: "Cédula",
        document_number: "001-0456789-0",
        phone_primary: "+18094445555",
        address_line: "Calle Duarte #89, Zona Colonial",
        city: "Santo Domingo",
      },
      {
        first_name: "Luis",
        last_name: "Sánchez Díaz",
        document_type: "Cédula",
        document_number: "001-0567890-1",
        phone_primary: "+18095556666",
        address_line: "Av. Abraham Lincoln #101, Naco",
        city: "Santo Domingo",
      },
    ];
    
    for (const client of testClients) {
      await db.runAsync(
        `INSERT INTO clients (
          user_id, first_name, last_name,
          document_type, document_number,
          phone_primary, address_line, city,
          created_at, is_active
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`,
        [
          user.id,
          client.first_name,
          client.last_name,
          client.document_type,
          client.document_number,
          client.phone_primary,
          client.address_line,
          client.city,
          new Date().toISOString(),
        ]
      );
    }
    
    console.log(`✅ ${testClients.length} clientes de prueba creados exitosamente`);
  } catch (error) {
    console.error("❌ Error creando clientes de prueba:", error);
    throw error;
  }
}
