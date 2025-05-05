import React, { useState, useEffect, useRef } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
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
  const location = useLocation();
  const user = JSON.parse(localStorage.getItem('user') || 'null');
  const [sedeActual, setSedeActual] = useState<string>('Cargando...');
  const [isEstadioSede, setIsEstadioSede] = useState<boolean>(false);
  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState<boolean>(false);
  const [isLiquidacionMenuOpen, setIsLiquidacionMenuOpen] = useState<boolean>(false);
  const [isGastosMenuOpen, setIsGastosMenuOpen] = useState<boolean>(false);
  const [isServiciosMenuOpen, setIsServiciosMenuOpen] = useState<boolean>(false);
  const isAdminOrOwner = user && ['Dueño', 'Admin'].includes(user.usuario);
  
  const liquidacionRef = useRef<HTMLDivElement>(null);
  const gastosRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);
  const serviciosRef = useRef<HTMLDivElement>(null);

  // Verifica si la ruta actual pertenece al grupo de liquidación
  const isLiquidacionActive = ['/liquidacion', '/historial'].includes(location.pathname);
  
  // Verifica si la ruta actual pertenece al grupo de gastos
  const isGastosActive = ['/gastos', '/HistorialGastos'].includes(location.pathname);
  
  // Verifica si la ruta actual pertenece al grupo de servicios
  const isServiciosActive = ['/estandarizacion', '/gestion-laboratorios', '/servicios-estadio'].includes(location.pathname);

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
          setIsEstadioSede(sede.sede === 'Estadio');
        } else {
          setSedeActual('Desconocida');
          setIsEstadioSede(false);
        }
      } catch (err) {
        console.error('Error al obtener la sede actual:', err);
        setSedeActual('Error');
        setIsEstadioSede(false);
      }
    };

    fetchSedeActual();
  }, []);

  // Agrega un event listener para cerrar los menús cuando se hace clic fuera de ellos
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      if (liquidacionRef.current && !liquidacionRef.current.contains(event.target as Node)) {
        setIsLiquidacionMenuOpen(false);
      }
      if (gastosRef.current && !gastosRef.current.contains(event.target as Node)) {
        setIsGastosMenuOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setIsProfileMenuOpen(false);
      }
      if (serviciosRef.current && !serviciosRef.current.contains(event.target as Node)) {
        setIsServiciosMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside); // Añadir soporte para eventos táctiles
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside); // Limpiar eventos táctiles
    };
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('selectedSede');
    onLogout();
    navigate('/sedes');
    setIsMenuOpen(false);
    setIsProfileMenuOpen(false);
  };

  const handleChangeSede = () => {
    navigate('/sedes');
    setIsMenuOpen(false);
    setIsProfileMenuOpen(false);
  };

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const toggleProfileMenu = () => {
    setIsProfileMenuOpen(!isProfileMenuOpen);
  };

  const toggleLiquidacionMenu = () => {
    setIsLiquidacionMenuOpen(!isLiquidacionMenuOpen);
    if (isGastosMenuOpen) setIsGastosMenuOpen(false);
    if (isServiciosMenuOpen) setIsServiciosMenuOpen(false);
  };

  const toggleGastosMenu = () => {
    setIsGastosMenuOpen(!isGastosMenuOpen);
    if (isLiquidacionMenuOpen) setIsLiquidacionMenuOpen(false);
    if (isServiciosMenuOpen) setIsServiciosMenuOpen(false);
  };

  const toggleServiciosMenu = () => {
    setIsServiciosMenuOpen(!isServiciosMenuOpen);
    if (isLiquidacionMenuOpen) setIsLiquidacionMenuOpen(false);
    if (isGastosMenuOpen) setIsGastosMenuOpen(false);
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
                {/* Menú desplegable de Liquidación */}
                <div className="relative" ref={liquidacionRef}>
                  <button
                    onClick={toggleLiquidacionMenu}
                    className={`inline-flex items-center px-1 pt-1 text-sm font-medium ${
                      isLiquidacionActive ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    Liquidación
                    <svg
                      className="ml-2 h-5 w-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </button>
                  {isLiquidacionMenuOpen && (
                    <div className="absolute left-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-10">
                      <NavLink
                        to="/liquidacion"
                        className={({ isActive }) =>
                          `block px-4 py-2 text-sm ${
                            isActive ? 'text-blue-600 bg-blue-50' : 'text-gray-700 hover:text-gray-900 hover:bg-gray-50'
                          }`
                        }
                        onClick={() => setIsLiquidacionMenuOpen(false)}
                      >
                        Liquidación
                      </NavLink>
                      <NavLink
                        to="/historial"
                        className={({ isActive }) =>
                          `block px-4 py-2 text-sm ${
                            isActive ? 'text-blue-600 bg-blue-50' : 'text-gray-700 hover:text-gray-900 hover:bg-gray-50'
                          }`
                        }
                        onClick={() => setIsLiquidacionMenuOpen(false)}
                      >
                        Historial Liquidación
                      </NavLink>
                    </div>
                  )}
                </div>

                {/* Menú desplegable de Servicios */}
                <div className="relative" ref={serviciosRef}>
                  <button
                    onClick={toggleServiciosMenu}
                    className={`inline-flex items-center px-1 pt-1 text-sm font-medium ${
                      isServiciosActive ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    Servicios
                    <svg
                      className="ml-2 h-5 w-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </button>
                  {isServiciosMenuOpen && (
                    <div className="absolute left-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-10">
                      <NavLink
                        to="/estandarizacion"
                        className={({ isActive }) =>
                          `block px-4 py-2 text-sm ${
                            isActive ? 'text-blue-600 bg-blue-50' : 'text-gray-700 hover:text-gray-900 hover:bg-gray-50'
                          }`
                        }
                        onClick={() => setIsServiciosMenuOpen(false)}
                      >
                        Estandarización
                      </NavLink>
                      <NavLink
                        to="/gestion-laboratorios"
                        className={({ isActive }) =>
                          `block px-4 py-2 text-sm ${
                            isActive ? 'text-blue-600 bg-blue-50' : 'text-gray-700 hover:text-gray-900 hover:bg-gray-50'
                          }`
                        }
                        onClick={() => setIsServiciosMenuOpen(false)}
                      >
                        Laboratorios
                      </NavLink>
                      {isEstadioSede && (
                        <NavLink
                          to="/servicios-estadio"
                          className={({ isActive }) =>
                            `block px-4 py-2 text-sm ${
                              isActive ? 'text-blue-600 bg-blue-50' : 'text-gray-700 hover:text-gray-900 hover:bg-gray-50'
                            }`
                          }
                          onClick={() => setIsServiciosMenuOpen(false)}
                        >
                          Servicios Estadio
                        </NavLink>
                      )}
                    </div>
                  )}
                </div>
              </>
            )}
            
            {/* Menú desplegable de Gastos */}
            <div className="relative" ref={gastosRef}>
              <button
                onClick={toggleGastosMenu}
                className={`inline-flex items-center px-1 pt-1 text-sm font-medium ${
                  isGastosActive ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Gastos
                <svg
                  className="ml-2 h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </button>
              {isGastosMenuOpen && (
                <div className="absolute left-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-10">
                  <NavLink
                    to="/gastos"
                    className={({ isActive }) =>
                      `block px-4 py-2 text-sm ${
                        isActive ? 'text-blue-600 bg-blue-50' : 'text-gray-700 hover:text-gray-900 hover:bg-gray-50'
                      }`
                    }
                    onClick={() => setIsGastosMenuOpen(false)}
                  >
                    Registro de Gastos
                  </NavLink>
                  <NavLink
                    to="/HistorialGastos"
                    className={({ isActive }) =>
                      `block px-4 py-2 text-sm ${
                        isActive ? 'text-blue-600 bg-blue-50' : 'text-gray-700 hover:text-gray-900 hover:bg-gray-50'
                      }`
                    }
                    onClick={() => setIsGastosMenuOpen(false)}
                  >
                    Historial Gastos
                  </NavLink>
                </div>
              )}
            </div>
            
            {/* Menú de perfil */}
            {user && (
              <div className="relative" ref={profileRef}>
                <button
                  onClick={toggleProfileMenu}
                  className="inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-700 hover:text-gray-900 focus:outline-none"
                >
                  {user.nombre || 'Usuario'}
                  <svg
                    className="ml-2 h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </button>
                {isProfileMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-10">
                    <div className="px-4 py-2 text-sm text-gray-700 flex items-center justify-between">
                      <span>Sede: {sedeActual}</span>
                      <button
                        onClick={handleChangeSede}
                        className="text-blue-500 hover:text-blue-700"
                      >
                        Cambiar
                      </button>
                    </div>
                    <button
                      onClick={handleLogout}
                      className="block w-full text-left px-4 py-2 text-sm text-red-500 hover:text-red-700 hover:bg-gray-50"
                    >
                      Cerrar Sesión
                    </button>
                  </div>
                )}
              </div>
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
                {/* Menú de Liquidación en móvil */}
                <div className="relative">
                  <button
                    onClick={toggleLiquidacionMenu}
                    className={`flex w-full justify-between px-3 py-2 rounded-md text-base font-medium ${
                      isLiquidacionActive ? 'text-blue-600 bg-blue-50' : 'text-gray-700 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                  >
                    <span>Liquidación</span>
                    <svg
                      className="h-5 w-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d={isLiquidacionMenuOpen ? "M5 15l7-7 7 7" : "M19 9l-7 7-7-7"}
                      />
                    </svg>
                  </button>
                  {isLiquidacionMenuOpen && (
                    <div className="pl-4">
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
                        to="/historial"
                        className={({ isActive }) =>
                          `block px-3 py-2 rounded-md text-base font-medium ${
                            isActive ? 'text-blue-600 bg-blue-50' : 'text-gray-700 hover:text-gray-900 hover:bg-gray-50'
                          }`
                        }
                        onClick={() => setIsMenuOpen(false)}
                      >
                        Historial Liquidación
                      </NavLink>
                    </div>
                  )}
                </div>

                {/* Menú de Servicios en móvil */}
                <div className="relative">
                  <button
                    onClick={toggleServiciosMenu}
                    className={`flex w-full justify-between px-3 py-2 rounded-md text-base font-medium ${
                      isServiciosActive ? 'text-blue-600 bg-blue-50' : 'text-gray-700 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                  >
                    <span>Servicios</span>
                    <svg
                      className="h-5 w-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d={isServiciosMenuOpen ? "M5 15l7-7 7 7" : "M19 9l-7 7-7-7"}
                      />
                    </svg>
                  </button>
                  {isServiciosMenuOpen && (
                    <div className="pl-4">
                      <NavLink
                        to="/estandarizacion"
                        className={({ isActive }) =>
                          `block px-3 py-2 rounded-md text-base font-medium ${
                            isActive ? 'text-blue-600 bg-blue-50' : 'text-gray-700 hover:text-gray-900 hover:bg-gray-50'
                          }`
                        }
                        onClick={() => setIsMenuOpen(false)}
                      >
                        Estandarización
                      </NavLink>
                      <NavLink
                        to="/gestion-laboratorios"
                        className={({ isActive }) =>
                          `block px-3 py-2 rounded-md text-base font-medium ${
                            isActive ? 'text-blue-600 bg-blue-50' : 'text-gray-700 hover:text-gray-900 hover:bg-gray-50'
                          }`
                        }
                        onClick={() => setIsMenuOpen(false)}
                      >
                        Laboratorios
                      </NavLink>
                      {isEstadioSede && (
                        <NavLink
                          to="/servicios-estadio"
                          className={({ isActive }) =>
                            `block px-3 py-2 rounded-md text-base font-medium ${
                              isActive ? 'text-blue-600 bg-blue-50' : 'text-gray-700 hover:text-gray-900 hover:bg-gray-50'
                            }`
                          }
                          onClick={() => setIsMenuOpen(false)}
                        >
                          Servicios Estadio
                        </NavLink>
                      )}
                    </div>
                  )}
                </div>
              </>
            )}
            
            {/* Menú de Gastos en móvil */}
            <div className="relative">
              <button
                onClick={toggleGastosMenu}
                className={`flex w-full justify-between px-3 py-2 rounded-md text-base font-medium ${
                  isGastosActive ? 'text-blue-600 bg-blue-50' : 'text-gray-700 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                <span>Gastos</span>
                <svg
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d={isGastosMenuOpen ? "M5 15l7-7 7 7" : "M19 9l-7 7-7-7"}
                  />
                </svg>
              </button>
              {isGastosMenuOpen && (
                <div className="pl-4">
                  <NavLink
                    to="/gastos"
                    className={({ isActive }) =>
                      `block px-3 py-2 rounded-md text-base font-medium ${
                        isActive ? 'text-blue-600 bg-blue-50' : 'text-gray-700 hover:text-gray-900 hover:bg-gray-50'
                      }`
                    }
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Registro de Gastos
                  </NavLink>
                  <NavLink
                    to="/HistorialGastos"
                    className={({ isActive }) =>
                      `block px-3 py-2 rounded-md text-base font-medium ${
                        isActive ? 'text-blue-600 bg-blue-50' : 'text-gray-700 hover:text-gray-900 hover:bg-gray-50'
                      }`
                    }
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Historial Gastos
                  </NavLink>
                </div>
              )}
            </div>
            
            <div className="px-3 py-2 flex items-center space-x-2">
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