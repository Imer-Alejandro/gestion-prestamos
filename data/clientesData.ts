/**
 * Datos mock para la pantalla de Clientes
 */

export interface Cliente {
  id: string;
  nombre: string;
  iniciales: string;
  estado: "en-mora" | "al-dia" | "proximo-mora";
  totalDeudas: number;
  totalAbonado: number;
  deudaPendiente: number;
  telefono?: string;
  direccion?: string;
  fechaRegistro?: string;
}

export interface ResumenDeudas {
  totalPendiente: number;
  cantidadClientesMora: number;
  cantidadClientesProximosMora: number;
}

// Resumen de deudas totales
export const mockResumenDeudas: ResumenDeudas = {
  totalPendiente: 17000000.00,
  cantidadClientesMora: 3,
  cantidadClientesProximosMora: 2,
};

// Clientes en mora
export const mockClientesMora: Cliente[] = [
  {
    id: "1",
    nombre: "Nombre del cliente",
    iniciales: "NC",
    estado: "en-mora",
    totalDeudas: 17500.00,
    totalAbonado: 11500.00,
    deudaPendiente: 6000.00,
    telefono: "809-555-0101",
    direccion: "Calle Principal #123",
    fechaRegistro: "2024-01-15",
  },
  {
    id: "2",
    nombre: "María González",
    iniciales: "MG",
    estado: "en-mora",
    totalDeudas: 25000.00,
    totalAbonado: 15000.00,
    deudaPendiente: 10000.00,
    telefono: "809-555-0102",
    direccion: "Av. Independencia #456",
    fechaRegistro: "2024-02-10",
  },
  {
    id: "3",
    nombre: "Carlos Pérez",
    iniciales: "CP",
    estado: "en-mora",
    totalDeudas: 30000.00,
    totalAbonado: 18000.00,
    deudaPendiente: 12000.00,
    telefono: "809-555-0103",
    direccion: "Calle Duarte #789",
    fechaRegistro: "2024-01-20",
  },
];

// Clientes próximos a mora
export const mockClientesProximosMora: Cliente[] = [
  {
    id: "4",
    nombre: "Nombre del cliente",
    iniciales: "NC",
    estado: "proximo-mora",
    totalDeudas: 17500.00,
    totalAbonado: 11500.00,
    deudaPendiente: 6000.00,
    telefono: "809-555-0104",
    direccion: "Av. 27 de Febrero #321",
    fechaRegistro: "2024-03-05",
  },
  {
    id: "5",
    nombre: "Ana Martínez",
    iniciales: "AM",
    estado: "proximo-mora",
    totalDeudas: 20000.00,
    totalAbonado: 14000.00,
    deudaPendiente: 6000.00,
    telefono: "809-555-0105",
    direccion: "Calle Mella #654",
    fechaRegistro: "2024-03-12",
  },
];

// Todos los clientes
export const mockTodosClientes: Cliente[] = [
  ...mockClientesMora,
  ...mockClientesProximosMora,
  {
    id: "6",
    nombre: "Pedro Rodríguez",
    iniciales: "PR",
    estado: "al-dia",
    totalDeudas: 15000.00,
    totalAbonado: 15000.00,
    deudaPendiente: 0,
    telefono: "809-555-0106",
    direccion: "Av. Churchill #987",
    fechaRegistro: "2024-02-20",
  },
  {
    id: "7",
    nombre: "Laura Sánchez",
    iniciales: "LS",
    estado: "al-dia",
    totalDeudas: 18000.00,
    totalAbonado: 18000.00,
    deudaPendiente: 0,
    telefono: "809-555-0107",
    direccion: "Calle Restauración #147",
    fechaRegistro: "2024-03-01",
  },
];

// Función para formatear números como moneda
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('es-DO', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
};
