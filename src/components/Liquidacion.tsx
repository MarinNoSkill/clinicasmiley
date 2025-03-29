import React, { useState } from 'react';
import { DentalRecord } from '../types';
import { DOCTORES, SERVICIOS, formatCOP } from '../data/constants';
import * as XLSX from 'xlsx';

interface LiquidacionProps {
  registros: DentalRecord[];
  setRegistros: (registros: DentalRecord[]) => void;
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

const Liquidacion: React.FC<LiquidacionProps> = ({ registros, setRegistros }) => {
  const [doctorSeleccionado, setDoctorSeleccionado] = useState<string>(DOCTORES[0]);
  const [fechaInicio, setFechaInicio] = useState(new Date().toISOString().split('T')[0]);
  const [fechaFin, setFechaFin] = useState(new Date().toISOString().split('T')[0]);
  const [pacienteFiltro, setPacienteFiltro] = useState<string>(''); // Filtro por paciente
  const [servicioFiltro, setServicioFiltro] = useState<string>(''); // Filtro por servicio
  const [mostrarLiquidacion, setMostrarLiquidacion] = useState(false);
  const [serviciosLiquidados, setServiciosLiquidados] = useState<DentalRecord[][]>([]);

  // Obtener lista única de pacientes para el filtro
  const pacientesUnicos = [...new Set(registros.map((registro) => registro.nombrePaciente))].sort();

  // Filtrar registros por doctor, fechas, paciente y servicio
  const registrosFiltrados = registros.filter((registro) => {
    const coincideDoctor = registro.nombreDoctor === doctorSeleccionado;
    const coincideFecha = registro.fecha >= fechaInicio && registro.fecha <= fechaFin;
    const coincidePaciente = pacienteFiltro ? registro.nombrePaciente === pacienteFiltro : true;
    const coincideServicio = servicioFiltro ? registro.servicio === servicioFiltro : true;
    return coincideDoctor && coincideFecha && coincidePaciente && coincideServicio;
  });

  // Agrupar registros por paciente y servicio
  const registrosAgrupados: { [key: string]: DentalRecord[] } = registrosFiltrados.reduce(
    (acc, registro) => {
      const key = `${registro.nombrePaciente}-${registro.servicio}`;
      if (!acc[key]) {
        acc[key] = [];
      }
      acc[key].push(registro);
      return acc;
    },
    {} as { [key: string]: DentalRecord[] }
  );

  // Separar servicios completados y pendientes
  const serviciosCompletados = Object.values(registrosAgrupados).filter((grupo) => {
    const totalSesionesParaCompletar = grupo[0].sesionesParaCompletar;
    const totalSesionesCompletadas = grupo.reduce(
      (sum, registro) => sum + registro.sesionesCompletadas,
      0
    );
    return totalSesionesCompletadas >= totalSesionesParaCompletar;
  });

  const serviciosPendientes = Object.values(registrosAgrupados).filter((grupo) => {
    const totalSesionesParaCompletar = grupo[0].sesionesParaCompletar;
    const totalSesionesCompletadas = grupo.reduce(
      (sum, registro) => sum + registro.sesionesCompletadas,
      0
    );
    return totalSesionesCompletadas < totalSesionesParaCompletar;
  });

  // Calcular la liquidación para servicios completados
  const calcularLiquidacion = (servicios: DentalRecord[][]) => {
    return servicios.reduce((total, grupo) => {
      const totalGrupo = grupo.reduce((sum, registro) => sum + registro.total, 0);
      const porcentaje = grupo[0].esPacientePropio ? 0.5 : 0.4;
      return total + totalGrupo * porcentaje;
    }, 0);
  };

  const totalLiquidacion = calcularLiquidacion(serviciosCompletados);

  // Función para liquidar
  const handleLiquidar = () => {
    setMostrarLiquidacion(true);
    setServiciosLiquidados(serviciosCompletados);

    // Guardar en el historial de liquidaciones
    const nuevaLiquidacion: LiquidacionHistorial = {
      id: Date.now().toString(),
      doctor: doctorSeleccionado,
      fechaInicio,
      fechaFin,
      servicios: serviciosCompletados,
      totalLiquidado: totalLiquidacion,
      fechaLiquidacion: new Date().toISOString().split('T')[0],
    };
    const historial = JSON.parse(localStorage.getItem('historialLiquidaciones') || '[]');
    historial.push(nuevaLiquidacion);
    localStorage.setItem('historialLiquidaciones', JSON.stringify(historial));

    // Eliminar servicios liquidados de los registros
    const idsServiciosLiquidados = new Set(
      serviciosCompletados.flatMap((grupo) => grupo.map((registro) => registro.id))
    );
    const registrosRestantes = registros.filter((registro) => !idsServiciosLiquidados.has(registro.id));
    setRegistros(registrosRestantes);
    localStorage.setItem('registrosDentales', JSON.stringify(registrosRestantes));
  };

  // Función para reiniciar la liquidación
  const handleReiniciar = () => {
    setMostrarLiquidacion(false);
    setServiciosLiquidados([]);
  };

  // Función para descargar en Excel
  const handleDescargarExcel = () => {
    const datosExcel = serviciosLiquidados.length > 0 ? serviciosLiquidados : serviciosCompletados;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const datos = datosExcel.flatMap((grupo, index) => {
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
    XLSX.writeFile(workbook, `Liquidacion_${doctorSeleccionado}_${fechaInicio}_a_${fechaFin}.xlsx`);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <h2 className="text-3xl font-bold text-gray-800 mb-8">Liquidación - Clínica Smiley</h2>

      {/* Filtros */}
      <div className="bg-white shadow-lg rounded-lg p-6 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Seleccionar Doctor/a</label>
            <select
              value={doctorSeleccionado}
              onChange={(e) => setDoctorSeleccionado(e.target.value)}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              {DOCTORES.map((doctor) => (
                <option key={doctor} value={doctor}>
                  {doctor}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Fecha de Inicio</label>
            <input
              type="date"
              value={fechaInicio}
              onChange={(e) => setFechaInicio(e.target.value)}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Fecha de Fin</label>
            <input
              type="date"
              value={fechaFin}
              onChange={(e) => setFechaFin(e.target.value)}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Filtrar por Paciente</label>
            <select
              value={pacienteFiltro}
              onChange={(e) => setPacienteFiltro(e.target.value)}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              <option value="">Todos los Pacientes</option>
              {pacientesUnicos.map((paciente) => (
                <option key={paciente} value={paciente}>
                  {paciente}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Filtrar por Servicio</label>
            <select
              value={servicioFiltro}
              onChange={(e) => setServicioFiltro(e.target.value)}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              <option value="">Todos los Servicios</option>
              {SERVICIOS.map((servicio) => (
                <option key={servicio.nombre} value={servicio.nombre}>
                  {servicio.nombre}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Resumen en Tarjetas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-blue-100 p-4 rounded-lg shadow-md">
            <h3 className="text-lg font-semibold text-blue-900">Total a Liquidar</h3>
            <p className="text-2xl font-bold text-blue-800">{formatCOP(totalLiquidacion)}</p>
          </div>
          <div className="bg-green-100 p-4 rounded-lg shadow-md">
            <h3 className="text-lg font-semibold text-green-900">Servicios Listos</h3>
            <p className="text-2xl font-bold text-green-800">{serviciosCompletados.length}</p>
          </div>
          <div className="bg-yellow-100 p-4 rounded-lg shadow-md">
            <h3 className="text-lg font-semibold text-yellow-900">Servicios Pendientes</h3>
            <p className="text-2xl font-bold text-yellow-800">{serviciosPendientes.length}</p>
          </div>
        </div>

        {/* Botones de Acción */}
        <div className="flex space-x-4">
          <button
            onClick={handleLiquidar}
            disabled={serviciosCompletados.length === 0 || mostrarLiquidacion}
            className={`px-6 py-2 rounded-md text-white font-medium ${
              serviciosCompletados.length === 0 || mostrarLiquidacion
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-green-600 hover:bg-green-700'
            } focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors duration-200`}
          >
            Liquidar Servicios
          </button>
          {mostrarLiquidacion && (
            <button
              onClick={handleReiniciar}
              className="px-6 py-2 rounded-md text-white font-medium bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors duration-200"
            >
              Reiniciar Liquidación
            </button>
          )}
          {(serviciosCompletados.length > 0 || serviciosLiquidados.length > 0) && (
            <button
              onClick={handleDescargarExcel}
              className="px-6 py-2 rounded-md text-white font-medium bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors duration-200"
            >
              Descargar en Excel
            </button>
          )}
        </div>
      </div>

      {/* Sección de Servicios Liquidados */}
      {mostrarLiquidacion && serviciosLiquidados.length > 0 && (
        <div className="bg-white shadow-lg rounded-lg p-6 mb-8">
          <h3 className="text-xl font-semibold text-gray-800 mb-4">Servicios Liquidados</h3>
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
                {serviciosLiquidados.map((grupo, index) => {
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
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-semibold text-green-600">
                        {formatCOP(totalALiquidar)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Sección de Servicios Listos para Liquidar (antes de liquidar) */}
      {!mostrarLiquidacion && serviciosCompletados.length > 0 && (
        <div className="bg-white shadow-lg rounded-lg p-6 mb-8">
          <h3 className="text-xl font-semibold text-gray-800 mb-4">Servicios Listos para Liquidar</h3>
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
                {serviciosCompletados.map((grupo, index) => {
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
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-semibold text-green-600">
                        {formatCOP(totalALiquidar)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Sección de Servicios Pendientes */}
      {serviciosPendientes.length > 0 && (
        <div className="bg-white shadow-lg rounded-lg p-6">
          <h3 className="text-xl font-semibold text-gray-800 mb-4">Servicios Pendientes de Completar</h3>
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
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {serviciosPendientes.map((grupo, index) => {
                  const totalGrupo = grupo.reduce((sum, registro) => sum + registro.total, 0);
                  const totalSesionesCompletadas = grupo.reduce(
                    (sum, registro) => sum + registro.sesionesCompletadas,
                    0
                  );
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
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Mensaje si no hay servicios */}
      {registrosFiltrados.length === 0 && (
        <p className="text-gray-600 text-center mt-8">
          No hay registros que coincidan con los filtros seleccionados.
        </p>
      )}
    </div>
  );
};

export default Liquidacion;