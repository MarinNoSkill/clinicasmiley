import { useState, useEffect } from 'react';
import axios from 'axios';

interface Doctor {
  id: number;
  nombre_doc: string;
  id_sede: number;
  id_rol: number;
}

interface Auxiliar {
  id: number;
  nombre_aux: string;
  id_porc: number;
  id_rol: number;
  id_user: number;
  id_sede: number;
}

interface Sede {
  id_sede: number;
  sede: string;
}

interface Rol {
  id_rol: number;
  descrip_rol: string;
}

const GestionPersonal = () => {
  const [tabIndex, setTabIndex] = useState(0);
  const [doctores, setDoctores] = useState<Doctor[]>([]);
  const [auxiliares, setAuxiliares] = useState<Auxiliar[]>([]);
  const [sedes, setSedes] = useState<Sede[]>([]);
  const [roles, setRoles] = useState<Rol[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Modal state
  const [isOpen, setIsOpen] = useState(false);
  const [modalTitle, setModalTitle] = useState('');
  const [currentItem, setCurrentItem] = useState<Doctor | Auxiliar | null>(null);
  const [formValues, setFormValues] = useState<any>({
    nombre: '',
    id_sede: 0,
    id_rol: 0,
    id_porc: 0,
    id_user: 0
  });

  // Cargar datos iniciales
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        // Asegurarse que la solicitud tiene el token en los headers
        const token = localStorage.getItem('token');
        const headers = {
          Authorization: `Bearer ${token}`
        };
        
        // Usamos valores fijos para roles (1: Doctor, 2: Auxiliar)
        const rolesData = [
          { id_rol: 1, descrip_rol: 'Doctores' },
          { id_rol: 2, descrip_rol: 'Auxiliares' }
        ];
        
        const [doctoresRes, auxiliaresRes, sedesRes] = await Promise.all([
          axios.get(`${import.meta.env.VITE_API_URL}/api/personal/doctores`, { headers }),
          axios.get(`${import.meta.env.VITE_API_URL}/api/personal/auxiliares`, { headers }),
          axios.get(`${import.meta.env.VITE_API_URL}/api/sedes`, { headers })
        ]);

        console.log('Respuesta de sedes sin procesar:', sedesRes.data);
        console.log('Respuesta de doctores sin procesar:', doctoresRes.data);
        console.log('Respuesta de auxiliares sin procesar:', auxiliaresRes.data);

        // Conversión explícita de tipos para solucionar errores de TypeScript
        setDoctores(Array.isArray(doctoresRes.data) ? doctoresRes.data as Doctor[] : []);
        setAuxiliares(Array.isArray(auxiliaresRes.data) ? auxiliaresRes.data as Auxiliar[] : []);
        setSedes(Array.isArray(sedesRes.data) ? sedesRes.data as Sede[] : []);
        setRoles(rolesData as Rol[]);
        
        console.log('Datos cargados:', { 
          doctores: doctoresRes.data, 
          auxiliares: auxiliaresRes.data, 
          sedes: sedesRes.data, 
          roles: rolesData 
        });
      } catch (error: any) {
        console.error('Error al cargar datos:', error.response || error);
        setError(`No se pudo cargar la información: ${error.response?.data?.message || error.message}. Por favor, intente nuevamente.`);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleTabChange = (index: number) => {
    setTabIndex(index);
  };

  const openModal = (item?: Doctor | Auxiliar, isDoctor: boolean = true) => {
    // Obtener la sede actual del usuario
    const sedeActualId = parseInt(localStorage.getItem('selectedSede') || '0', 10);
    
    if (item) {
      console.log(`Abriendo modal para ${isDoctor ? 'doctor' : 'auxiliar'} existente:`, item);
      setModalTitle(isDoctor ? 'Editar Doctor' : 'Editar Auxiliar');
      setCurrentItem(item);
      setFormValues({
        nombre: isDoctor ? (item as Doctor).nombre_doc : (item as Auxiliar).nombre_aux,
        id_sede: item.id_sede,
        id_rol: item.id_rol,
        ...(isDoctor ? {} : {
          id_porc: (item as Auxiliar).id_porc,
          id_user: (item as Auxiliar).id_user
        })
      });
    } else {
      console.log(`Abriendo modal para crear nuevo ${isDoctor ? 'doctor' : 'auxiliar'}`);
      setModalTitle(isDoctor ? 'Agregar Doctor' : 'Agregar Auxiliar');
      setCurrentItem(null);
      setFormValues({
        nombre: '',
        id_sede: sedeActualId, // Usar la sede actual del usuario
        id_rol: isDoctor ? 1 : 2, // Asignar el rol correspondiente automáticamente
        id_porc: 0,
        id_user: 3 // Valor fijo como indicaste
      });
    }
    setIsOpen(true);
  };

  const closeModal = () => {
    setIsOpen(false);
    setCurrentItem(null);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormValues({
      ...formValues,
      [name]: name === 'nombre' ? value : Number(value)
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const isDoctor = tabIndex === 0;
      const endpoint = isDoctor ? 'doctores' : 'auxiliares';
      
      // Usar el token en los headers
      const token = localStorage.getItem('token');
      const headers = {
        Authorization: `Bearer ${token}`
      };
      
      const payload = isDoctor
        ? {
            nombre_doc: formValues.nombre,
            id_sede: formValues.id_sede,
            id_rol: formValues.id_rol
          }
        : {
            nombre_aux: formValues.nombre,
            id_sede: formValues.id_sede,
            id_rol: formValues.id_rol,
            id_porc: formValues.id_porc,
            id_user: formValues.id_user
          };

      console.log('Enviando payload:', payload);

      if (currentItem && currentItem.id) {
        // Actualizar
        console.log(`Actualizando ${isDoctor ? 'doctor' : 'auxiliar'} con ID: ${currentItem.id}`);
        const response = await axios.put(
          `${import.meta.env.VITE_API_URL}/api/personal/${endpoint}/${currentItem.id}`,
          payload,
          { headers }
        );
        
        console.log('Respuesta al actualizar:', response.data);
        
        // Asegurarse de que el id está presente y se usa correctamente
        if (isDoctor) {
          const updatedDoctor: Doctor = {
            id: currentItem.id,
            nombre_doc: formValues.nombre,
            id_sede: formValues.id_sede,
            id_rol: formValues.id_rol
          };
          setDoctores(doctores.map(doc => doc.id === currentItem.id ? updatedDoctor : doc));
        } else {
          const updatedAuxiliar: Auxiliar = {
            id: currentItem.id,
            nombre_aux: formValues.nombre,
            id_sede: formValues.id_sede,
            id_rol: formValues.id_rol,
            id_porc: formValues.id_porc,
            id_user: formValues.id_user
          };
          setAuxiliares(auxiliares.map(aux => aux.id === currentItem.id ? updatedAuxiliar : aux));
        }

        setSuccessMessage(`${isDoctor ? 'Doctor' : 'Auxiliar'} actualizado correctamente.`);
      } else {
        // Crear nuevo
        console.log(`Creando nuevo ${isDoctor ? 'doctor' : 'auxiliar'}`);
        const response = await axios.post(
          `${import.meta.env.VITE_API_URL}/api/personal/${endpoint}`,
          payload,
          { headers }
        );
        
        const responseData: any = response.data;
        console.log('Respuesta al crear:', responseData);
        
        // Asegurarse de que podemos obtener el ID del nuevo elemento
        let newId: number;
        
        if (Array.isArray(responseData) && responseData.length > 0) {
          newId = responseData[0].id;
        } else if (responseData && typeof responseData === 'object') {
          newId = responseData.id;
        } else {
          console.error('No se pudo determinar el ID del nuevo elemento');
          throw new Error('Respuesta de API inválida: no se pudo determinar el ID');
        }
        
        // Crear un nuevo objeto con la estructura correcta
        if (isDoctor) {
          const newDoctor: Doctor = {
            id: newId,
            nombre_doc: formValues.nombre,
            id_sede: formValues.id_sede,
            id_rol: formValues.id_rol
          };
          setDoctores([...doctores, newDoctor]);
        } else {
          const newAuxiliar: Auxiliar = {
            id: newId,
            nombre_aux: formValues.nombre,
            id_sede: formValues.id_sede,
            id_rol: formValues.id_rol,
            id_porc: formValues.id_porc,
            id_user: formValues.id_user
          };
          setAuxiliares([...auxiliares, newAuxiliar]);
        }

        setSuccessMessage(`${isDoctor ? 'Doctor' : 'Auxiliar'} agregado correctamente.`);
      }

      closeModal();
      
      // Limpiar mensaje de éxito después de 3 segundos
      setTimeout(() => {
        setSuccessMessage(null);
      }, 3000);
    } catch (error: any) {
      console.error('Error:', error.response || error);
      setError(`No se pudo guardar la información: ${error.response?.data?.message || error.message}. Por favor, intente nuevamente.`);
      
      // Limpiar mensaje de error después de 5 segundos
      setTimeout(() => {
        setError(null);
      }, 5000);
    }
  };

  const handleDelete = async (id: number | undefined, isDoctor: boolean = true) => {
    // Verificar que el ID exista y sea válido
    if (!id) {
      console.error(`Error: ID ${id} no es válido para eliminar`);
      setError('No se pudo eliminar: ID no válido. Por favor, intente nuevamente.');
      setTimeout(() => setError(null), 5000);
      return;
    }
    
    console.log(`Intentando eliminar ${isDoctor ? 'doctor' : 'auxiliar'} con ID:`, id);
    
    if (window.confirm(`¿Está seguro que desea eliminar este ${isDoctor ? 'doctor' : 'auxiliar'}?`)) {
      try {
        const endpoint = isDoctor ? 'doctores' : 'auxiliares';
        
        // Usar el token en los headers
        const token = localStorage.getItem('token');
        const headers = {
          Authorization: `Bearer ${token}`
        };
        
        console.log(`Enviando solicitud DELETE a ${import.meta.env.VITE_API_URL}/api/personal/${endpoint}/${id}`);
        
        const response = await axios.delete(
          `${import.meta.env.VITE_API_URL}/api/personal/${endpoint}/${id}`, 
          { headers }
        );
        
        console.log('Respuesta al eliminar:', response.data);
        
        if (isDoctor) {
          setDoctores(doctores.filter(doc => doc.id !== id));
        } else {
          setAuxiliares(auxiliares.filter(aux => aux.id !== id));
        }

        setSuccessMessage(`${isDoctor ? 'Doctor' : 'Auxiliar'} eliminado correctamente.`);
        
        // Limpiar mensaje de éxito después de 3 segundos
        setTimeout(() => {
          setSuccessMessage(null);
        }, 3000);
      } catch (error: any) {
        console.error('Error:', error.response || error);
        setError(`No se pudo eliminar: ${error.response?.data?.message || error.message}. Por favor, intente nuevamente.`);
        
        // Limpiar mensaje de error después de 5 segundos
        setTimeout(() => {
          setError(null);
        }, 5000);
      }
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="text-center py-6 text-gray-500">Cargando datos...</div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h2 className="text-3xl font-bold text-gray-800 mb-8">Gestión de Personal</h2>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}
      
      {successMessage && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
          {successMessage}
        </div>
      )}
      
      <div className="bg-white shadow-md rounded-lg p-5 mb-6">
        <div className="flex border-b mb-4">
          <button 
            className={`py-2 px-4 ${tabIndex === 0 ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-600 hover:text-gray-800'}`}
            onClick={() => handleTabChange(0)}
          >
            Doctores
          </button>
          <button 
            className={`py-2 px-4 ${tabIndex === 1 ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-600 hover:text-gray-800'}`}
            onClick={() => handleTabChange(1)}
          >
            Auxiliares
          </button>
        </div>

        <div className="flex justify-end mb-4">
          <button 
            onClick={() => openModal(undefined, tabIndex === 0)}
            className="flex items-center px-3 py-1.5 rounded-md text-white font-medium bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-700 hover:to-teal-800 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 transition-colors duration-200 text-sm"
          >
            <svg 
              className="w-4 h-4 mr-2" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24" 
              xmlns="http://www.w3.org/2000/svg"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M12 6v6m0 0v6m0-6h6m-6 0H6" 
              />
            </svg>
            Agregar {tabIndex === 0 ? 'Doctor' : 'Auxiliar'}
          </button>
        </div>
        
        <div className="overflow-x-auto">
          {tabIndex === 0 ? (
            <table className="min-w-full divide-y divide-gray-100">
              <thead className="bg-gray-50">
                <tr key="doctores-header">
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Nombre</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Sede</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Rol</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {doctores.map((doctor, index) => {
                  console.log(`Renderizando doctor ${index}:`, doctor);
                  return (
                    <tr key={doctor.id ? `doctor-${doctor.id}` : `doctor-index-${index}`} className={`${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-gray-100 transition-colors duration-150`}>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">{doctor.nombre_doc}</td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">
                        {sedes.find(sede => sede.id_sede === doctor.id_sede)?.sede || doctor.id_sede}
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">
                        {roles.find(rol => rol.id_rol === doctor.id_rol)?.descrip_rol || doctor.id_rol}
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => {
                            console.log('Editando doctor:', doctor);
                            openModal(doctor, true);
                          }}
                          className="text-indigo-600 hover:text-indigo-900 mr-3"
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => {
                            console.log('Eliminando doctor ID:', doctor.id);
                            handleDelete(doctor.id, true);
                          }}
                          className="text-red-600 hover:text-red-900"
                        >
                          Eliminar
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : (
            <table className="min-w-full divide-y divide-gray-100">
              <thead className="bg-gray-50">
                <tr key="auxiliares-header">
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Nombre</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Sede</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Rol</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Porcentaje</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {auxiliares.map((auxiliar, index) => {
                  console.log(`Renderizando auxiliar ${index}:`, auxiliar);
                  return (
                    <tr key={auxiliar.id ? `auxiliar-${auxiliar.id}` : `auxiliar-index-${index}`} className={`${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-gray-100 transition-colors duration-150`}>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">{auxiliar.nombre_aux}</td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">
                        {sedes.find(sede => sede.id_sede === auxiliar.id_sede)?.sede || auxiliar.id_sede}
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">
                        {roles.find(rol => rol.id_rol === auxiliar.id_rol)?.descrip_rol || auxiliar.id_rol}
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">{auxiliar.id_porc}</td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => {
                            console.log('Editando auxiliar:', auxiliar);
                            openModal(auxiliar, false);
                          }}
                          className="text-indigo-600 hover:text-indigo-900 mr-3"
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => {
                            console.log('Eliminando auxiliar ID:', auxiliar.id);
                            handleDelete(auxiliar.id, false);
                          }}
                          className="text-red-600 hover:text-red-900"
                        >
                          Eliminar
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Modal para agregar/editar */}
      {isOpen && (
        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>

            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <form onSubmit={handleSubmit}>
                <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                  <div className="sm:flex sm:items-start">
                    <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                      <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                        {modalTitle}
                      </h3>
                      <div className="mt-2 space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
                          <input 
                            type="text"
                            name="nombre" 
                            value={formValues.nombre} 
                            onChange={handleInputChange}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-teal-500 focus:ring-teal-500 text-sm p-1.5"
                            required
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Sede</label>
                          <select 
                            name="id_sede" 
                            value={formValues.id_sede} 
                            onChange={handleInputChange}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-teal-500 focus:ring-teal-500 text-sm p-1.5"
                            required
                          >
                            {sedes.map((sede, index) => (
                              <option key={`sede-${sede.id_sede || index}`} value={sede.id_sede}>
                                {sede.sede}
                              </option>
                            ))}
                          </select>
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Rol</label>
                          <select 
                            name="id_rol" 
                            value={formValues.id_rol} 
                            onChange={handleInputChange}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-teal-500 focus:ring-teal-500 text-sm p-1.5"
                            required
                          >
                            {roles.map((rol, index) => (
                              <option key={`rol-${rol.id_rol || index}`} value={rol.id_rol}>
                                {rol.descrip_rol || `Rol ${rol.id_rol}`}
                              </option>
                            ))}
                          </select>
                        </div>

                        {tabIndex === 1 && (
                          <>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Porcentaje</label>
                              <input 
                                type="number" 
                                name="id_porc" 
                                value={formValues.id_porc} 
                                onChange={handleInputChange}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-teal-500 focus:ring-teal-500 text-sm p-1.5"
                                required
                              />
                            </div>
                            
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Usuario</label>
                              <input 
                                type="number" 
                                name="id_user" 
                                value={formValues.id_user} 
                                onChange={handleInputChange}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-teal-500 focus:ring-teal-500 text-sm p-1.5"
                                required
                              />
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                  <button
                    type="submit"
                    className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-teal-600 text-base font-medium text-white hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 sm:ml-3 sm:w-auto sm:text-sm"
                  >
                    Guardar
                  </button>
                  <button
                    type="button"
                    onClick={closeModal}
                    className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GestionPersonal;
