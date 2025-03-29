// src/types/index.ts
export interface DentalRecord {
  id: string;
  nombreDoctor: string; // Nombre del doctor/a
  nombreAsistente: string; // Nombre del asistente
  nombrePaciente: string; // Nombre del paciente
  servicio: string; // Servicio realizado
  sesionesParaCompletar: number; // Total de sesiones necesarias para completar el servicio
  sesionesCompletadas: number; // Sesiones completadas hasta ahora
  abono: number; // Abono por sesión
  descuento: number; // Descuento (si aplica)
  total: number; // Total (abono - descuento) por sesión
  esPacientePropio: boolean; // Si es paciente propio del doctor o del dueño
  fecha: string; // Fecha del registro
  metodoPago: string; // Método de pago
}

export interface Liquidacion {
  nombreDoctor: string;
  servicios: DentalRecord[];
  porcentaje: number; // Porcentaje aplicado (50% o 40%)
  totalALiquidar: number; // Total a liquidar
}