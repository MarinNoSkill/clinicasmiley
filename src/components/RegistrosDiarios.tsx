import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { DentalRecord } from '../types';
import { formatCOP, fetchDoctors, fetchAssistants, fetchServices, fetchPaymentMethods } from '../data/constants';

interface RegistrosDiariosProps {
  registros: DentalRecord[];
  setRegistros: (registros: DentalRecord[]) => void;
}

const RegistrosDiarios: React.FC<RegistrosDiariosProps> = ({ registros, setRegistros }) => {
  const hoy = new Date().toISOString().split('T')[0];
  const [fechaSeleccionada, setFechaSeleccionada] = useState(hoy);
  const [doctores, setDoctores] = useState<string[]>([]);
  const [asistentes, setAsistentes] = useState<string[]>([]);
  const [servicios, setServicios] = useState<{ nombre: string; precio: number }[]>([]);
  const [metodosPago, setMetodosPago] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');

  const [formData, setFormData] = useState({
    nombreDoctor: '',
    nombreAsistente: '',
    nombrePaciente: '',
    servicio: '',
    sesionesParaCompletar: 1,
    sesionesCompletadas: 1,
    abono: 0,
    descuento: 0,
    esPacientePropio: true,
    fecha: hoy,
    metodoPago: '',
  });

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const [doctors, assistants, services, paymentMethods, records] = await Promise.all([
          fetchDoctors(),
          fetchAssistants(),
          fetchServices(),
          fetchPaymentMethods(),
          axios.get(`${import.meta.env.VITE_API_URL}/api/records`, {
            headers: {
              Authorization: `Bearer ${localStorage.getItem('token')}`,
            },
          }),
        ]);

        setDoctores(doctors);
        setAsistentes(assistants);
        setServicios(services);
        setMetodosPago(paymentMethods);
        setRegistros(records.data);

        // Set default values for formData
        setFormData((prev) => ({
          ...prev,
          nombreDoctor: doctors[0] || '',
          nombreAsistente: assistants[0] || '',
          servicio: services[0]?.nombre || '',
          metodoPago: paymentMethods[0] || '',
        }));
      } catch {
        setError('Error al cargar los datos. Por favor, intenta de nuevo.');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [setRegistros]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const total = formData.abono - formData.descuento;
      const newRecord = {
        nombreDoctor: formData.nombreDoctor,
        nombreAsistente: formData.nombreAsistente,
        nombrePaciente: formData.nombrePaciente,
        servicio: formData.servicio,
        sesionesParaCompletar: formData.sesionesParaCompletar,
        sesionesCompletadas: formData.sesionesCompletadas,
        abono: formData.abono,
        descuento: formData.descuento,
        total,
        esPacientePropio: formData.esPacientePropio,
        fecha: fechaSeleccionada,
        metodoPago: formData.metodoPago,
      };

      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/records`,
        newRecord,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        }
      );

      setRegistros([...registros, response.data]);
      setFormData({
        ...formData,
        nombrePaciente: '',
        abono: 0,
        descuento: 0,
        sesionesCompletadas: 1,
      });
    } catch{
      setError('Error al guardar el registro. Por favor, intenta de nuevo.');
    }
  };

  const registrosFiltrados = registros.filter((registro) => registro.fecha === fechaSeleccionada);

  if (loading) {
    return <div className="text-center py-6">Cargando datos...</div>;
  }

  if (error) {
    return <div className="text-center py-6 text-red-500">{error}</div>;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Registros Diarios - Clínica Smiley</h2>
        <div className="flex items-center space-x-2">
          <label className="text-sm font-medium text-gray-700">Fecha:</label>
          <input
            type="date"
            value={fechaSeleccionada}
            onChange={(e) => setFechaSeleccionada(e.target.value)}
            className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-white shadow-md rounded-lg p-6 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Doctor/a</label>
            <select
              value={formData.nombreDoctor}
              onChange={(e) => setFormData({ ...formData, nombreDoctor: e.target.value })}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              {doctores.map((doctor) => (
                <option key={doctor} value={doctor}>
                  {doctor}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Asistente</label>
            <select
              value={formData.nombreAsistente}
              onChange={(e) => setFormData({ ...formData, nombreAsistente: e.target.value })}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              {asistentes.map((asistente) => (
                <option key={asistente} value={asistente}>
                  {asistente}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Nombre del Paciente</label>
            <input
              type="text"
              value={formData.nombrePaciente}
              onChange={(e) => setFormData({ ...formData, nombrePaciente: e.target.value })}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Servicio</label>
            <select
              value={formData.servicio}
              onChange={(e) => setFormData({ ...formData, servicio: e.target.value })}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              {servicios.map((servicio) => (
                <option key={servicio.nombre} value={servicio.nombre}>
                  {servicio.nombre} ({formatCOP(servicio.precio)})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Sesiones para Completar</label>
            <input
              type="number"
              min="1"
              value={formData.sesionesParaCompletar}
              onChange={(e) =>
                setFormData({ ...formData, sesionesParaCompletar: parseInt(e.target.value) })
              }
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Sesiones Completadas</label>
            <input
              type="number"
              min="1"
              max={formData.sesionesParaCompletar}
              value={formData.sesionesCompletadas}
              onChange={(e) =>
                setFormData({ ...formData, sesionesCompletadas: parseInt(e.target.value) })
              }
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Abono (COP)</label>
            <input
              type="number"
              min="0"
              step="1000"
              value={formData.abono}
              onChange={(e) => setFormData({ ...formData, abono: parseFloat(e.target.value) })}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Descuento (COP)</label>
            <input
              type="number"
              min="0"
              step="1000"
              value={formData.descuento}
              onChange={(e) => setFormData({ ...formData, descuento: parseFloat(e.target.value) })}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Método de Pago</label>
            <select
              value={formData.metodoPago}
              onChange={(e) => setFormData({ ...formData, metodoPago: e.target.value })}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              {metodosPago.map((metodo) => (
                <option key={metodo} value={metodo}>
                  {metodo}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Tipo de Paciente</label>
            <select
              value={formData.esPacientePropio ? 'propio' : 'clinica'}
              onChange={(e) => setFormData({ ...formData, esPacientePropio: e.target.value === 'propio' })}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              <option value="propio">Paciente del Doctor/a (50%)</option>
              <option value="clinica">Paciente de la Clínica (40%)</option>
            </select>
          </div>
        </div>

        <div className="mt-6">
          <button
            type="submit"
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Guardar Registro
          </button>
        </div>
      </form>

      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Doctor/a
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Asistente
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Paciente
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Servicio
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Sesiones para Completar
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Sesiones Completadas
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Abono
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Descuento
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Método de Pago
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Total
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {registrosFiltrados.map((registro) => (
              <tr key={registro.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {registro.nombreDoctor}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {registro.nombreAsistente}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {registro.nombrePaciente}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{registro.servicio}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {registro.sesionesParaCompletar}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {registro.sesionesCompletadas}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {formatCOP(registro.abono)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {formatCOP(registro.descuento)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {registro.metodoPago}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {formatCOP(registro.total)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default RegistrosDiarios;