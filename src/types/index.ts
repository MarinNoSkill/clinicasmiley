// src/types/index.ts
export interface DentalRecord {
  id: string;
  nombreDoctor: string;
  nombrePaciente: string;
  docId: string;
  servicio: string;
  abono: number | null;
  descuento: number | null;
  valor_total: number | null; // Permitir null
  fecha: string;
  fechaFinal: string | null;
  metodoPago: string;
  idPorc: number;
  valor_liquidado: number;
  id_cuenta: number | null;
  metodoPagoAbono?: string;
  id_cuenta_abono?: number | null;
}
export interface Liquidacion {
  doctor: string;
  fechaInicio: string;
  fechaFin: string;
  servicios: DentalRecord[];
  totalLiquidado: number;
  fechaLiquidacion: string;
}