export interface Prestamo {
  id: string;
  clienteId: string;
  clienteNombre: string;
  clienteIniciales: string;
  totalPrestamo: number;
  totalAbonado: number;
  deudaPendiente: number;
  deudaPendientePorcentaje: number;
  cuotas: number;
  estado: "activo" | "completado" | "mora";
  fechaCreacion: string;
}

export const mockPrestamosActivos: Prestamo[] = [
  {
    id: "1",
    clienteId: "c1",
    clienteNombre: "Nombre del cliente",
    clienteIniciales: "NC",
    totalPrestamo: 17500.0,
    totalAbonado: 17500.0,
    deudaPendiente: 11500.0,
    deudaPendientePorcentaje: 0.003,
    cuotas: 10,
    estado: "activo",
    fechaCreacion: "2025-01-15",
  },
  {
    id: "2",
    clienteId: "c2",
    clienteNombre: "María González",
    clienteIniciales: "MG",
    totalPrestamo: 17500.0,
    totalAbonado: 17500.0,
    deudaPendiente: 11500.0,
    deudaPendientePorcentaje: 0.003,
    cuotas: 10,
    estado: "activo",
    fechaCreacion: "2025-01-10",
  },
  {
    id: "3",
    clienteId: "c3",
    clienteNombre: "Carlos Pérez",
    clienteIniciales: "CP",
    totalPrestamo: 17500.0,
    totalAbonado: 17500.0,
    deudaPendiente: 11500.0,
    deudaPendientePorcentaje: 0.003,
    cuotas: 10,
    estado: "activo",
    fechaCreacion: "2025-01-08",
  },
];

export const mockAbonos = [
  {
    id: "1",
    monto: 17500.0,
    fechaPago: "18/02/2025",
  },
  {
    id: "2",
    monto: 17500.0,
    fechaPago: "28/02/2025",
  },
  {
    id: "3",
    monto: 17500.0,
    fechaPago: "28/02/2025",
  },
  {
    id: "4",
    monto: 17500.0,
    fechaPago: "28/02/2025",
  },
  {
    id: "5",
    monto: 17500.0,
    fechaPago: "28/02/2025",
  },
];

export const formatCurrencyPrestamos = (amount: number): string => {
  return new Intl.NumberFormat("es-CO", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
};
