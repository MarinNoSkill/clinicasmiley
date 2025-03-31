import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { formatCOP } from '../data/constants';
import * as XLSX from 'xlsx';

interface DentalRecord {
  id: string;
  nombre_doctor: string;
  nombre_asistente: string;
  nombre_paciente: string;
  servicio: string;
  sesiones_para_completar: number;
  sesiones_completadas: number;
  abono: number;
  descuento: number;
  total: number;
  es_paciente_propio: boolean;
  fecha: string;
  metodo_pago: string;
}

interface LiquidacionHistorial {
  id: string;
  doctor: string;
  fecha_inicio: string;
  fecha_fin: string;
  servicios: DentalRecord[][];
  total_liquidado: number;
  fecha_liquidacion: string;
}

const HistorialLiquidaciones: React.FC = () => {
  const [historial, setHistorial] = useState<LiquidacionHistorial[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    const loadHistorial = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/liquidations`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        });
        setHistorial(response.data);
      } catch {
        setError('Error al cargar el historial de liquidaciones. Por favor, intenta de nuevo.');
      } finally {
        setLoading(false);
      }
    };

    loadHistorial();
  }, []);

  const handleDescargarExcel = (liquidacion: LiquidacionHistorial) => {
    const datos = liquidacion.servicios.flatMap((grupo) => {
      const totalGrupo = grupo.reduce((sum, registro) => sum + registro.total, 0);
      const totalSesionesCompletadas = grupo.reduce(
        (sum, registro) => sum + registro.sesiones_completadas,
        0
      );
      const porcentaje = grupo[0].es_paciente_propio ? 50 : 40;
      const totalALiquidar = totalGrupo * (porcentaje / 100);
      const metodosPago = [...new Set(grupo.map((registro) => registro.metodo_pago))].join(', ');

      return {
        Paciente: grupo[0].nombre_paciente,
        Servicio: grupo[0].servicio,
        'Progreso Sesiones': `${totalSesionesCompletadas}/${grupo[0].sesiones_para_completar}`,
        'Total Pagado': totalGrupo,
        'Método de Pago': metodosPago,
        'Tipo de Paciente': grupo[0].es_paciente_propio ? 'Propio (50%)' : 'Clínica (40%)',
        Porcentaje: `${porcentaje}%`,
        'Total a Liquidar': totalALiquidar,
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(datos);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Liquidación');
    XLSX.writeFile(
      workbook,
      `Historial_Liquidacion_${liquidacion.doctor}_${liquidacion.fecha_liquidacion}.xlsx`
    );
  };

  if (loading) {
    return <div className="text-center py-6">Cargando historial...</div>;
  }

  if (error) {
    return <div className="text-center py-6 text-red-500">{error}</div>;
  }

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
                  Fecha de Liquidación: {liquidacion.fecha_liquidacion}
                </p>
                <p className="text-sm text-gray-600">
                  Rango: {liquidacion.fecha_inicio} a {liquidacion.fecha_fin}
                </p>
                <p className="text-sm font-semibold text-blue-800">
                  Total Liquidado: {formatCOP(liquidacion.total_liquidado)}
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
                      (sum, registro) => sum + registro.sesiones_completadas,
                      0
                    );
                    const porcentaje = grupo[0].es_paciente_propio ? 50 : 40;
                    const totalALiquidar = totalGrupo * (porcentaje / 100);
                    const metodosPago = [...new Set(grupo.map((registro) => registro.metodo_pago))].join(', ');

                    return (
                      <tr key={index} className="hover:bg-gray-50 transition-colors duration-150">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {grupo[0].nombre_paciente}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {grupo[0].servicio}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {totalSesionesCompletadas}/{grupo[0].sesiones_para_completar}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatCOP(totalGrupo)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {metodosPago}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {grupo[0].es_paciente_propio ? 'Propio (50%)' : 'Clínica (40%)'}
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