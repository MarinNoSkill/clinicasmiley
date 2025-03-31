// src/types/index.ts
export interface DentalRecord {
  id: string;
  nombreDoctor: string; // nombre_doc
  nombrePaciente: string; // paciente
  docId: string; // doc_id (documento del paciente)
  servicio: string; // nombre_serv
  abono: number | null; // abono (puede ser null si no hay abono)
  descuento: number | null; // dcto (puede ser null si no hay descuento)
  total: number; // valor_total
  fecha: string; // fecha_inicio
  metodoPago: string; // metodo_pago
  idPorc: number; // id_porc (obligatorio, se asignará según el porcentaje)
  fechaFinal?: string; // fecha_final (opcional, no se usará en el formulario)
}

export interface Liquidacion {
  doctor: string;
  fechaInicio: string;
  fechaFin: string;
  servicios: DentalRecord[];
  totalLiquidado: number;
  fechaLiquidacion: string;
}