  // src/types/index.ts
  export interface DentalRecord {
    id: string;
    nombreDoctor: string;
    nombrePaciente: string;
    docId: string;
    servicio: string;
    abono: number | null;
    descuento: number | null;
    valor_total: number | null;
    fecha: string;
    fechaFinal: string | null;
    metodoPago: string | null;
    metodoPagoAbono: string | null;
    idPorc: number;
    valor_liquidado: number;
    id_cuenta: number | null;
    id_cuenta_abono: number | null;
    esPacientePropio: boolean;
    sesiones: number; // Nuevo campo para el número total de sesiones
  }
  
  export interface Liquidacion {
    doctor: string;
    fechaInicio: string;
    fechaFin: string;
    servicios: DentalRecord[][]; // Array de arrays para reflejar los grupos de servicios
    totalLiquidado: number;
    fechaLiquidacion: string;
  }