import * as Notifications from 'expo-notifications';
import * as TaskManager from 'expo-task-manager';
import * as BackgroundFetch from 'expo-background-fetch';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getDb, initializeDatabase } from '../database/db';
import { router } from 'expo-router';

const BACKGROUND_NOTIFICATION_TASK = 'BACKGROUND_NOTIFICATION_TASK';

// Configurar comportamiento de notificaciones en primer plano
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

// Listener para interacciones (Deep Linking)
Notifications.addNotificationResponseReceivedListener(response => {
  const data = response.notification.request.content.data;
  console.log('🔔 Interacción con notificación:', data);
  
  if (data?.screen) {
    // Pequeño delay para asegurar que el sistema de navegación esté listo
    setTimeout(() => {
      try {
        router.push({
          pathname: data.screen,
          params: data.params || {}
        });
      } catch (err) {
        console.error('Error al navegar desde notificación:', err);
      }
    }, 500);
  }
});

/**
 * Inicializa permisos y registra la tarea de fondo
 */
export async function setupNotifications() {
  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    
    if (finalStatus !== 'granted') {
      console.warn('Permisos de notificación denegados.');
      return;
    }

    // Registrar tarea de fondo (mínimo cada 15 min)
    await BackgroundFetch.registerTaskAsync(BACKGROUND_NOTIFICATION_TASK, {
      minimumInterval: 15 * 60,
      stopOnTerminate: false, 
      startOnBoot: true,      
    });
    console.log('✅ Sistema de notificaciones e interacción configurado');
  } catch (error) {
    console.error('Error en setupNotifications:', error);
  }
}

/**
 * Guarda una notificación en la base de datos
 */
export async function saveNotificationToDb({ userId, type, title, body, data = {} }) {
  try {
    const db = await getDb();
    const createdAt = new Date().toISOString();
    const dataStr = JSON.stringify(data);

    // Guardar como no leída (is_read=0) y no descartada (is_dismissed=0)
    await db.runAsync(
      `INSERT INTO notifications (user_id, type, title, body, data, created_at, is_read, is_dismissed) 
       VALUES (?, ?, ?, ?, ?, ?, 0, 0)`,
      [userId, type, title, body, dataStr, createdAt]
    );
    return true;
  } catch (error) {
    console.error('Error guardando notificación en DB:', error);
    return false;
  }
}

/**
 * Envía una notificación (local al sistema y/o interna en la app)
 */
export async function sendLocalNotification(title, body, data = {}, userId = null, type = 'general', silent = false) {
  // 1. Notificación NATIVA (Banner/Sonido en el teléfono)
  if (!silent) {
    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        sound: true,
        data,
      },
      trigger: null,
    });
  }

  // 2. Notificación INTERNA (Base de datos para la Campana)
  if (userId) {
    await saveNotificationToDb({ userId, type, title, body, data });
  }
}

/**
 * Obtiene notificaciones para la UI (Campana)
 */
export async function getPendingNotificationsUI(userId) {
  if (!userId) return [];
  
  try {
    const db = await getDb();
    const rows = await db.getAllAsync(
      `SELECT * FROM notifications 
       WHERE user_id = ? AND is_dismissed = 0 
       ORDER BY created_at DESC 
       LIMIT 50`,
      [userId]
    );

    return rows.map(row => ({
      id: row.id.toString(),
      type: row.type,
      title: row.title,
      body: row.body,
      data: JSON.parse(row.data || '{}'),
      isRead: row.is_read === 1,
      createdAt: row.created_at,
      icon: getIconForType(row.type),
      iconBg: getBgForType(row.type),
    }));
  } catch (error) {
    console.error('Error obteniendo notificaciones UI:', error);
    return [];
  }
}

/**
 * Marca una notificación como descartada
 */
export async function dismissNotification(id) {
  try {
    const db = await getDb();
    await db.runAsync(`UPDATE notifications SET is_dismissed = 1 WHERE id = ?`, [id]);
    return true;
  } catch (error) {
    console.error('Error descartando notificación:', error);
    return false;
  }
}

// Helpers de diseño
function getIconForType(type) {
  switch (type) {
    case 'mora': return 'alert-circle';
    case 'cobro_hoy': return 'calendar';
    case 'recaudo': return 'cash';
    case 'cumple': return 'gift';
    case 'success': return 'checkmark-circle';
    default: return 'notifications';
  }
}

function getBgForType(type) {
  switch (type) {
    case 'mora': return '#EF4444'; 
    case 'cobro_hoy': return '#F59E0B'; 
    case 'recaudo': return '#10B981'; 
    case 'cumple': return '#EC4899'; 
    case 'success': return '#3B82F6'; 
    default: return '#6B7280'; 
  }
}

const formatDate = (d) => d.toISOString().split('T')[0];

// Tarea de fondo
TaskManager.defineTask(BACKGROUND_NOTIFICATION_TASK, async () => {
  try {
    // Asegurar que la DB esté lista antes de operar en segundo plano
    await initializeDatabase();
    
    const db = await getDb();
    
    // Intentar obtener el usuario actual desde el almacenamiento
    const { getItemAsync } = await import('./storage.service');
    const storedUserId = await getItemAsync('user_id');
    
    let userId;
    if (storedUserId) {
      userId = parseInt(storedUserId);
    } else {
      // Fallback: tomar el primero si no hay sesión activa (no ideal pero mejor que nada)
      const user = await db.getFirstAsync('SELECT id FROM users LIMIT 1');
      if (!user) return BackgroundFetch.BackgroundFetchResult.NoData;
      userId = user.id;
    }

    const todayStr = formatDate(new Date());

    // 1. Cobros de Hoy
    const agendaKey = `agenda_${todayStr}`;
    if (!(await AsyncStorage.getItem(agendaKey))) {
      const agenda = await db.getAllAsync(
        `SELECT SUM(scheduled_amount - amount_paid) as total FROM loan_installments 
         WHERE due_date LIKE ? AND status IN ('pending', 'partial')`,
        [`${todayStr}%`]
      );
      if (agenda[0]?.total > 0) {
        await sendLocalNotification(
          "📅 Agenda de Cobros de Hoy",
          `Tienes cobros programados por $${agenda[0].total.toLocaleString()}`,
          { screen: '/prestamos_abonos' },
          userId,
          'cobro_hoy'
        );
      }
      await AsyncStorage.setItem(agendaKey, 'true');
    }

    // 2. Mora
    const pendingInstallments = await db.getAllAsync(`
      SELECT li.id as installment_id, li.due_date, l.grace_days, c.first_name, c.last_name, 
             (li.scheduled_amount - li.amount_paid) as debt, l.id as loan_id
      FROM loan_installments li
      JOIN loans l ON li.loan_id = l.id
      JOIN clients c ON l.client_id = c.id
      WHERE li.status IN ('pending', 'partial')
    `);

    for (const inst of pendingInstallments) {
      const d = new Date(inst.due_date);
      d.setDate(d.getDate() + (inst.grace_days || 0));
      if (formatDate(d) < todayStr) {
        const moraKey = `mora_inst_${inst.installment_id}`;
        if (!(await AsyncStorage.getItem(moraKey))) {
          await sendLocalNotification(
            "⚠️ ¡Cliente en Mora!",
            `${inst.first_name} ${inst.last_name} tiene un atraso. Pendiente: $${inst.debt.toLocaleString()}`,
            { screen: '/prestamos_abonos', loanId: inst.loan_id },
            userId,
            'mora'
          );
          await AsyncStorage.setItem(moraKey, 'true');
        }
      }
    }

    return BackgroundFetch.BackgroundFetchResult.NewData;
  } catch (error) {
    console.error('Error en Background Task:', error);
    return BackgroundFetch.BackgroundFetchResult.Failed;
  }
});
