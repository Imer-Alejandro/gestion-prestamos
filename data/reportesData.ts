export interface EstadisticaMensual {
  mes: string;
  valor: number;
}

export interface Operacion {
  id: string;
  tipo: "prestamo" | "abono" | "ganancia";
  monto: number;
  descripcion: string;
  fecha: string;
}

export interface ComparacionPeriodo {
  periodo: string;
  gananciaNeta: number;
  gananciaPorMora: number;
  totalGanancias: number;
}

export const mockEstadisticasPrestamos: EstadisticaMensual[] = [
  { mes: "Ene", valor: 85000 },
  { mes: "Feb", valor: 65000 },
  { mes: "Mar", valor: 95000 },
  { mes: "Abr", valor: 120000 },
  { mes: "May", valor: 75000 },
  { mes: "Jun", valor: 110000 },
  { mes: "Jul", valor: 90000 },
  { mes: "Ago", valor: 105000 },
];

export const mockHistorialOperaciones: Operacion[] = [
  {
    id: "1",
    tipo: "abono",
    monto: 17500.0,
    descripcion: "nombre cliente",
    fecha: "28/02/2025",
  },
  {
    id: "2",
    tipo: "abono",
    monto: 17500.0,
    descripcion: "nombre cliente",
    fecha: "28/02/2025",
  },
  {
    id: "3",
    tipo: "abono",
    monto: 17500.0,
    descripcion: "nombre cliente",
    fecha: "28/02/2025",
  },
  {
    id: "4",
    tipo: "abono",
    monto: 17500.0,
    descripcion: "nombre cliente",
    fecha: "28/02/2025",
  },
];

export const mockComparacionPeriodos: ComparacionPeriodo[] = [
  {
    periodo: "Enero - 2025",
    gananciaNeta: 75,
    gananciaPorMora: 25,
    totalGanancias: 100,
  },
  {
    periodo: "Febrero - 2025",
    gananciaNeta: 80,
    gananciaPorMora: 20,
    totalGanancias: 100,
  },
];

export const mockEstadisticasGanancias: EstadisticaMensual[] = [
  { mes: "Ene", valor: 45000 },
  { mes: "Feb", valor: 35000 },
  { mes: "Mar", valor: 55000 },
  { mes: "Abr", valor: 65000 },
  { mes: "May", valor: 40000 },
  { mes: "Jun", valor: 60000 },
  { mes: "Jul", valor: 50000 },
  { mes: "Ago", valor: 58000 },
];

export const formatCurrencyReportes = (amount: number): string => {
  return new Intl.NumberFormat("es-CO", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
};
