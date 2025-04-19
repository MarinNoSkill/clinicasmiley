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
  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);
  const isAdminOrOwner = user && ['Dueño', 'Admin'].includes(user.usuario);

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
    setIsMenuOpen(false);
  };

  const handleChangeSede = () => {
    navigate('/sedes');
    setIsMenuOpen(false);
  };

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <nav className="bg-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <img
              src="/images/smileyface.webp"
              alt="Logo"
              className="h-12 w-20 rounded-full"
            />
            <span className="ml-2 text-xl font-semibold text-gray-900">Clínica Smiley</span>
          </div>
          <div className="flex items-center md:hidden">
            <button
              onClick={toggleMenu}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-700 hover:text-gray-900 hover:bg-gray-100 focus:outline-none"
              aria-expanded={isMenuOpen}
            >
              <span className="sr-only">Abrir menú principal</span>
              {isMenuOpen ? (
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" />
                </svg>
              )}
            </button>
          </div>
          <div className="hidden md:flex md:items-center md:space-x-8">
            <NavLink
              to="/"
              className={({ isActive }) =>
                `inline-flex items-center px-1 pt-1 text-sm font-medium ${
                  isActive ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'
                }`
              }
            >
              Registros
            </NavLink>
            {isAdminOrOwner && (
              <>
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
                  Servicios
                </NavLink>
                <NavLink
                  to="/historial"
                  className={({ isActive }) =>
                    `inline-flex items-center px-1 pt-1 text-sm font-medium ${
                      isActive ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'
                    }`
                  }
                >
                  Historial
                </NavLink>
              </>
            )}
            <NavLink
                  to="/gastos"
                  className={({ isActive }) =>
                    `inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                      isActive ? 'border-blue-500 text-gray-900' : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                    }`
                  }
                >
                  Gastos
            </NavLink>
            <NavLink
                  to="/HistorialGastos"
                  className={({ isActive }) =>
                    `inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                      isActive ? 'border-blue-500 text-gray-900' : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                    }`
                  }
                >
                  Historial gastos
            </NavLink>
            <div className="flex items-center space-x-2 px-1 pt-1">
              <span className="text-sm font-medium text-gray-700 ">
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
      {isMenuOpen && (
        <div className="md:hidden">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            <NavLink
              to="/"
              className={({ isActive }) =>
                `block px-3 py-2 rounded-md text-base font-medium ${
                  isActive ? 'text-blue-600 bg-blue-50' : 'text-gray-700 hover:text-gray-900 hover:bg-gray-50'
                }`
              }
              onClick={() => setIsMenuOpen(false)}
            >
              Registros
            </NavLink>
            {isAdminOrOwner && (
              <>
                <NavLink
                  to="/liquidacion"
                  className={({ isActive }) =>
                    `block px-3 py-2 rounded-md text-base font-medium ${
                      isActive ? 'text-blue-600 bg-blue-50' : 'text-gray-700 hover:text-gray-900 hover:bg-gray-50'
                    }`
                  }
                  onClick={() => setIsMenuOpen(false)}
                >
                  Liquidación
                </NavLink>
                <NavLink
                  to="/estandarizacion"
                  className={({ isActive }) =>
                    `block px-3 py-2 rounded-md text-base font-medium ${
                      isActive ? 'text-blue-600 bg-blue-50' : 'text-gray-700 hover:text-gray-900 hover:bg-gray-50'
                    }`
                  }
                  onClick={() => setIsMenuOpen(false)}
                >
                  Servicios
                </NavLink>
                <NavLink
                  to="/historial"
                  className={({ isActive }) =>
                    `block px-3 py-2 rounded-md text-base font-medium ${
                      isActive ? 'text-blue-600 bg-blue-50' : 'text-gray-700 hover:text-gray-900 hover:bg-gray-50'
                    }`
                  }
                  onClick={() => setIsMenuOpen(false)}
                >
                  Historial
                </NavLink>
                
              </>
            )}
            <NavLink
                    to="/gastos" 
                    className={({ isActive }) =>
                     `block px-3 py-2 rounded-md text-base font-medium ${
                       isActive ? 'bg-blue-50 text-blue-700' : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                     }`
                    }
                    onClick={() => setIsMenuOpen(false)}
                 >
                    Gastos 
            </NavLink>
            <div className="px-3 py-2 flex items-center space-x-2 ">
              <span className="text-base font-medium text-gray-700">
                Sede: {sedeActual}
              </span>
              <button
                onClick={handleChangeSede}
                className="text-base font-medium text-blue-500 hover:text-blue-700"
              >
                Cambiar
              </button>
            </div>
            {user && (
              <button
                onClick={handleLogout}
                className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-red-500 hover:text-red-700 hover:bg-gray-50"
              >
                Cerrar Sesión
              </button>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;