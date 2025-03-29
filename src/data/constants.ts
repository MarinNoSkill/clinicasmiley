// src/data/constants.ts
export const DOCTORES = ['Dra. Ana', 'Dr. Luis', 'Dra. María'];
export const ASISTENTES = ['Asistente Clara', 'Asistente Juan', 'Asistente Sofía'];
export const METODOS_PAGO = ['Efectivo', 'Transferencia', 'Tarjeta'];

// Lista ampliada de servicios con precios estimados en COP
export const SERVICIOS = [
  { nombre: 'Limpieza', precio: 80000 },
  { nombre: 'Relleno', precio: 120000 },
  { nombre: 'Prótesis (por unidad)', precio: 1500000 },
  { nombre: 'Extracción', precio: 100000 },
  { nombre: 'Blanqueamiento', precio: 500000 },
  { nombre: 'Ortodoncia (tratamiento completo)', precio: 5000000 },
  { nombre: 'Endodoncia (tratamiento de conductos)', precio: 600000 },
  { nombre: 'Implante dental', precio: 3000000 },
  { nombre: 'Carilla dental (por diente)', precio: 800000 },
  { nombre: 'Consulta general', precio: 50000 },
];

export const formatCOP = (amount: number) => {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};