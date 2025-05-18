import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { fetchServices, fetchStadiumServices } from '../data/constants';

interface Laboratorio {
  id_laboratorio: number;
  nombre_serv: string;
  nombre_insumo: string;
  costo: number;
  descripcion: string;
}

interface Servicio {
  nombre: string;
  precio: number;
  descripcion?: string;
  sesiones?: number;
}

const GestionLaboratorios: React.FC = () => {
  const [servicios, setServicios] = useState<Servicio[]>([]);
  const [serviciosEstadio, setServiciosEstadio] = useState<Servicio[]>([]);
  const [tipoServicio, setTipoServicio] = useState<'normal' | 'estadio'>('normal');
  const [selectedServicio, setSelectedServicio] = useState<string>('');
  const [laboratorios, setLaboratorios] = useState<Laboratorio[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');

  // Estado para nuevo insumo
  const [newInsumo, setNewInsumo] = useState<{
    nombre_insumo: string;
    costo: string;
    descripcion: string;
  }>({
    nombre_insumo: '',
    costo: '',
    descripcion: '',
  });

  // Estado para insumo editado
  const [editingInsumo, setEditingInsumo] = useState<Laboratorio | null>(null);

  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  const idSede = localStorage.getItem('selectedSede');
  const isEstadioSede = idSede === '2'; // Sede Estadio tiene ID 2

  useEffect(() => {
    const cargarServicios = async () => {
      try {
        // Cargar servicios normales
        const serviciosData = await fetchServices();
        setServicios(serviciosData);
        
        // Para sede Estadio, también cargar servicios de estadio
        if (isEstadioSede) {
          const serviciosEstadioData = await fetchStadiumServices();
          setServiciosEstadio(serviciosEstadioData);
          // Establecer el tipo de servicio inicial
          setTipoServicio('normal');
        }
        
        // Establecer servicio seleccionado inicial
        if (serviciosData.length > 0) {
          setSelectedServicio(serviciosData[0].nombre);
        }
      } catch (err) {
        console.error('Error al cargar los servicios:', err);
        setError('Error al cargar los servicios');
      }
    };

    cargarServicios();
  }, [isEstadioSede]);

  useEffect(() => {
    if (selectedServicio) {
      cargarLaboratorios();
    }
  }, [selectedServicio]);

  // Cuando cambia el tipo de servicio, actualizar el servicio seleccionado
  useEffect(() => {
    if (tipoServicio === 'normal' && servicios.length > 0) {
      setSelectedServicio(servicios[0].nombre);
    } else if (tipoServicio === 'estadio' && serviciosEstadio.length > 0) {
      setSelectedServicio(serviciosEstadio[0].nombre);
    }
  }, [tipoServicio, servicios, serviciosEstadio]);

  const cargarLaboratorios = async () => {
    if (!selectedServicio) return;

    setLoading(true);
    setError('');
    try {
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/laboratorios`, {
        params: { nombre_serv: selectedServicio },
        headers: { Authorization: `Bearer ${token}` },
      });
      setLaboratorios(response.data as Laboratorio[]);
    } catch (err: any) {
      console.error('Error al cargar los laboratorios:', err);
      if (err.response?.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login');
      } else {
        setError('Error al cargar los costos de laboratorio');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAddInsumo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedServicio || !newInsumo.nombre_insumo || !newInsumo.costo) {
      setError('Por favor complete todos los campos obligatorios');
      return;
    }

    const costo = parseFloat(newInsumo.costo);
    if (isNaN(costo) || costo < 0) {
      setError('Por favor ingrese un costo válido');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');
    try {
      await axios.post(
        `${import.meta.env.VITE_API_URL}/api/laboratorios`,
        {
          nombre_serv: selectedServicio,
          nombre_insumo: newInsumo.nombre_insumo,
          costo,
          descripcion: newInsumo.descripcion,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      
      setSuccess('Insumo de laboratorio agregado correctamente');
      setNewInsumo({
        nombre_insumo: '',
        costo: '',
        descripcion: '',
      });
      cargarLaboratorios();
    } catch (err: any) {
      console.error('Error al agregar el insumo de laboratorio:', err);
      if (err.response?.data?.error) {
        setError(err.response.data.error);
      } else {
        setError('Error al agregar el insumo de laboratorio');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleEditInsumo = (insumo: Laboratorio) => {
    setEditingInsumo(insumo);
  };

  const handleSaveEdit = async () => {
    if (!editingInsumo) return;

    setLoading(true);
    setError('');
    setSuccess('');
    try {
      await axios.put(
        `${import.meta.env.VITE_API_URL}/api/laboratorios`,
        {
          id_laboratorio: editingInsumo.id_laboratorio,
          nombre_insumo: editingInsumo.nombre_insumo,
          costo: editingInsumo.costo,
          descripcion: editingInsumo.descripcion,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      
      setSuccess('Insumo de laboratorio actualizado correctamente');
      setEditingInsumo(null);
      cargarLaboratorios();
    } catch (err: any) {
      console.error('Error al actualizar el insumo de laboratorio:', err);
      setError(err.response?.data?.error || 'Error al actualizar el insumo de laboratorio');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteInsumo = async (id: number) => {
    if (!window.confirm('¿Está seguro de que desea eliminar este insumo de laboratorio?')) {
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');
    try {
      await axios.delete(`${import.meta.env.VITE_API_URL}/api/laboratorios`, {
        headers: { Authorization: `Bearer ${token}` },
        data: { id_laboratorio: id },
      });
      
      setSuccess('Insumo de laboratorio eliminado correctamente');
      cargarLaboratorios();
    } catch (err: any) {
      console.error('Error al eliminar el insumo de laboratorio:', err);
      setError(err.response?.data?.error || 'Error al eliminar el insumo de laboratorio');
    } finally {
      setLoading(false);
    }
  };

  const calcularTotalCostos = () => {
    return laboratorios.reduce((total, lab) => total + lab.costo, 0);
  };

  const formatCOP = (value: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
    }).format(value);
  };

  // Obtener la lista de servicios según el tipo seleccionado
  const getServiciosActivos = () => {
    return tipoServicio === 'normal' ? servicios : serviciosEstadio;
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <h2 className="text-3xl font-bold text-gray-800 mb-8">Gestión de Costos de Laboratorio</h2>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
          {success}
        </div>
      )}

      <div className="flex flex-col md:flex-row gap-8">
        <div className="w-full md:w-1/3 bg-white shadow-md rounded-lg p-6 h-fit">
          <h3 className="text-xl font-semibold text-gray-800 mb-4">Seleccionar Servicio</h3>
          
          {/* Selector de tipo de servicio para sede Estadio */}
          {isEstadioSede && (
            <div className="mb-4">
              <div className="flex gap-4 mb-2">
                <button
                  onClick={() => setTipoServicio('normal')}
                  className={`px-4 py-2 rounded-md ${
                    tipoServicio === 'normal'
                      ? 'bg-teal-600 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  Servicios Smiley
                </button>
                <button
                  onClick={() => setTipoServicio('estadio')}
                  className={`px-4 py-2 rounded-md ${
                    tipoServicio === 'estadio'
                      ? 'bg-teal-600 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  Servicios Estadio
                </button>
              </div>
              <p className="text-sm text-gray-600 mb-4">
                {tipoServicio === 'normal' 
                  ? 'Mostrando servicios regulares de todas las sedes' 
                  : 'Mostrando servicios exclusivos de sede Estadio'}
              </p>
            </div>
          )}
          
          <select
            value={selectedServicio}
            onChange={(e) => setSelectedServicio(e.target.value)}
            className="w-full rounded-md border border-gray-300 shadow-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            {getServiciosActivos().map((servicio) => (
              <option key={servicio.nombre} value={servicio.nombre}>
                {servicio.nombre} - {formatCOP(servicio.precio)}
              </option>
            ))}
          </select>

          <h3 className="text-xl font-semibold text-gray-800 mt-8 mb-4">Agregar Nuevo Insumo</h3>
          <form onSubmit={handleAddInsumo}>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nombre del Insumo *
              </label>
              <input
                type="text"
                value={newInsumo.nombre_insumo}
                onChange={(e) =>
                  setNewInsumo({ ...newInsumo, nombre_insumo: e.target.value })
                }
                className="w-full rounded-md border border-gray-300 shadow-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Costo (COP) *
              </label>
              <input
                type="number"
                value={newInsumo.costo}
                onChange={(e) =>
                  setNewInsumo({ ...newInsumo, costo: e.target.value })
                }
                min="0"
                className="w-full rounded-md border border-gray-300 shadow-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Descripción
              </label>
              <textarea
                value={newInsumo.descripcion}
                onChange={(e) =>
                  setNewInsumo({ ...newInsumo, descripcion: e.target.value })
                }
                className="w-full rounded-md border border-gray-300 shadow-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                rows={3}
              />
            </div>

            <button
              type="submit"
              className="w-full bg-teal-600 hover:bg-teal-700 text-white py-2 px-4 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
              disabled={loading}
            >
              {loading ? 'Agregando...' : 'Agregar Insumo'}
            </button>
          </form>
        </div>

        <div className="w-full md:w-2/3 bg-white shadow-md rounded-lg p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-semibold text-gray-800">
              Insumos para: {selectedServicio}
              {isEstadioSede && (
                <span className="ml-2 text-sm font-normal text-gray-600">
                  ({tipoServicio === 'normal' ? 'Servicio Regular' : 'Servicio Estadio'})
                </span>
              )}
            </h3>
            <div className="flex items-center">
              <span className="text-xl font-semibold text-indigo-600">
                Total: {formatCOP(calcularTotalCostos())}
              </span>
            </div>
          </div>

          {loading && !editingInsumo ? (
            <div className="text-center py-10">
              <div className="spinner"></div>
              <p className="mt-3 text-gray-600">Cargando insumos...</p>
            </div>
          ) : laboratorios.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-gray-600">
                No hay insumos registrados para este servicio
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Nombre
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Costo
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Descripción
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {laboratorios.map((laboratorio) => (
                    <tr key={laboratorio.id_laboratorio}>
                      {editingInsumo && editingInsumo.id_laboratorio === laboratorio.id_laboratorio ? (
                        <>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <input
                              type="text"
                              value={editingInsumo.nombre_insumo}
                              onChange={(e) =>
                                setEditingInsumo({ ...editingInsumo, nombre_insumo: e.target.value })
                              }
                              className="w-full rounded-md border border-gray-300 shadow-sm py-1 px-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              required
                            />
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <input
                              type="number"
                              value={editingInsumo.costo}
                              onChange={(e) =>
                                setEditingInsumo({ ...editingInsumo, costo: parseFloat(e.target.value) })
                              }
                              min="0"
                              className="w-full rounded-md border border-gray-300 shadow-sm py-1 px-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              required
                            />
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <input
                              type="text"
                              value={editingInsumo.descripcion}
                              onChange={(e) =>
                                setEditingInsumo({ ...editingInsumo, descripcion: e.target.value })
                              }
                              className="w-full rounded-md border border-gray-300 shadow-sm py-1 px-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <button
                              onClick={handleSaveEdit}
                              className="text-green-600 hover:text-green-900 mr-4"
                            >
                              Guardar
                            </button>
                            <button
                              onClick={() => setEditingInsumo(null)}
                              className="text-gray-600 hover:text-gray-900"
                            >
                              Cancelar
                            </button>
                          </td>
                        </>
                      ) : (
                        <>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {laboratorio.nombre_insumo}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {formatCOP(laboratorio.costo)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {laboratorio.descripcion || '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <button
                              onClick={() => handleEditInsumo(laboratorio)}
                              className="text-indigo-600 hover:text-indigo-900 mr-4"
                            >
                              Editar
                            </button>
                            <button
                              onClick={() => handleDeleteInsumo(laboratorio.id_laboratorio)}
                              className="text-red-600 hover:text-red-900"
                            >
                              Eliminar
                            </button>
                          </td>
                        </>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default GestionLaboratorios;