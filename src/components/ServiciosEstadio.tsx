import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { formatCOP, fetchStadiumServices } from '../data/constants';

interface Service {
  nombre: string;
  precio: number;
  sesiones: number;
  descripcion: string;
}
  
interface CostoLaboratorio {
  id_laboratorio: number;
  nombre_serv: string;
  nombre_insumo: string;
  costo: number;
  descripcion: string;
}

const ServiciosEstadio: React.FC = () => {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [newService, setNewService] = useState<Service>({ nombre: '', precio: 0, sesiones: 1, descripcion: '' });
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [serviceToDelete, setServiceToDelete] = useState<Service | null>(null);
  const [showDescriptionModal, setShowDescriptionModal] = useState(false);
  const [selectedDescription, setSelectedDescription] = useState<string>('');
  const [showLabModal, setShowLabModal] = useState<boolean>(false);
  const [selectedService, setSelectedService] = useState<string>('');
  const [laboratorios, setLaboratorios] = useState<CostoLaboratorio[]>([]);
  const [loadingLabs, setLoadingLabs] = useState<boolean>(false);
  const [newInsumo, setNewInsumo] = useState<{nombre: string; costo: number; descripcion: string}>({ 
    nombre: '', 
    costo: 0, 
    descripcion: '' 
  });
  const [costosLaboratorio, setCostosLaboratorio] = useState<{[key: string]: number}>({});

  useEffect(() => {
    const loadServices = async () => {
      try {
        setLoading(true);
        const fetchedServices = await fetchStadiumServices();
        setServices(fetchedServices);
        await cargarTodosLosLaboratorios(fetchedServices);
      } catch (err) {
        console.error('Error fetching stadium services:', err);
        setError('Error al cargar los servicios de Estadio. Por favor, intenta de nuevo.');
      } finally {
        setLoading(false);
      }
    };

    loadServices();
  }, []);

  // Cargar todos los costos de laboratorio para todos los servicios
  const cargarTodosLosLaboratorios = async (servicios: Service[]) => {
    try {
      const costosMap: {[key: string]: number} = {};
      const token = localStorage.getItem('token');
      
      await Promise.all(
        servicios.map(async (servicio) => {
          try {
            const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/laboratorios`, {
              params: { nombre_serv: servicio.nombre },
              headers: { Authorization: `Bearer ${token}` },
            });
            
            if (response.data && response.data.length > 0) {
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
  const cargarLaboratoriosPorServicio = async (nombreServicio: string) => {
    if (!nombreServicio) return;
    
    setLoadingLabs(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/laboratorios`, {
        params: { nombre_serv: nombreServicio },
        headers: { Authorization: `Bearer ${token}` },
      });
      
      setLaboratorios(response.data || []);
    } catch (error) {
      console.error(`Error al cargar laboratorios para ${nombreServicio}:`, error);
      setLaboratorios([]);
    } finally {
      setLoadingLabs(false);
    }
  };

  const handleAgregarInsumo = async () => {
    if (!selectedService || !newInsumo.nombre || newInsumo.costo <= 0) {
      setError('Por favor, ingresa un nombre y un costo válido para el insumo.');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/laboratorios`,
        {
          nombre_serv: selectedService,
          nombre_insumo: newInsumo.nombre,
          costo: newInsumo.costo,
          descripcion: newInsumo.descripcion
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      // Actualizar la lista de insumos
      setLaboratorios([...laboratorios, response.data]);
      
      // Actualizar los costos totales
      setCostosLaboratorio({
        ...costosLaboratorio,
        [selectedService]: (costosLaboratorio[selectedService] || 0) + newInsumo.costo
      });

      // Limpiar el formulario
      setNewInsumo({ nombre: '', costo: 0, descripcion: '' });
      setError('');
    } catch (err: any) {
      console.error('Error al añadir insumo de laboratorio:', err);
      setError(
        err.response?.data?.error || 'Error al añadir el insumo. Por favor, intenta de nuevo.'
      );
    }
  };

  const handleEliminarInsumo = async (idLaboratorio: number, costo: number) => {
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${import.meta.env.VITE_API_URL}/api/laboratorios`, {
        headers: { Authorization: `Bearer ${token}` },
        data: { id_laboratorio: idLaboratorio },
      });

      // Actualizar la lista de insumos
      setLaboratorios(laboratorios.filter(lab => lab.id_laboratorio !== idLaboratorio));
      
      // Actualizar los costos totales
      setCostosLaboratorio({
        ...costosLaboratorio,
        [selectedService]: Math.max(0, (costosLaboratorio[selectedService] || 0) - costo)
      });

    } catch (err: any) {
      console.error('Error al eliminar insumo de laboratorio:', err);
      setError(
        err.response?.data?.error || 'Error al eliminar el insumo. Por favor, intenta de nuevo.'
      );
    }
  };

  const handleOpenLabModal = (servicio: string) => {
    setSelectedService(servicio);
    cargarLaboratoriosPorServicio(servicio);
    setShowLabModal(true);
  };

  const handleEdit = (service: Service) => {
    setEditingService(service);
    setNewService(service);
  };

  const handleSaveEdit = async () => {
    if (editingService) {
      if (!newService.nombre || newService.precio <= 0) {
        setError('Por favor, ingresa un nombre y un precio válido.');
        return;
      }

      if (
        newService.nombre !== editingService.nombre &&
        services.some((s) => s.nombre === newService.nombre)
      ) {
        setError('Ya existe un servicio con este nombre.');
        return;
      }

      try {
        const response = await axios.put<Service>(
          `${import.meta.env.VITE_API_URL}/api/stadium-services`,
          {
            nombreOriginal: editingService.nombre,
            nombre: newService.nombre,
            precio: newService.precio,
            sesiones: newService.sesiones || 1,
            descripcion: newService.descripcion || ''
          },
          {
            headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
          }
        );

        setServices(
          services.map((s) =>
            s.nombre === editingService.nombre ? response.data : s
          )
        );
        setEditingService(null);
        setNewService({ nombre: '', precio: 0, sesiones: 1, descripcion: '' });
        setError('');
      } catch (err: any) {
        console.error('Error updating stadium service:', err);
        setError(
          err.response?.data?.error || 'Error al guardar los cambios. Por favor, intenta de nuevo.'
        );
      }
    }
  };

  const handleDelete = (service: Service) => {
    setServiceToDelete(service);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (serviceToDelete) {
      try {
        await axios.delete(`${import.meta.env.VITE_API_URL}/api/stadium-services`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
          data: { nombre: serviceToDelete.nombre },
        });

        setServices(services.filter((s) => s.nombre !== serviceToDelete.nombre));
        setError('');
        setShowDeleteModal(false);
        setServiceToDelete(null);
      } catch (err: any) {
        console.error('Error deleting stadium service:', err);
        setError(
          err.response?.data?.error || 'Error al eliminar el servicio. Por favor, intenta de nuevo.'
        );
        setShowDeleteModal(false);
      }
    }
  };

  const handleAddService = async () => {
    if (!newService.nombre || newService.precio <= 0) {
      setError('Por favor, ingresa un nombre y un precio válido.');
      return;
    }

    if (services.some((s) => s.nombre === newService.nombre)) {
      setError('Ya existe un servicio con este nombre.');
      return;
    }

    try {
      const response = await axios.post<Service>(
        `${import.meta.env.VITE_API_URL}/api/stadium-services`,
        newService,
        {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        }
      );

      setServices([...services, response.data]);
      setNewService({ nombre: '', precio: 0, sesiones: 1, descripcion: '' });
      setError('');
    } catch (err: any) {
      console.error('Error adding stadium service:', err);
      setError(
        err.response?.data?.error || 'Error al añadir el servicio. Por favor, intenta de nuevo.'
      );
    }
  };

  const handleCancelEdit = () => {
    setEditingService(null);
    setNewService({ nombre: '', precio: 0, sesiones: 1, descripcion: '' });
    setError('');
  };

  const handleViewDescription = (descripcion: string) => {
    setSelectedDescription(descripcion);
    setShowDescriptionModal(true);
  };

  const formatDescription = (descripcion: string) => {
    if (!descripcion) return 'N/A';
    if (descripcion.length > 30) {
      return descripcion.substring(0, 30) + '...';
    }
    return descripcion;
  };

  if (loading) {
    return <div className="text-center py-6">Cargando servicios de Estadio...</div>;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <h2 className="text-3xl font-bold text-gray-800 mb-4">Servicios Sede Estadio - Clínica Smiley</h2>

      {error && (
        <div className="mb-6 p-4 bg-red-100 text-red-700 rounded-md">{error}</div>
      )}

      <div className="shadow-md rounded-lg p-2">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 mt-0">Lista de Servicios Sede Estadio</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Servicio
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Precio Estimado (COP)
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Costo Laboratorio
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Sesiones
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Descripción
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {services.map((servicio) => (
                <tr key={servicio.nombre}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {editingService?.nombre === servicio.nombre ? (
                      <input
                        type="text"
                        value={newService.nombre}
                        onChange={(e) =>
                          setNewService({ ...newService, nombre: e.target.value })
                        }
                        className="border rounded px-2 py-1 w-full focus:ring-blue-500 focus:border-blue-500"
                        required
                      />
                    ) : (
                      servicio.nombre
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {editingService?.nombre === servicio.nombre ? (
                      <input
                        type="number"
                        value={newService.precio}
                        onChange={(e) =>
                          setNewService({
                            ...newService,
                            precio: parseFloat(e.target.value) || 0,
                          })
                        }
                        className="border rounded px-2 py-1 w-full focus:ring-blue-500 focus:border-blue-500"
                        min="0"
                        step="1000"
                        required
                      />
                    ) : (
                      formatCOP(servicio.precio)
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div className="flex items-center">
                      <span className={costosLaboratorio[servicio.nombre] > 0 ? "text-red-600 font-medium" : "text-gray-500"}>
                        {costosLaboratorio[servicio.nombre] > 0 
                          ? `-${formatCOP(costosLaboratorio[servicio.nombre])}` 
                          : formatCOP(0)}
                      </span>
                      <button
                        onClick={() => handleOpenLabModal(servicio.nombre)}
                        className="ml-2 text-blue-600 hover:text-blue-800 focus:outline-none text-xs"
                        title="Gestionar insumos de laboratorio"
                      >
                        {costosLaboratorio[servicio.nombre] > 0 ? 'Ver/Editar' : 'Añadir'}
                      </button>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {editingService?.nombre === servicio.nombre ? (
                      <input
                        type="number"
                        value={newService.sesiones}
                        onChange={(e) =>
                          setNewService({
                            ...newService,
                            sesiones: parseInt(e.target.value) || 1,
                          })
                        }
                        className="border rounded px-2 py-1 w-full focus:ring-blue-500 focus:border-blue-500"
                        min="1"
                        required
                      />
                    ) : (
                      servicio.sesiones
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {editingService?.nombre === servicio.nombre ? (
                      <textarea
                        value={newService.descripcion}
                        onChange={(e) =>
                          setNewService({
                            ...newService,
                            descripcion: e.target.value,
                          })
                        }
                        className="border rounded px-2 py-1 w-full focus:ring-blue-500 focus:border-blue-500"
                        rows={2}
                      />
                    ) : (
                      <div className="flex items-center">
                        <span className="max-w-xs truncate">{formatDescription(servicio.descripcion)}</span>
                        {servicio.descripcion && servicio.descripcion.length > 30 && (
                          <button
                            onClick={() => handleViewDescription(servicio.descripcion)}
                            className="ml-2 text-teal-600 hover:text-teal-800 focus:outline-none"
                            title="Ver descripción completa"
                          >
                            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                          </button>
                        )}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 space-x-2">
                    {editingService?.nombre === servicio.nombre ? (
                      <>
                        <button
                          onClick={handleSaveEdit}
                          className="text-blue-600 hover:text-blue-800 font-medium"
                        >
                          Guardar
                        </button>
                        <button
                          onClick={handleCancelEdit}
                          className="text-red-600 hover:text-red-800 font-medium"
                        >
                          Cancelar
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => handleEdit(servicio)}
                          className="text-blue-600 hover:text-blue-800 font-medium"
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => handleDelete(servicio)}
                          className="text-red-600 hover:text-red-800 font-medium"
                        >
                          Eliminar
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-white shadow-md rounded-lg p-6 mt-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Añadir Nuevo Servicio para Estadio</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Nombre del Servicio</label>
            <input
              type="text"
              value={newService.nombre}
              onChange={(e) => setNewService({ ...newService, nombre: e.target.value })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              placeholder="Ej: Limpieza Dental"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Precio Estimado (COP)</label>
            <input
              type="number"
              value={newService.precio || ''}
              onChange={(e) =>
                setNewService({ ...newService, precio: parseFloat(e.target.value) || 0 })
              }
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              min="0"
              step="1000"
              placeholder="Ej: 100000"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Número de Sesiones</label>
            <input
              type="number"
              value={newService.sesiones || 1}
              onChange={(e) =>
                setNewService({ ...newService, sesiones: parseInt(e.target.value) || 1 })
              }
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              min="1"
              placeholder="Ej: 1"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Descripción</label>
            <textarea
              value={newService.descripcion || ''}
              onChange={(e) => setNewService({ ...newService, descripcion: e.target.value })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              placeholder="Ej: Descripción del servicio"
              rows={3}
            />
          </div>
        </div>
        <button
          onClick={handleAddService}
          className="mt-4 px-4 py-2 bg-gradient-to-r from-teal-600 to-teal-700 text-white rounded-md hover:bg-teal-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          Añadir Servicio para Estadio
        </button>
      </div>

      {/* Modal de confirmación de eliminación */}
      {showDeleteModal && serviceToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md mx-4 transform transition-all">
            <div className="text-center">
              <svg 
                className="mx-auto h-12 w-12 text-red-500" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24" 
                xmlns="http://www.w3.org/2000/svg"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth="2" 
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                />
              </svg>
              <h3 className="mt-4 text-lg font-semibold text-gray-900">Confirmar eliminación</h3>
              <p className="mt-2 text-sm text-gray-600">
                ¿Estás seguro de que deseas eliminar el servicio de Estadio 
                <span className="font-medium text-gray-900"> "{serviceToDelete.nombre}"</span>?
                <br />
                Esta acción no se puede deshacer.
              </p>
            </div>
            <div className="mt-6 flex justify-center space-x-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-300"
              >
                Cancelar
              </button>
              <button
                onClick={confirmDelete}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal para mostrar la descripción completa */}
      {showDescriptionModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-lg mx-4 transform transition-all">
            <div className="mb-4 flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-900">Descripción completa</h3>
              <button
                onClick={() => setShowDescriptionModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="bg-gray-50 p-4 rounded-md">
              <p className="text-sm text-gray-700 whitespace-pre-wrap">{selectedDescription || 'Sin descripción'}</p>
            </div>
            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setShowDescriptionModal(false)}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-300"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal para gestionar insumos de laboratorio */}
      {showLabModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-4xl mx-4 transform transition-all">
            <div className="mb-4 flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-900">
                Gestionar Insumos de Laboratorio: {selectedService}
              </h3>
              <button
                onClick={() => setShowLabModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Formulario para agregar nuevo insumo */}
            <div className="mb-6 bg-gray-50 p-4 rounded-md">
              <h4 className="text-md font-medium text-gray-800 mb-3">Añadir Nuevo Insumo</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Nombre del Insumo</label>
                  <input
                    type="text"
                    value={newInsumo.nombre}
                    onChange={(e) => setNewInsumo({ ...newInsumo, nombre: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    placeholder="Ej: Material dental"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Costo (COP)</label>
                  <input
                    type="number"
                    value={newInsumo.costo || ''}
                    onChange={(e) => setNewInsumo({ ...newInsumo, costo: parseFloat(e.target.value) || 0 })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    min="0"
                    step="1000"
                    placeholder="Ej: 50000"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Descripción</label>
                  <input
                    type="text"
                    value={newInsumo.descripcion || ''}
                    onChange={(e) => setNewInsumo({ ...newInsumo, descripcion: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    placeholder="Ej: Descripción del insumo"
                  />
                </div>
              </div>
              <button
                onClick={handleAgregarInsumo}
                className="mt-3 px-4 py-2 bg-gradient-to-r from-teal-600 to-teal-700 text-white rounded-md hover:bg-teal-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                Añadir Insumo
              </button>
            </div>

            {/* Lista de insumos actuales */}
            <div className="overflow-x-auto">
              {loadingLabs ? (
                <div className="text-center py-4">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
                  <p className="mt-2 text-sm text-gray-600">Cargando insumos...</p>
                </div>
              ) : laboratorios.length === 0 ? (
                <div className="text-center py-4 text-gray-500">
                  No hay insumos de laboratorio registrados para este servicio.
                </div>
              ) : (
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Insumo</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Costo</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Descripción</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {laboratorios.map((lab) => (
                      <tr key={lab.id_laboratorio}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{lab.nombre_insumo}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatCOP(lab.costo)}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{lab.descripcion || 'N/A'}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <button
                            onClick={() => handleEliminarInsumo(lab.id_laboratorio, lab.costo)}
                            className="text-red-600 hover:text-red-800 font-medium"
                          >
                            Eliminar
                          </button>
                        </td>
                      </tr>
                    ))}
                    <tr className="bg-gray-50 font-medium">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">TOTAL</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-bold">
                        {formatCOP(laboratorios.reduce((sum, lab) => sum + lab.costo, 0))}
                      </td>
                      <td colSpan={2}></td>
                    </tr>
                  </tbody>
                </table>
              )}
            </div>
            
            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setShowLabModal(false)}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-300"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ServiciosEstadio;