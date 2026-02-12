/**
 * Utilidad para crear préstamos de prueba
 * Ejecutar después de tener clientes registrados
 */

import { getDb } from "./db.js";

export async function createTestLoans() {
  const db = await getDb();

  try {
    // Verificar si ya hay préstamos
    const existingLoans = await db.getAllAsync(`SELECT COUNT(*) as count FROM loans`);
    if (existingLoans[0].count > 0) {
      console.log("⚠️ Ya existen préstamos en la base de datos");
      return;
    }

    // Obtener clientes existentes
    const clients = await db.getAllAsync(`SELECT * FROM clients LIMIT 5`);
    
    if (clients.length === 0) {
      console.log("⚠️ No hay clientes para crear préstamos de prueba");
      return;
    }

    console.log(`📝 Creando préstamos de prueba para ${clients.length} clientes...`);

    const today = new Date();
    const loanPromises = clients.map(async (client: any, index: number) => {
      // Variar las fechas de vencimiento para diferentes estados
      let dueDate = new Date(today);
      
      if (index === 0) {
        // Cliente 1: En mora (vencido hace 10 días)
        dueDate.setDate(dueDate.getDate() - 10);
      } else if (index === 1) {
        // Cliente 2: Próximo a vencer (vence en 5 días)
        dueDate.setDate(dueDate.getDate() + 5);
      } else if (index === 2) {
        // Cliente 3: En mora (vencido hace 3 días)
        dueDate.setDate(dueDate.getDate() - 3);
      } else {
        // Resto: Al día (vence en 15-30 días)
        dueDate.setDate(dueDate.getDate() + 15 + index * 5);
      }

      const startDate = new Date(dueDate);
      startDate.setDate(startDate.getDate() - 30); // Préstamo de 30 días

      const principalAmount = 10000 + (index * 5000); // 10k, 15k, 20k, etc.
      const totalPaid = index < 2 ? principalAmount * 0.3 : principalAmount * 0.6; // Algunos con más pagos
      
      // Variar tipos de préstamo
      const loanTypes = ['personal', 'vehicular', 'negocio', 'emergencia', 'hipotecario'];
      const loanType = loanTypes[index % loanTypes.length];

      await db.runAsync(
        `INSERT INTO loans (
          user_id, client_id,
          contract_number,
          loan_type,
          principal_amount, disbursed_amount,
          interest_rate, interest_calculation_base,
          late_fee_type, late_fee_value,
          start_date, due_date,
          payment_frequency,
          grace_days,
          status,
          total_paid,
          created_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          client.user_id,
          client.id,
          `LOAN-${String(index + 1).padStart(5, '0')}`,
          loanType,
          principalAmount,
          principalAmount,
          10.0, // 10% de interés
          'monthly',
          'percentage',
          5.0, // 5% de mora
          startDate.toISOString().split('T')[0],
          dueDate.toISOString().split('T')[0],
          'monthly',
          3, // 3 días de gracia
          'active',
          totalPaid,
          new Date().toISOString(),
        ]
      );
    });

    await Promise.all(loanPromises);

    console.log(`✅ ${clients.length} préstamos de prueba creados exitosamente`);
    
    // Mostrar resumen
    const summary = await db.getAllAsync(`
      SELECT 
        c.first_name || ' ' || c.last_name as cliente,
        l.principal_amount as deuda,
        l.total_paid as pagado,
        l.due_date as vencimiento,
        CASE 
          WHEN date(l.due_date) < date('now') THEN 'EN MORA'
          WHEN julianday(l.due_date) - julianday('now') <= 7 THEN 'PRÓXIMO A VENCER'
          ELSE 'AL DÍA'
        END as estado
      FROM loans l
      JOIN clients c ON l.client_id = c.id
      ORDER BY l.due_date ASC
    `);

    console.log("\n📊 Resumen de préstamos de prueba:");
    console.table(summary);

  } catch (error) {
    console.error("❌ Error creando préstamos de prueba:", error);
    throw error;
  }
}
