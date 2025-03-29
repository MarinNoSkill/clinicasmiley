import React, { useState, useEffect } from 'react';
import { formatCOP } from '../data/constants';
import * as XLSX from 'xlsx';

interface DentalRecord {
  id: string;
  nombreDoctor: string;
  nombreAsistente: string;
  nombrePaciente: string;
  servicio: string;
  sesionesParaCompletar: number;
  sesionesCompletadas: number;
  abono: number;
  descuento: number;
  total: number;
  esPacientePropio: boolean;
  fecha: string;
  metodoPago: string;
}

interface LiquidacionHistorial {
  id: string;
  doctor: string;
  fechaInicio: string;
  fechaFin: string;
  servicios: DentalRecord[][];
  totalLiquidado: number;
  fechaLiquidacion: string;
}

const HistorialLiquidaciones: React.FC = () => {
  const [historial, setHistorial] = useState<LiquidacionHistorial[]>([]);

  useEffect(() => {
    const historialGuardado = JSON.parse(localStorage.getItem('historialLiquidaciones') || '[]');
    setHistorial(historialGuardado);
  }, []);

  const handleDescargarExcel = (liquidacion: LiquidacionHistorial) => {
    const datos = liquidacion.servicios.flatMap((grupo) => {
      const totalGrupo = grupo.reduce((sum, registro) => sum + registro.total, 0);
      const totalSesionesCompletadas = grupo.reduce(
        (sum, registro) => sum + registro.sesionesCompletadas,
        0
      );
      const porcentaje = grupo[0].esPacientePropio ? 50 : 40;
      const totalALiquidar = totalGrupo * (porcentaje / 100);
      const metodosPago = [...new Set(grupo.map((registro) => registro.metodoPago))].join(', ');

      return {
        Paciente: grupo[0].nombrePaciente,
        Servicio: grupo[0].servicio,
        'Progreso Sesiones': `${totalSesionesCompletadas}/${grupo[0].sesionesParaCompletar}`,
        'Total Pagado': totalGrupo,
        'Método de Pago': metodosPago,
        'Tipo de Paciente': grupo[0].esPacientePropio ? 'Propio (50%)' : 'Clínica (40%)',
        Porcentaje: `${porcentaje}%`,
        'Total a Liquidar': totalALiquidar,
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(datos);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Liquidación');
    XLSX.writeFile(
      workbook,
      `Historial_Liquidacion_${liquidacion.doctor}_${liquidacion.fechaLiquidacion}.xlsx`
    );
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <h2 className="text-3xl font-bold text-gray-800 mb-8">Historial de Liquidaciones - Clínica Smiley</h2>

      {historial.length === 0 ? (
        <p className="text-gray-600 text-center">No hay liquidaciones registradas en el historial.</p>
      ) : (
        historial.map((liquidacion) => (
          <div key={liquidacion.id} className="bg-white shadow-lg rounded-lg p-6 mb-8">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h3 className="text-xl font-semibold text-gray-800">
                  Liquidación - {liquidacion.doctor}
                </h3>
                <p className="text-sm text-gray-600">
                  Fecha de Liquidación: {liquidacion.fechaLiquidacion}
                </p>
                <p className="text-sm text-gray-600">
                  Rango: {liquidacion.fechaInicio} a {liquidacion.fechaFin}
                </p>
                <p className="text-sm font-semibold text-blue-800">
                  Total Liquidado: {formatCOP(liquidacion.totalLiquidado)}
                </p>
              </div>
              <button
                onClick={() => handleDescargarExcel(liquidacion)}
                className="px-4 py-2 rounded-md text-white font-medium bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors duration-200"
              >
                Descargar en Excel
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                      Paciente
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                      Servicio
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                      Progreso Sesiones
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                      Total Pagado
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                      Método de Pago
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                      Tipo de Paciente
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                      Porcentaje
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                      Total a Liquidar
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {liquidacion.servicios.map((grupo, index) => {
                    const totalGrupo = grupo.reduce((sum, registro) => sum + registro.total, 0);
                    const totalSesionesCompletadas = grupo.reduce(
                      (sum, registro) => sum + registro.sesionesCompletadas,
                      0
                    );
                    const porcentaje = grupo[0].esPacientePropio ? 50 : 40;
                    const totalALiquidar = totalGrupo * (porcentaje / 100);
                    const metodosPago = [...new Set(grupo.map((registro) => registro.metodoPago))].join(', ');

                    return (
                      <tr key={index} className="hover:bg-gray-50 transition-colors duration-150">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {grupo[0].nombrePaciente}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {grupo[0].servicio}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {totalSesionesCompletadas}/{grupo[0].sesionesParaCompletar}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatCOP(totalGrupo)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {metodosPago}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {grupo[0].esPacientePropio ? 'Propio (50%)' : 'Clínica (40%)'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {porcentaje}%
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-green-600">
                          {formatCOP(totalALiquidar)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ))
      )}
    </div>
  );
};

export default HistorialLiquidaciones;