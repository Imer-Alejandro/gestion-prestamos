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
  frecuenciaPago: string;
  fechaVencimiento: string;
}


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
