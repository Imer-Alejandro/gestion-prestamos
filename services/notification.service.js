import * as Notifications from 'expo-notifications';
import * as TaskManager from 'expo-task-manager';
import * as BackgroundFetch from 'expo-background-fetch';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getDb } from '../database/db';

const BACKGROUND_NOTIFICATION_TASK = 'BACKGROUND_NOTIFICATION_TASK';

// Configurar cómo se comportan las notificaciones cuando la app está en primer plano
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

// Función para pedir permisos
export async function setupNotifications() {
  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    
    if (finalStatus !== 'granted') {
      console.warn('Los permisos de notificación no fueron concedidos.');
      return;
    }

    console.log('✅ Permisos de notificación configurados.');
    
    // Registrar la tarea en segundo plano (cada ~15 minutos mínimo)
    await BackgroundFetch.registerTaskAsync(BACKGROUND_NOTIFICATION_TASK, {
      minimumInterval: 15 * 60, // 15 minutos en segundos
      stopOnTerminate: false, 
      startOnBoot: true,      
    });
    console.log('✅ Background Fetch para Notificaciones Registrado');
  } catch (error) {
    console.error('❌ Error en setupNotifications:', error);
  }
}

// Función auxiliar para enviar notificación local inmediata
export async function sendLocalNotification(title, body, data = {}) {
  await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      sound: true,
      data,
    },
    trigger: null, // dispara inmediatamente
  });
}

// Helper de fechas
const formatDate = (d) => d.toISOString().split('T')[0];

// Definición de la lógica del Background Fetch
TaskManager.defineTask(BACKGROUND_NOTIFICATION_TASK, async () => {
  try {
    console.log('[ BACKGROUND FETCH ] Iniciando verificación de eventos...');
    const db = await getDb();
    const now = new Date();
    const todayStr = formatDate(now);
    
    const tomorrow = new Date();
    tomorrow.setDate(now.getDate() + 1);
    const tomorrowStr = formatDate(tomorrow);

    // 1. Agenda de Cobros de Hoy
    const agendaKey = `agenda_${todayStr}`;
    const agendaNotified = await AsyncStorage.getItem(agendaKey);
    if (!agendaNotified) {
      const agenda = await db.getAllAsync(
        `SELECT SUM(scheduled_amount - amount_paid) as total 
         FROM loan_installments 
         WHERE due_date LIKE ? AND status IN ('pending', 'partial')`,
        [`${todayStr}%`]
      );
      if (agenda[0]?.total > 0) {
        await sendLocalNotification(
          "📅 Agenda de Cobros de Hoy",
          `Tienes cuotas programadas por cobrar hoy por un total aproximado de $${agenda[0].total.toLocaleString()}`
        );
      }
      await AsyncStorage.setItem(agendaKey, 'true');
    }

    // 2. Corte del Día (A partir de las 8:30 PM)
    if (now.getHours() >= 20 || (now.getHours() === 20 && now.getMinutes() >= 30)) {
      const corteKey = `corte_${todayStr}`;
      const corteNotified = await AsyncStorage.getItem(corteKey);
      if (!corteNotified) {
        const corte = await db.getAllAsync(
          `SELECT SUM(amount) as total FROM payments WHERE created_at LIKE ?`,
          [`${todayStr}%`]
        );
        const total = corte[0]?.total || 0;
        await sendLocalNotification(
          "🧾 Corte del Día",
          `Hoy registraste cobros por un total de $${total.toLocaleString()}. ¡Buen trabajo!`
        );
        await AsyncStorage.setItem(corteKey, 'true');
      }
    }

    // 3. Cumpleaños de hoy
    const bdayKey = `bday_${todayStr}`;
    const bdayNotified = await AsyncStorage.getItem(bdayKey);
    if (!bdayNotified) {
      // Comparar el -MM-DD
      const mmdd = todayStr.substring(4); 
      const cumpleaneros = await db.getAllAsync(
        `SELECT first_name, last_name FROM clients WHERE birth_date LIKE ?`,
        [`%${mmdd}%`]
      );
      if (cumpleaneros.length > 0) {
        const nombres = cumpleaneros.map(c => `${c.first_name} ${c.last_name}`).join(', ');
        await sendLocalNotification(
          "🎂 ¡Cumpleaños de Cliente!",
          `Hoy celebran su cumpleaños: ${nombres}. ¡Envíales una felicitación!`
        );
      }
      await AsyncStorage.setItem(bdayKey, 'true');
    }

    // 4. Recordatorios Preventivos (Vencen mañana)
    const prevKey = `prev_${tomorrowStr}`;
    const prevNotified = await AsyncStorage.getItem(prevKey);
    if (!prevNotified) {
      const prev = await db.getAllAsync(
        `SELECT COUNT(id) as count, SUM(scheduled_amount - amount_paid) as total 
         FROM loan_installments 
         WHERE due_date LIKE ? AND status IN ('pending', 'partial')`,
        [`${tomorrowStr}%`]
      );
      if (prev[0]?.count > 0) {
        await sendLocalNotification(
          "⏳ Recordatorio Preventivo",
          `Mañana vencen ${prev[0].count} cuota(s) por un valor de $${prev[0].total.toLocaleString()}.`
        );
      }
      await AsyncStorage.setItem(prevKey, 'true');
    }

    // 5. Análisis Individuos - Mora Leve y Renovación
    const pendingInstallments = await db.getAllAsync(`
      SELECT li.id as installment_id, li.due_date, l.grace_days, 
             c.first_name, c.last_name, 
             (li.scheduled_amount - li.amount_paid) as debt
      FROM loan_installments li
      JOIN loans l ON li.loan_id = l.id
      JOIN clients c ON l.client_id = c.id
      WHERE li.status IN ('pending', 'partial')
    `);

    for (const inst of pendingInstallments) {
      const d = new Date(inst.due_date);
      // Sumar días de gracia a la fecha de vencimiento
      d.setDate(d.getDate() + (inst.grace_days || 0));
      const limitStr = formatDate(d);

      if (limitStr < todayStr) {
        // Superó días de gracia y no ha pagado -> MORA
        const moraKey = `mora_inst_${inst.installment_id}_notified`;
        const moraNotified = await AsyncStorage.getItem(moraKey);
        
        if (!moraNotified) {
          await sendLocalNotification(
            "⚠️ ¡Cliente en Mora!",
            `La cuota de ${inst.first_name} ${inst.last_name} ha vencido el período de gracia. Pendiente por cobrar: $${inst.debt.toLocaleString()}`
          );
          await AsyncStorage.setItem(moraKey, 'true');
        }
      }
    }

    // 6. Renovaciones Préstamos Liquidados Hoy (estado paid)
    const renovadasKey = `renovadas_${todayStr}`;
    const renovadasNotified = await AsyncStorage.getItem(renovadasKey);
    if (!renovadasNotified) {
        // En tu db.js, closed_at es TEXT. Asumimos tiene fecha hoy
        const loansClosedToday = await db.getAllAsync(`
          SELECT c.first_name, c.last_name
          FROM loans l
          JOIN clients c ON l.client_id = c.id
          WHERE l.status = 'paid' AND l.closed_at LIKE ?
        `, [`${todayStr}%`]);

        if (loansClosedToday.length > 0) {
           const names = loansClosedToday.map((c) => c.first_name).join(', ');
           await sendLocalNotification(
             "✅ Préstamos Liquidados",
             `${names} han liquidado sus préstamos hoy. ¡Ofréceles una renovación u otro producto!`
           );
        }
        await AsyncStorage.setItem(renovadasKey, 'true');
    }

    console.log('[ BACKGROUND FETCH ] Iteración exitosa.');
    return BackgroundFetch.BackgroundFetchResult.NewData;
  } catch (error) {
    console.error('[ BACKGROUND FETCH ERROR ]:', error);
    return BackgroundFetch.BackgroundFetchResult.Failed;
  }
});

// Función para obtener las alertas a mostrar en la interfaz de usuario (la campana de notificaciones)
export async function getPendingNotificationsUI() {
  const db = await getDb();
  const notifications = [];
  let idCounter = 1;
  const now = new Date();
  const todayStr = formatDate(now);
  
  const tomorrow = new Date();
  tomorrow.setDate(now.getDate() + 1);
  const tomorrowStr = formatDate(tomorrow);

  // 1. Mora Leve (vencidos superando gracia)
  const pendingInstallments = await db.getAllAsync(`
    SELECT li.id as installment_id, li.due_date, l.grace_days, 
           c.first_name, c.last_name, 
           (li.scheduled_amount - li.amount_paid) as debt
    FROM loan_installments li
    JOIN loans l ON li.loan_id = l.id
    JOIN clients c ON l.client_id = c.id
    WHERE li.status IN ('pending', 'partial')
  `);

  pendingInstallments.forEach((inst) => {
    const d = new Date(inst.due_date);
    d.setDate(d.getDate() + (inst.grace_days || 0));
    const limitStr = formatDate(d);

    if (limitStr < todayStr) {
      // En Mora
      notifications.push({
        id: `uimora_${idCounter++}`,
        type: "client-late",
        title: "Cliente en mora",
        clientName: `${inst.first_name} ${inst.last_name} ($ ${inst.debt})`,
        icon: "person",
        iconBg: "#EF4444",
      });
    } else if (inst.due_date === todayStr) {
      // Vence Hoy
      notifications.push({
        id: `uidue_${idCounter++}`,
        type: "client-entry",
        title: "Cobrar hoy",
        clientName: `${inst.first_name} ${inst.last_name}`,
        icon: "person-add",
        iconBg: "#F59E0B",
      });
    } else if (inst.due_date === tomorrowStr) {
      // Vence Mañana
      notifications.push({
        id: `uiprev_${idCounter++}`,
        type: "payment-reminder",
        title: "Recordatorio: Cobro mañana",
        clientName: `${inst.first_name} ${inst.last_name}`,
        icon: "notifications",
        iconBg: "#0D8A7A", // Usa tu teal
      });
    }
  });

  return notifications;
}
