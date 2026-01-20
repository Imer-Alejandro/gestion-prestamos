/**
 * Datos de ejemplo para la pantalla Home
 * En producción, estos datos vendrían del backend
 */

export interface Operation {
  id: string;
  amount: string;
  clientName: string;
  time: string;
  type: "prestamo" | "abono";
}

export interface Notification {
  id: string;
  type: "client-late" | "client-entry" | "payment-reminder";
  title: string;
  clientName: string;
  icon: "person" | "person-add" | "notifications";
  iconBg: string;
}

export interface UserData {
  name: string;
  role: string;
}

// Datos del usuario actual
export const mockUserData: UserData = {
  name: "Imer Alejandro",
  role: "Gestor operador",
};

// Notificaciones de ejemplo
export const mockNotifications: Notification[] = [
  {
    id: "1",
    type: "client-late",
    title: "El cliente entro en mora",
    clientName: "Nombre del cliente",
    icon: "person",
    iconBg: "#EF4444",
  },
  {
    id: "2",
    type: "client-entry",
    title: "El esta por entrar en mora",
    clientName: "Nombre del cliente",
    icon: "person-add",
    iconBg: "#F59E0B",
  },
  {
    id: "3",
    type: "payment-reminder",
    title: "Recordatorio de cobro de prestamos",
    clientName: "",
    icon: "notifications",
    iconBg: "#0D8A7A",
  },
  {
    id: "4",
    type: "client-late",
    title: "El cliente entro en mora",
    clientName: "Nombre del cliente",
    icon: "person",
    iconBg: "#EF4444",
  },
  {
    id: "5",
    type: "client-entry",
    title: "El esta por entrar en mora",
    clientName: "Nombre del cliente",
    icon: "person-add",
    iconBg: "#F59E0B",
  },
  {
    id: "6",
    type: "payment-reminder",
    title: "Recordatorio de cobro de prestamos",
    clientName: "",
    icon: "notifications",
    iconBg: "#0D8A7A",
  },
];

// Operaciones de ejemplo
export const mockOperations: Operation[] = [
  {
    id: "1",
    amount: "1,350.80",
    clientName: "Nombre del cliente",
    time: "3:00 am",
    type: "prestamo",
  },
  {
    id: "2",
    amount: "1,350.80",
    clientName: "Nombre del cliente",
    time: "3:00 am",
    type: "abono",
  },
  {
    id: "3",
    amount: "1,350.80",
    clientName: "Nombre del cliente",
    time: "3:00 am",
    type: "prestamo",
  },
  {
    id: "4",
    amount: "1,350.80",
    clientName: "Nombre del cliente",
    time: "3:00 am",
    type: "abono",
  },
];

// Totales del día
export interface DailyTotals {
  loans: string;
  payments: string;
}

export const mockDailyTotals: DailyTotals = {
  loans: "5,700.00",
  payments: "5,700.00",
};
