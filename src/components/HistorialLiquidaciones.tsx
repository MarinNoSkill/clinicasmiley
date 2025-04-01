import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { formatCOP } from '../data/constants';
import * as XLSX from 'xlsx';

interface DentalRecord {
  paciente: string;
  nombre_doc: string;
  nombre_serv: string;
  nombre_aux: string | null;
  abono: number;
  id_porc: number;
  porcentaje: number | null;
  id_metodo: number | null;
  metodoPago: string | null;
  id_metodo_abono: number | null;
  metodoPagoAbono: string | null;
  dcto: number;
  valor_total: number;
  es_paciente_propio: boolean;
  id_cuenta: number | null;
  id_cuenta_abono: number | null;
  valor_pagado: number;
}

interface LiquidacionHistorial {
  id: string;
  doctor: string;
  fecha_inicio: string;
  fecha_final: string;
  fecha_liquidacion: string; // Agregamos fecha_liquidacion
  servicios: DentalRecord[];
  total_liquidado: number;
}

const HistorialLiquidaciones: React.FC = () => {
  const [historial, setHistorial] = useState<LiquidacionHistorial[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [selectedGroups, setSelectedGroups] = useState<string[]>([]); // Para almacenar los IDs de los grupos seleccionados

  const navigate = useNavigate();
  const idSede = localStorage.getItem('selectedSede');

  useEffect(() => {
    const loadHistorial = async () => {
      try {
        if (!idSede) {
          throw new Error('No se ha seleccionado una sede');
        }

        setLoading(true);
        console.log('Haciendo solicitud a /api/liquidations con id_sede:', idSede);
        const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/liquidations`, {
          params: { id_sede: idSede },
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
            'Cache-Control': 'no-cache',
          },
        });
        console.log('Liquidaciones obtenidas:', response.data);
        setHistorial(response.data);
      } catch (err: any) {
        console.error('Error al cargar el historial de liquidaciones:', err);
        if (err.response?.status === 401) {
          setError('Sesión expirada. Por favor, inicia sesión nuevamente.');
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          localStorage.removeItem('selectedSede');
          navigate('/login');
        } else {
          setError('Error al cargar el historial de liquidaciones. Por favor, intenta de nuevo.');
        }
      } finally {
        setLoading(false);
      }
    };

    loadHistorial();
  }, [navigate, idSede]);

  const handleSelectGroup = (groupId: string) => {
    setSelectedGroups((prev) =>
      prev.includes(groupId)
        ? prev.filter((id) => id !== groupId)
        : [...prev, groupId]
    );
  };

  const handleDeleteSelected = async () => {
    try {
      if (selectedGroups.length === 0) {
        setError('Por favor, selecciona al menos un grupo para eliminar.');
        return;
      }

      const groupsToDelete = historial
        .filter((liquidacion) => selectedGroups.includes(liquidacion.id))
        .map((liquidacion) => ({
          doctor: liquidacion.doctor,
          fecha_inicio: liquidacion.fecha_inicio,
          fecha_final: liquidacion.fecha_final,
          fecha_liquidacion: liquidacion.fecha_liquidacion,
        }));

      console.log('Enviando solicitud para eliminar grupos:', groupsToDelete);

      await axios.delete(`${import.meta.env.VITE_API_URL}/api/liquidations`, {
        data: { groups: groupsToDelete },
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
      });

      // Actualizar el estado eliminando los grupos seleccionados
      setHistorial((prev) => prev.filter((liquidacion) => !selectedGroups.includes(liquidacion.id)));
      setSelectedGroups([]); // Limpiar la selección
      setError(''); // Limpiar cualquier error previo
    } catch (err: any) {
      console.error('Error al eliminar las liquidaciones:', err);
      setError('Error al eliminar las liquidaciones. Por favor, intenta de nuevo.');
    }
  };

  const handleDescargarExcel = (liquidacion: LiquidacionHistorial) => {
    const datos = liquidacion.servicios.map((registro) => ({
      Paciente: registro.paciente,
      Servicio: registro.nombre_serv,
      Doctor: registro.nombre_doc || 'N/A',
      Asistente: registro.nombre_aux || 'N/A',
      Abono: formatCOP(registro.abono), // Formateamos para el Excel
      Descuento: formatCOP(registro.dcto),
      'Valor Total': formatCOP(registro.valor_total),
      'Es Paciente Propio': registro.es_paciente_propio ? 'Sí' : 'No',
      Porcentaje: registro.porcentaje ? `${registro.porcentaje}%` : 'N/A',
      'Método de Pago': registro.metodoPago || 'N/A',
      'Método de Pago Abono': registro.metodoPagoAbono || 'N/A',
      'Valor Pagado': formatCOP(registro.valor_pagado),
    }));

    const worksheet = XLSX.utils.json_to_sheet(datos);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Liquidación');
    XLSX.writeFile(
      workbook,
      `Historial_Liquidacion_${liquidacion.doctor}_${liquidacion.fecha_inicio}.xlsx`
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

      {selectedGroups.length > 0 && (
        <div className="mb-4">
          <button
            onClick={handleDeleteSelected}
            className="px-4 py-2 rounded-md text-white font-medium bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors duration-200"
          >
            Eliminar {selectedGroups.length} grupo(s) seleccionado(s)
          </button>
        </div>
      )}

      {historial.length === 0 ? (
        <p className="text-gray-600 text-center">No hay liquidaciones registradas en el historial.</p>
      ) : (
        historial.map((liquidacion) => (
          <div key={liquidacion.id} className="bg-white shadow-lg rounded-lg p-6 mb-8">
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  checked={selectedGroups.includes(liquidacion.id)}
                  onChange={() => handleSelectGroup(liquidacion.id)}
                  className="mr-3 h-5 w-5 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <div>
                  <h3 className="text-xl font-semibold text-gray-800">
                    Liquidación - {liquidacion.doctor}
                  </h3>
                  <p className="text-sm text-gray-600">
                    Rango: {liquidacion.fecha_inicio} a {liquidacion.fecha_final}
                  </p>
                  <p className="text-sm text-gray-600">
                    Fecha de Liquidación: {liquidacion.fecha_liquidacion}
                  </p>
                  <p className="text-sm font-semibold text-blue-800">
                    Total Liquidado: {formatCOP(liquidacion.total_liquidado)}
                  </p>
                </div>
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
                      Doctor
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                      Asistente
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                      Abono
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                      Descuento
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                      Valor Total
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                      Es Paciente Propio
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                      Porcentaje
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                      Método de Pago
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                      Método de Pago Abono
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                      Valor Pagado
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {liquidacion.servicios.map((registro, index) => (
                    <tr key={index} className="hover:bg-gray-50 transition-colors duration-150">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {registro.paciente}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {registro.nombre_serv}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {registro.nombre_doc || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {registro.nombre_aux || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatCOP(registro.abono)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatCOP(registro.dcto)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatCOP(registro.valor_total)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {registro.es_paciente_propio ? 'Sí' : 'No'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {registro.porcentaje ? `${registro.porcentaje}%` : 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {registro.metodoPago || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {registro.metodoPagoAbono || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-green-600">
                        {formatCOP(registro.valor_pagado)}
                      </td>
                    </tr>
                  ))}
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