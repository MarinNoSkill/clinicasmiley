import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { DentalRecord } from '../types';
import { fetchDoctors, fetchAssistants, fetchServices, formatCOP } from '../data/constants';
import * as XLSX from 'xlsx';
import { useNavigate } from 'react-router-dom';

interface LiquidacionProps {
  registros: DentalRecord[];
  setRegistros: (registros: DentalRecord[]) => void;
}

interface CostoLaboratorio {
  id_laboratorio: number;
  nombre_serv: string;
  nombre_insumo: string;
  costo: number;
  descripcion: string;
}

const Liquidacion: React.FC<LiquidacionProps> = ({ registros, setRegistros }) => {
  const [doctores, setDoctores] = useState<string[]>([]);
  const [asistentes, setAsistentes] = useState<string[]>([]);
  const [servicios, setServicios] = useState<{ nombre: string; precio: number }[]>([]);
  const [doctorSeleccionado, setDoctorSeleccionado] = useState<string>('');
  const [esAuxiliar, setEsAuxiliar] = useState<boolean>(false);
  const [fechaInicio, setFechaInicio] = useState(new Date().toISOString().split('T')[0]);
  const [fechaFin, setFechaFin] = useState(new Date().toISOString().split('T')[0]);
  const [pacienteFiltro, setPacienteFiltro] = useState<string>('');
  const [servicioFiltro, setServicioFiltro] = useState<string>('');
  const [mostrarLiquidacion, setMostrarLiquidacion] = useState(false);
  const [serviciosLiquidados, setServiciosLiquidados] = useState<DentalRecord[][]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [totalLiquidacion, setTotalLiquidacion] = useState<number>(0);
  const [costosLaboratorio, setCostosLaboratorio] = useState<{[key: string]: number}>({});
  const [showLabModal, setShowLabModal] = useState<boolean>(false);
  const [selectedServicioLab, setSelectedServicioLab] = useState<string>('');
  const [laboratoriosServicio, setLaboratoriosServicio] = useState<CostoLaboratorio[]>([]);
  const [loadingLaboratorios, setLoadingLaboratorios] = useState<boolean>(false);

  const navigate = useNavigate();
  const id_sede = localStorage.getItem('selectedSede');
  const token = localStorage.getItem('token');

  useEffect(() => {
    console.log('Verificando id_sede:', id_sede);
    if (!id_sede) {
      console.log('No se encontró id_sede, redirigiendo a /sedes');
      navigate('/sedes');
      return;
    }

    const loadData = async () => {
      try {
        setLoading(true);
        console.log('Haciendo solicitud a /api/records con id_sede:', id_sede);
        const [doctors, assistants, services, records] = await Promise.all([
          fetchDoctors(id_sede),
          fetchAssistants(id_sede),
          fetchServices(),
          axios.get(`${import.meta.env.VITE_API_URL}/api/records`, {
            params: { id_sede },
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }),
        ]);

        console.log('Doctores cargados:', doctors);
        console.log('Asistentes cargados:', assistants);
        console.log('Servicios cargados:', services);
        console.log('Registros obtenidos:', records.data);

        setDoctores(doctors);
        setAsistentes(assistants);
        setServicios(services);
        setDoctorSeleccionado(doctors[0] || assistants[0] || '');

        const filteredRecords = (records.data as DentalRecord[]).filter(
          (record) => record.estado === false || record.estado === null
        );
        console.log('Registros filtrados (estado false o null):', filteredRecords);
        setRegistros(filteredRecords);
        
        // Cargar costos de laboratorio para todos los servicios
        await cargarTodosLosLaboratorios(services);
      } catch (err) {
        console.error('Error al cargar los datos:', err);
        setError('Error al cargar los datos. Por favor, intenta de nuevo.');
      } finally {
        setLoading(false);
        console.log('Carga de datos finalizada, loading:', false);
      }
    };

    loadData();
  }, [setRegistros, id_sede, navigate, token]);

  // Función para cargar todos los costos de laboratorio
  const cargarTodosLosLaboratorios = async (servicios: { nombre: string; precio: number }[]) => {
    try {
      const costosMap: {[key: string]: number} = {};
      
      await Promise.all(
        servicios.map(async (servicio) => {
          try {
            const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/laboratorios`, {
              params: { nombre_serv: servicio.nombre },
              headers: { Authorization: `Bearer ${token}` },
            });
            
            if (Array.isArray(response.data) && response.data.length > 0) {
              // Suma todos los costos de laboratorio para este servicio
              const totalCosto = response.data.reduce(
                (sum: number, item: CostoLaboratorio) => sum + (item.costo || 0), 
                0
              );
              costosMap[servicio.nombre] = totalCosto;
              console.log(`Costos de laboratorio para ${servicio.nombre}: ${totalCosto}`);
            } else {
              costosMap[servicio.nombre] = 0;
            }
          } catch (error) {
            console.error(`Error al cargar laboratorios para ${servicio.nombre}:`, error);
            costosMap[servicio.nombre] = 0;
          }
        })
      );
      
      setCostosLaboratorio(costosMap);
      console.log("Costos de laboratorio cargados para todos los servicios:", costosMap);
    } catch (error) {
      console.error("Error al cargar todos los laboratorios:", error);
    }
  };

  // Función para cargar laboratorios de un servicio específico
  const cargarLaboratoriosServicio = async (nombreServicio: string) => {
    if (!nombreServicio) return;
    
    setLoadingLaboratorios(true);
    try {
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/laboratorios`, {
        params: { nombre_serv: nombreServicio },
        headers: { Authorization: `Bearer ${token}` },
      });
      
      setLaboratoriosServicio(Array.isArray(response.data) ? response.data as CostoLaboratorio[] : []);
    } catch (error) {
      console.error(`Error al cargar laboratorios para ${nombreServicio}:`, error);
      setLaboratoriosServicio([]);
    } finally {
      setLoadingLaboratorios(false);
    }
  };

  // Función para abrir el modal de detalles de laboratorio
  const abrirDetallesLaboratorio = (nombreServicio: string) => {
    setSelectedServicioLab(nombreServicio);
    cargarLaboratoriosServicio(nombreServicio);
    setShowLabModal(true);
  };

  useEffect(() => {
    console.log('Cambiando esAuxiliar a:', esAuxiliar, 'reiniciando doctorSeleccionado');
    setDoctorSeleccionado('');
  }, [esAuxiliar]);

  const pacientesUnicos = [...new Set(registros.map((registro) => registro.nombrePaciente))].sort();
  const serviciosUnicos = [...new Set(registros.map((registro) => registro.servicio))].sort();
  console.log('Pacientes únicos:', pacientesUnicos);
  console.log('Servicios únicos:', serviciosUnicos);

  const registrosFiltrados = registros.filter((registro) => {
    const coincideDoctor = registro.nombreDoctor === doctorSeleccionado;
    const coincideFecha = registro.fecha >= fechaInicio && registro.fecha <= fechaFin;
    const coincidePaciente = pacienteFiltro ? registro.nombrePaciente === pacienteFiltro : true;
    const coincideServicio = servicioFiltro ? registro.servicio === servicioFiltro : true;
    return coincideDoctor && coincideFecha && coincidePaciente && coincideServicio;
  });
  console.log('Registros filtrados por doctor, fechas y filtros:', registrosFiltrados);

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
  console.log('Registros agrupados por paciente y servicio:', registrosAgrupados);

  const serviciosCompletados = Object.values(registrosAgrupados).filter((grupo) => {
    if (!grupo || grupo.length === 0) return false;

    const primerRegistro = grupo[0];
    const sesionesTotales = primerRegistro.sesiones || 1; 

    const tieneFechaFinal = grupo.every(registro => registro.fechaFinal !== null);
    if (tieneFechaFinal) {
        const valorLiquidadoTotalGrupo = grupo.reduce((sum, r) => sum + (r.valor_liquidado ?? 0), 0);
        return valorLiquidadoTotalGrupo <= 0;
    }


    if (sesionesTotales > 1 && !tieneFechaFinal) {
        const valorLiquidadoTotalGrupo = grupo.reduce((sum, r) => sum + (r.valor_liquidado ?? 0), 0);
        return valorLiquidadoTotalGrupo <= 0;
    }

    return false;
  });
  console.log('Servicios completados (lógica actualizada):', serviciosCompletados);

  const serviciosPendientes = Object.values(registrosAgrupados).filter(grupo => !serviciosCompletados.includes(grupo));
  console.log('Servicios pendientes (lógica actualizada):', serviciosPendientes);

  const calcularPorcentaje = (grupo: DentalRecord[]) => {
    if (esAuxiliar) {
      const porcentaje = grupo[0].esPacientePropio ? 0.20 : 0.10;
      console.log(`Calculando porcentaje para grupo auxiliar, esPacientePropio: ${grupo[0].esPacientePropio}, porcentaje: ${porcentaje}`);
      return porcentaje;
    }
    const idPorc = grupo[0].idPorc;
    const porcentaje = idPorc === 2 ? 0.50 : 0.40;
    console.log(`Calculando porcentaje para grupo doctor, idPorc: ${idPorc}, porcentaje: ${porcentaje}`);
    return porcentaje;
  };

  const calcularTotalGrupo = async (grupo: DentalRecord[]) => {
    // Obtener el precio del servicio desde la tabla Servicios
    const servicioNombre = grupo[0].servicio;
    const servicio = servicios.find((s) => s.nombre === servicioNombre);
    if (!servicio) {
      console.error(`Servicio no encontrado para nombre: ${servicioNombre}`);
      return 0;
    }
    console.log(`Precio del servicio ${servicioNombre}: ${servicio.precio}`);

    // Calcular el total del grupo basado en el precio del servicio y el número de sesiones completadas
    const sesionesCompletadas = grupo.every((r) => r.fechaFinal !== null) ? grupo[0].sesiones : grupo.length;
    const totalGrupo = servicio.precio * sesionesCompletadas;
    console.log(`Total del grupo (${servicioNombre}, sesiones: ${sesionesCompletadas}): ${totalGrupo}`);

    // Obtener costo de laboratorio para este servicio
    const costoLaboratorio = costosLaboratorio[servicioNombre] || 0;
    console.log(`Costo de laboratorio para ${servicioNombre}: ${costoLaboratorio}`);

    // Ajustar el total restando los costos de laboratorio
    const totalAjustado = Math.max(0, totalGrupo - costoLaboratorio);
    console.log(`Total ajustado después de restar laboratorio: ${totalAjustado}`);

    // Calcular porcentaje correspondiente
    let porcentaje;
    if (esAuxiliar) {
      porcentaje = calcularPorcentaje(grupo);
    } else {
      const idPorc = grupo[0].idPorc;
      try {
        console.log(`Consultando porcentaje para idPorc: ${idPorc}`);
        const { data: porcentajeData } = await axios.get(
          `${import.meta.env.VITE_API_URL}/api/porcentajes/${idPorc}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        const typedPorcentajeData = porcentajeData as { porcentaje: number };
        porcentaje = typedPorcentajeData.porcentaje / 100;
        console.log(`Porcentaje obtenido de API: ${porcentaje}`);
      } catch (error) {
        console.error('Error al obtener el porcentaje:', error);
        porcentaje = idPorc === 2 ? 0.50 : 0.40;
        console.log(`Usando porcentaje por defecto: ${porcentaje}`);
      }
    }

    // Calcular valor liquidado basado en el total ajustado y el porcentaje
    const valorLiquidado = totalAjustado * porcentaje;
    console.log(`Valor liquidado para grupo (${servicioNombre}): ${valorLiquidado}`);
    return valorLiquidado;
  };

  useEffect(() => {
    const fetchTotalLiquidacion = async () => {
      console.log('Calculando total de liquidación...');
      let total = 0;
      for (const grupo of serviciosCompletados) {
        const valorLiquidado = await calcularTotalGrupo(grupo);
        console.log(`Valor liquidado para grupo (paciente: ${grupo[0].nombrePaciente}, servicio: ${grupo[0].servicio}): ${valorLiquidado}`);
        total += valorLiquidado;
      }
      console.log('Total de liquidación final:', total);
      setTotalLiquidacion(total);
    };

    fetchTotalLiquidacion();
  }, [serviciosCompletados, esAuxiliar, costosLaboratorio]);

  const handleLiquidarGrupo = async (grupo: DentalRecord[]) => {
    try {
      console.log('Liquidando grupo:', grupo);
      const totalGrupo = await calcularTotalGrupo(grupo);
      const nuevaLiquidacion = {
        doctor: doctorSeleccionado,
        fechaInicio: fechaInicio,
        fechaFin: fechaFin,
        servicios: [grupo],
        totalLiquidado: totalGrupo,
        fechaLiquidacion: new Date().toISOString().split('T')[0],
      };
      console.log('Enviando nueva liquidación:', nuevaLiquidacion);

      await axios.post(
        `${import.meta.env.VITE_API_URL}/api/liquidations`,
        nuevaLiquidacion,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      // Filtrar los registros liquidados del estado local
      const idsServiciosLiquidados = grupo.map((registro) => registro.id);
      console.log('IDs de servicios liquidados:', idsServiciosLiquidados);
      const registrosRestantes = registros.filter(
        (registro) => !idsServiciosLiquidados.includes(registro.id)
      );
      setRegistros(registrosRestantes);
      setServiciosLiquidados([...serviciosLiquidados, grupo]);
      console.log('Servicios liquidados actualizados:', serviciosLiquidados);
    } catch (err) {
      console.error('Error al liquidar el grupo:', err);
      setError('Error al liquidar el grupo. Por favor, intenta de nuevo.');
    }
  };

  const handleLiquidarTodos = async () => {
    try {
      console.log('Liquidando todos los servicios completados...');
      setMostrarLiquidacion(true);
      setServiciosLiquidados(serviciosCompletados);

      const nuevaLiquidacion = {
        doctor: doctorSeleccionado,
        fechaInicio: fechaInicio,
        fechaFin: fechaFin,
        servicios: serviciosCompletados,
        totalLiquidado: totalLiquidacion,
        fechaLiquidacion: new Date().toISOString().split('T')[0],
      };
      console.log('Enviando liquidación de todos los servicios:', nuevaLiquidacion);

      await axios.post(
        `${import.meta.env.VITE_API_URL}/api/liquidations`,
        nuevaLiquidacion,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      // Filtrar los registros liquidados del estado local
      const idsServiciosLiquidados = serviciosCompletados.flatMap((grupo) =>
        grupo.map((registro) => registro.id)
      );
      console.log('IDs de todos los servicios liquidados:', idsServiciosLiquidados);
      const registrosRestantes = registros.filter(
        (registro) => !idsServiciosLiquidados.includes(registro.id)
      );
      setRegistros(registrosRestantes);
    } catch (err) {
      console.error('Error al liquidar todos los servicios:', err);
      setError('Error al liquidar los servicios. Por favor, intenta de nuevo.');
    }
  };

  const handleReiniciar = () => {
    console.log('Reiniciando liquidación...');
    setMostrarLiquidacion(false);
    setServiciosLiquidados([]);
  };

  const handleDescargarExcel = () => {
    console.log('Generando archivo Excel...');
    const datosExcel = serviciosLiquidados.length > 0 ? serviciosLiquidados : serviciosCompletados;
    const datos = datosExcel.flatMap((grupo) => {
      const servicioNombre = grupo[0].servicio;
      const servicio = servicios.find((s) => s.nombre === servicioNombre);
      const precioServicio = servicio ? servicio.precio : 0;
      const sesionesCompletadas = grupo.every((r) => r.fechaFinal !== null) ? grupo[0].sesiones : grupo.length;
      const totalGrupo = precioServicio * sesionesCompletadas;
      const costoLaboratorio = costosLaboratorio[servicioNombre] || 0;
      const totalAjustado = Math.max(0, totalGrupo - costoLaboratorio);
      const sesionesTotales = grupo[0].sesiones || 1;
      const porcentaje = esAuxiliar
        ? grupo[0].esPacientePropio
          ? 20
          : 10
        : grupo[0].idPorc === 2
        ? 50
        : 40;
      const totalALiquidar = totalAjustado * (porcentaje / 100);
      const metodosPago = [
        ...new Set(grupo.map((registro) => registro.metodoPago).filter((metodo) => metodo !== null)),
      ].join(', ');

      console.log(`Preparando datos para Excel - Grupo (paciente: ${grupo[0].nombrePaciente}, servicio: ${servicioNombre}):`, {
        totalGrupo,
        costoLaboratorio,
        totalAjustado,
        totalALiquidar,
      });

      return grupo.map((registro) => ({
        'Doctor/Auxiliar': registro.nombreDoctor,
        Paciente: registro.nombrePaciente,
        Documento: registro.docId,
        Servicio: registro.servicio,
        'Progreso Sesiones': `${sesionesCompletadas}/${sesionesTotales}`,
        Abono: registro.abono || 0,
        'Método de Pago Abono': registro.metodoPagoAbono || 'N/A',
        Descuento: registro.descuento || 0,
        'Método de Pago': registro.metodoPago ? `${registro.metodoPago} (${formatCOP(registro.valor_pagado)})` : 'N/A',
        'Total Pagado': totalGrupo,
        'Valor Total': precioServicio,
        'Costo Laboratorio': costoLaboratorio,
        'Valor Ajustado': totalAjustado,
        'Valor Restante': registro.valor_liquidado,
        'Tipo de Paciente': grupo[0].esPacientePropio
          ? esAuxiliar
            ? 'Propio (20%)'
            : 'Propio (50%)'
          : esAuxiliar
          ? 'Clínica (10%)'
          : 'Clínica (40%)',
        Porcentaje: `${porcentaje}%`,
        'Fecha Inicio': registro.fecha,
        'Fecha Final': registro.fechaFinal || 'Pendiente',
        'Total a Liquidar': totalALiquidar,
      }));
    });

    console.log('Datos para Excel:', datos);
    const worksheet = XLSX.utils.json_to_sheet(datos);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Liquidación');
    XLSX.writeFile(workbook, `Liquidacion_${doctorSeleccionado}_${fechaInicio}_a_${fechaFin}.xlsx`);
    console.log('Archivo Excel generado exitosamente');
  };

  if (loading) {
    console.log('Mostrando estado de carga...');
    return <div className="text-center py-6">Cargando datos...</div>;
  }

  if (error) {
    console.error('Error detectado:', error);
    return <div className="text-center py-6 text-red-500">{error}</div>;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <h2 className="text-3xl font-bold text-gray-800 mb-8">Liquidación - Clínica Smiley</h2>

      <div className="bg-white shadow-md rounded-lg p-5 mb-6 border border-teal-200">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">¿Es auxiliar?</label>
            <input
              type="checkbox"
              checked={esAuxiliar}
              onChange={(e) => setEsAuxiliar(e.target.checked)}
              className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Seleccionar {esAuxiliar ? 'Auxiliar' : 'Doctor/a'}
            </label>
            <select
              value={doctorSeleccionado}
              onChange={(e) => setDoctorSeleccionado(e.target.value)}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              <option value="">Selecciona un {esAuxiliar ? 'auxiliar' : 'doctor'}</option>
              {(esAuxiliar ? asistentes : doctores).map((profesional) => (
                <option key={profesional} value={profesional}>
                  {profesional}
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
              {serviciosUnicos.map((servicio) => (
                <option key={servicio} value={servicio}>
                  {servicio}
                </option>
              ))}
            </select>
          </div>
        </div>

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

        <div className="flex space-x-4">
          <button
            onClick={handleLiquidarTodos}
            disabled={serviciosCompletados.length === 0 || mostrarLiquidacion}
            className={`px-6 py-2 rounded-md text-white font-medium ${
              serviciosCompletados.length === 0 || mostrarLiquidacion
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-green-600 hover:bg-green-700'
            } focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors duration-200`}
          >
            Liquidar Todos los Servicios
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
              className="px-6 py-2 rounded-md text-white font-medium bg-gradient-to-r from-teal-600 to-teal-700 hover:bg-teal-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors duration-200"
            >
              Descargar en Excel
            </button>
          )}
        </div>
      </div>

      {mostrarLiquidacion && serviciosLiquidados.length > 0 && (
        <div className="bg-white shadow-lg rounded-lg p-6 mb-8">
          <h3 className="text-xl font-semibold text-gray-800 mb-4">Servicios Liquidados</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider min-w-[150px]">Doctor/Auxiliar</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider min-w-[150px]">Paciente</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider min-w-[100px]">Documento</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider min-w-[150px]">Servicio</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider min-w-[100px]">Progreso Sesiones</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider min-w-[100px]">Abono</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider min-w-[150px]">Método de Pago Abono</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider min-w-[100px]">Descuento</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider min-w-[150px]">Método de Pago</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider min-w-[100px]">Total Pagado</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider min-w-[100px]">Valor Total</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider min-w-[100px]">Costo Laboratorio</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider min-w-[100px]">Valor Ajustado</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider min-w-[100px]">Valor Restante</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider min-w-[100px]">Tipo de Paciente</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider min-w-[100px]">Porcentaje</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider min-w-[100px]">Fecha Inicio</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider min-w-[100px]">Fecha Final</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider min-w-[100px]">Total a Liquidar</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider min-w-[200px]">Notas</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {serviciosLiquidados.flat().map((registro, index) => {
                  const grupo = serviciosLiquidados.find((g) =>
                    g.some((r) => r.id === registro.id)
                  )!;
                  const servicioNombre = grupo[0].servicio;
                  const servicio = servicios.find((s) => s.nombre === servicioNombre);
                  const precioServicio = servicio ? servicio.precio : 0;
                  const sesionesCompletadas = grupo.every((r) => r.fechaFinal !== null)
                    ? grupo[0].sesiones
                    : grupo.length;
                  const totalGrupo = precioServicio * sesionesCompletadas;
                  const costoLaboratorio = costosLaboratorio[servicioNombre] || 0;
                  const totalAjustado = Math.max(0, totalGrupo - costoLaboratorio);
                  const sesionesTotales = grupo[0].sesiones || 1;
                  const porcentaje = esAuxiliar
                    ? grupo[0].esPacientePropio
                      ? 20
                      : 10
                    : grupo[0].idPorc === 2
                    ? 50
                    : 40;
                  const totalALiquidar = totalAjustado * (porcentaje / 100);

                  return (
                    <tr key={index} className="hover:bg-gray-50 transition-colors duration-150">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{registro.nombreDoctor}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{registro.nombrePaciente}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{registro.docId}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div className="flex items-center">
                          <span>{registro.servicio}</span>
                          {costoLaboratorio > 0 && (
                            <button 
                              onClick={() => abrirDetallesLaboratorio(servicioNombre)}
                              className="ml-2 text-xs text-blue-600 hover:text-blue-800 underline"
                              title="Ver detalles de laboratorio"
                            >
                              (Ver lab)
                            </button>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{`${sesionesCompletadas}/${sesionesTotales}`}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatCOP(registro.abono ?? 0)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {registro.metodoPagoAbono ? `${registro.metodoPagoAbono} (${formatCOP(registro.abono ?? 0)})` : 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatCOP(registro.descuento ?? 0)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {registro.metodoPago ? `${registro.metodoPago} (${formatCOP(registro.valor_pagado)})` : 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatCOP(totalGrupo)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatCOP(precioServicio)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <span className={costoLaboratorio > 0 ? "text-red-600 font-medium" : "text-gray-500"}>
                          {costoLaboratorio > 0 ? `-${formatCOP(costoLaboratorio)}` : formatCOP(0)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatCOP(totalAjustado)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatCOP(registro.valor_liquidado)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {grupo[0].esPacientePropio
                          ? esAuxiliar
                            ? 'Propio (20%)'
                            : 'Propio (50%)'
                          : esAuxiliar
                          ? 'Clínica (10%)'
                          : 'Clínica (40%)'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{porcentaje}%</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{registro.fecha}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{registro.fechaFinal || 'Pendiente'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-green-600">{formatCOP(totalALiquidar)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{registro.notas || 'N/A'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {!mostrarLiquidacion && serviciosCompletados.length > 0 && (
        <div className="bg-white shadow-lg rounded-lg p-6 mb-8">
          <h3 className="text-xl font-semibold text-gray-800 mb-4">Servicios Listos para Liquidar</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider min-w-[150px]">Doctor/Auxiliar</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider min-w-[150px]">Paciente</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider min-w-[100px]">Documento</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider min-w-[150px]">Servicio</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider min-w-[100px]">Progreso Sesiones</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider min-w-[100px]">Abono</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider min-w-[150px]">Método de Pago Abono</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider min-w-[100px]">Descuento</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider min-w-[150px]">Método de Pago</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider min-w-[100px]">Total Pagado</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider min-w-[100px]">Valor Total</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider min-w-[100px]">Costo Laboratorio</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider min-w-[100px]">Valor Ajustado</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider min-w-[100px]">Valor Restante</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider min-w-[100px]">Tipo de Paciente</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider min-w-[100px]">Porcentaje</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider min-w-[100px]">Fecha Inicio</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider min-w-[100px]">Fecha Final</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider min-w-[100px]">Total a Liquidar</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider min-w-[200px]">Notas</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider min-w-[100px]">Acción</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {serviciosCompletados.flat().map((registro, index) => {
                  const grupo = serviciosCompletados.find((g) =>
                    g.some((r) => r.id === registro.id)
                  )!;
                  const servicioNombre = grupo[0].servicio;
                  const servicio = servicios.find((s) => s.nombre === servicioNombre);
                  const precioServicio = servicio ? servicio.precio : 0;
                  const sesionesCompletadas = grupo.every((r) => r.fechaFinal !== null)
                    ? grupo[0].sesiones
                    : grupo.length;
                  const totalGrupo = precioServicio * sesionesCompletadas;
                  const costoLaboratorio = costosLaboratorio[servicioNombre] || 0;
                  const totalAjustado = Math.max(0, totalGrupo - costoLaboratorio);
                  const sesionesTotales = grupo[0].sesiones || 1;
                  const porcentaje = esAuxiliar
                    ? grupo[0].esPacientePropio
                      ? 20
                      : 10
                    : grupo[0].idPorc === 2
                    ? 50
                    : 40;
                  const totalALiquidar = totalAjustado * (porcentaje / 100);

                  return (
                    <tr key={index} className="hover:bg-gray-50 transition-colors duration-150">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{registro.nombreDoctor}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{registro.nombrePaciente}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{registro.docId}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div className="flex items-center">
                          <span>{registro.servicio}</span>
                          {costoLaboratorio > 0 && (
                            <button 
                              onClick={() => abrirDetallesLaboratorio(servicioNombre)}
                              className="ml-2 text-xs text-blue-600 hover:text-blue-800 underline"
                              title="Ver detalles de laboratorio"
                            >
                              (Ver lab)
                            </button>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{`${sesionesCompletadas}/${sesionesTotales}`}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatCOP(registro.abono ?? 0)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {registro.metodoPagoAbono ? `${registro.metodoPagoAbono} (${formatCOP(registro.abono ?? 0)})` : 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatCOP(registro.descuento ?? 0)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {registro.metodoPago ? `${registro.metodoPago} (${formatCOP(registro.valor_pagado)})` : 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatCOP(totalGrupo)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatCOP(precioServicio)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <span className={costoLaboratorio > 0 ? "text-red-600 font-medium" : "text-gray-500"}>
                          {costoLaboratorio > 0 ? `-${formatCOP(costoLaboratorio)}` : formatCOP(0)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatCOP(totalAjustado)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatCOP(registro.valor_liquidado)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {grupo[0].esPacientePropio
                          ? esAuxiliar
                            ? 'Propio (20%)'
                            : 'Propio (50%)'
                          : esAuxiliar
                          ? 'Clínica (10%)'
                          : 'Clínica (40%)'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{porcentaje}%</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{registro.fecha}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{registro.fechaFinal || 'Pendiente'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-green-600">{formatCOP(totalALiquidar)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{registro.notas || 'N/A'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <button
                          onClick={() => handleLiquidarGrupo([registro])}
                          className="px-4 py-2 rounded-md text-white font-medium bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors duration-200"
                        >
                          Liquidar
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Servicios Pendientes */}
      {/* ...existing code... */}

      {/* Modal para detalles de laboratorio */}
      {showLabModal && (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[80vh] overflow-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold text-gray-800">
                  Detalles de Laboratorio: {selectedServicioLab}
                </h3>
                <button 
                  onClick={() => setShowLabModal(false)}
                  className="text-gray-500 hover:text-gray-700 focus:outline-none"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                  </svg>
                </button>
              </div>
              
              {loadingLaboratorios ? (
                <div className="py-10 text-center">
                  <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500 mx-auto mb-4"></div>
                  <p>Cargando insumos de laboratorio...</p>
                </div>
              ) : laboratoriosServicio.length === 0 ? (
                <div className="py-6 text-center text-gray-500">
                  No hay insumos de laboratorio registrados para este servicio.
                </div>
              ) : (
                <>
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead>
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Insumo</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Costo</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Descripción</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {laboratoriosServicio.map((lab) => (
                        <tr key={lab.id_laboratorio} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{lab.nombre_insumo}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatCOP(lab.costo)}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{lab.descripcion || 'N/A'}</td>
                        </tr>
                      ))}
                      <tr className="bg-gray-50 font-semibold">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">TOTAL</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatCOP(laboratoriosServicio.reduce((sum, lab) => sum + lab.costo, 0))}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500"></td>
                      </tr>
                    </tbody>
                  </table>
                  <p className="mt-4 text-sm text-gray-600">
                    Este costo de laboratorio será restado del valor total del servicio antes de calcular la liquidación.
                  </p>
                </>
              )}
              
              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => setShowLabModal(false)}
                  className="px-4 py-2 bg-gray-300 text-gray-800 rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors duration-200"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {registrosFiltrados.length === 0 && (
        <p className="text-gray-600 text-center mt-8">
          No hay registros que coincidan con los filtros seleccionados.
        </p>
      )}
    </div>
  );
};

export default Liquidacion;