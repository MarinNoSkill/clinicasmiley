import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { formatCOP, fetchServices } from '../data/constants';

interface Service {
  nombre: string;
  precio: number;
}

const EstandarizacionServicios: React.FC = () => {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [newService, setNewService] = useState<Service>({ nombre: '', precio: 0 });

  useEffect(() => {
    const loadServices = async () => {
      try {
        setLoading(true);
        const fetchedServices = await fetchServices();
        setServices(fetchedServices);
      } catch (err) {
        console.error('Error fetching services:', err);
        setError('Error al cargar los servicios. Por favor, intenta de nuevo.');
      } finally {
        setLoading(false);
      }
    };

    loadServices();
  }, []);

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
          `${import.meta.env.VITE_API_URL}/api/services`,
          {
            nombreOriginal: editingService.nombre,
            nombre: newService.nombre,
            precio: newService.precio,
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
        setNewService({ nombre: '', precio: 0 });
        setError('');
      } catch (err: any) {
        console.error('Error updating service:', err);
        setError(
          err.response?.data?.error || 'Error al guardar los cambios. Por favor, intenta de nuevo.'
        );
      }
    }
  };

  const handleDelete = async (service: Service) => {
    if (
      window.confirm(
        `¿Estás seguro de que deseas eliminar el servicio "${service.nombre}"?`
      )
    ) {
      try {
        await axios.delete(`${import.meta.env.VITE_API_URL}/api/services`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
          data: { nombre: service.nombre },
        });

        setServices(services.filter((s) => s.nombre !== service.nombre));
        setError('');
      } catch (err: any) {
        console.error('Error deleting service:', err);
        setError(
          err.response?.data?.error || 'Error al eliminar el servicio. Por favor, intenta de nuevo.'
        );
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
        `${import.meta.env.VITE_API_URL}/api/services`,
        newService,
        {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        }
      );

      setServices([...services, response.data]);
      setNewService({ nombre: '', precio: 0 });
      setError('');
    } catch (err: any) {
      console.error('Error adding service:', err);
      setError(
        err.response?.data?.error || 'Error al añadir el servicio. Por favor, intenta de nuevo.'
      );
    }
  };

  const handleCancelEdit = () => {
    setEditingService(null);
    setNewService({ nombre: '', precio: 0 });
    setError('');
  };

  if (loading) {
    return <div className="text-center py-6">Cargando servicios...</div>;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <h2 className="text-3xl font-bold text-gray-800 mb-4 ">Estandarización de Servicios - Clínica Smiley</h2>

      {error && (
        <div className="mb-6 p-4 bg-red-100 text-red-700 rounded-md">{error}</div>
      )}

      <div className="shadow-md rounded-lg p-2">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 mt-0 ">Lista de Servicios Estandarizados</h3>
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
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Añadir Nuevo Servicio</h3>
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
        </div>
        <button
          onClick={handleAddService}
          className="mt-4 px-4 py-2 bg-gradient-to-r from-teal-600 to-teal-700 text-white rounded-md hover:bg-teal-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          Añadir Servicio
        </button>
      </div>
    </div>
  );
};

export default EstandarizacionServicios;