import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import axios from 'axios';

interface NavbarProps {
  onLogout: () => void;
}

interface Sede {
  id_sede: number;
  sede: string;
}

const Navbar: React.FC<NavbarProps> = ({ onLogout }) => {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || 'null');
  const [sedeActual, setSedeActual] = useState<string>('Cargando...');

  // Obtener el nombre de la sede actual desde el backend
  useEffect(() => {
    const fetchSedeActual = async () => {
      try {
        const id_sede = localStorage.getItem('selectedSede');
        if (!id_sede) {
          setSedeActual('No seleccionada');
          return;
        }

        const response = await axios.get<Sede[]>(
          `${import.meta.env.VITE_API_URL}/api/sedes`,
          {
            headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
          }
        );

        const sede = response.data.find((s) => s.id_sede === parseInt(id_sede, 10));
        if (sede) {
          setSedeActual(sede.sede);
        } else {
          setSedeActual('Desconocida');
        }
      } catch (err) {
        console.error('Error al obtener la sede actual:', err);
        setSedeActual('Error');
      }
    };

    fetchSedeActual();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('selectedSede');
    onLogout();
    navigate('/sedes');
  };

  const handleChangeSede = () => {
    navigate('/sedes');
  };

  return (
    <nav className="bg-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <img
              src="/images/smileyface.webp"
              alt="Logo"
              className="h-14 w-24 rounded-full"
            />
            <span className="ml-2 text-xl font-semibold text-gray-900">Clínica Smiley</span>
          </div>
          <div className="flex items-center space-x-8">
            <NavLink
              to="/"
              className={({ isActive }) =>
                `inline-flex items-center px-1 pt-1 text-sm font-medium ${
                  isActive ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'
                }`
              }
            >
              Registros Diarios
            </NavLink>
            <NavLink
              to="/liquidacion"
              className={({ isActive }) =>
                `inline-flex items-center px-1 pt-1 text-sm font-medium ${
                  isActive ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'
                }`
              }
            >
              Liquidación
            </NavLink>
            <NavLink
              to="/estandarizacion"
              className={({ isActive }) =>
                `inline-flex items-center px-1 pt-1 text-sm font-medium ${
                  isActive ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'
                }`
              }
            >
              Estandarización de Servicios
            </NavLink>
            <NavLink
              to="/historial"
              className={({ isActive }) =>
                `inline-flex items-center px-1 pt-1 text-sm font-medium ${
                  isActive ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'
                }`
              }
            >
              Historial de Liquidaciones
            </NavLink>
            {/* Mostrar la sede actual y opción para cambiarla */}
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium text-gray-700">
                Sede: {sedeActual}
              </span>
              <button
                onClick={handleChangeSede}
                className="text-sm font-medium text-blue-500 hover:text-blue-700"
              >
                Cambiar
              </button>
            </div>
            {user && (
              <button
                onClick={handleLogout}
                className="inline-flex items-center px-1 pt-1 text-sm font-medium text-red-500 hover:text-red-700"
              >
                Cerrar Sesión
              </button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;