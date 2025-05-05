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
  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false); // Estado principal del menú móvil
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState<boolean>(false); // Menú perfil (escritorio)
  // Estados para los menús desplegables de ESCRITORIO
  const [isLiquidacionMenuOpen, setIsLiquidacionMenuOpen] = useState<boolean>(false);
  const [isGastosMenuOpen, setIsGastosMenuOpen] = useState<boolean>(false);
  const [isServiciosMenuOpen, setIsServiciosMenuOpen] = useState<boolean>(false);
  const isAdminOrOwner = user && ['Dueño', 'Admin'].includes(user.usuario);

  // Refs para detectar clics fuera (solo necesarios para escritorio ahora)
  const liquidacionRef = useRef<HTMLDivElement>(null);
  const gastosRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);
  const serviciosRef = useRef<HTMLDivElement>(null);
  const mobileMenuRef = useRef<HTMLDivElement>(null);
  const mobileMenuButtonRef = useRef<HTMLButtonElement>(null);

  // Verificadores de ruta activa (solo para resaltar en escritorio)
  const isLiquidacionActive = ['/liquidacion', '/historial'].includes(location.pathname);
  const isGastosActive = ['/gastos', '/HistorialGastos'].includes(location.pathname);
  const isServiciosActive = ['/estandarizacion', '/gestion-laboratorios', '/servicios-estadio'].includes(location.pathname);

  // Cierra todos los menús desplegables y el menú móvil
  const closeAllMenus = () => {
    setIsMenuOpen(false);
    setIsProfileMenuOpen(false);
    setIsLiquidacionMenuOpen(false);
    setIsGastosMenuOpen(false);
    setIsServiciosMenuOpen(false);
  };

  // Función para navegar y cerrar todos los menús
  const handleNavigation = (path: string) => {
    navigate(path);
    closeAllMenus();
  };


  // Cerrar todos los menús cuando cambia la ruta
  useEffect(() => {
    closeAllMenus();
  }, [location.pathname]);

  // Fetch de la sede actual
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
          { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
        );
        const sede = response.data.find((s) => s.id_sede === parseInt(id_sede, 10));
        if (sede) {
          setSedeActual(sede.sede);
          setIsEstadioSede(sede.sede === 'Estadio');
        } else {
          setSedeActual('Desconocida'); setIsEstadioSede(false);
        }
      } catch (err) {
        console.error('Error al obtener la sede actual:', err);
        setSedeActual('Error'); setIsEstadioSede(false);
      }
    };
    fetchSedeActual();
  }, []);

  // Clic fuera para cerrar menús
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      if (!(event.target instanceof Node)) return;

      // Cerrar menús desplegables de ESCRITORIO
      if (liquidacionRef.current && !liquidacionRef.current.contains(event.target)) setIsLiquidacionMenuOpen(false);
      if (gastosRef.current && !gastosRef.current.contains(event.target)) setIsGastosMenuOpen(false);
      if (profileRef.current && !profileRef.current.contains(event.target)) setIsProfileMenuOpen(false);
      if (serviciosRef.current && !serviciosRef.current.contains(event.target)) setIsServiciosMenuOpen(false);

      // Cerrar menú MÓVIL
      if (
        isMenuOpen &&
        mobileMenuRef.current && !mobileMenuRef.current.contains(event.target) &&
        mobileMenuButtonRef.current && !mobileMenuButtonRef.current.contains(event.target)
      ) {
        closeAllMenus(); // Cierra el menú móvil y asegura que los de escritorio estén cerrados
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [isMenuOpen]);

  const handleLogout = () => {
    localStorage.removeItem('token'); localStorage.removeItem('user'); localStorage.removeItem('selectedSede');
    onLogout();
    navigate('/sedes');
    closeAllMenus();
  };

  const handleChangeSede = () => {
    navigate('/sedes');
    closeAllMenus();
  };

  // Solo para el menú principal móvil
  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  // Para el menú desplegable de PERFIL (escritorio)
  const toggleProfileMenu = () => {
    setIsProfileMenuOpen(prev => !prev);
    setIsLiquidacionMenuOpen(false); setIsGastosMenuOpen(false); setIsServiciosMenuOpen(false);
  };

  // Para el menú desplegable de LIQUIDACIÓN (escritorio)
  const toggleLiquidacionMenu = () => {
    setIsLiquidacionMenuOpen(prev => !prev);
    setIsGastosMenuOpen(false); setIsServiciosMenuOpen(false); setIsProfileMenuOpen(false);
  };

  // Para el menú desplegable de GASTOS (escritorio)
  const toggleGastosMenu = () => {
    setIsGastosMenuOpen(prev => !prev);
    setIsLiquidacionMenuOpen(false); setIsServiciosMenuOpen(false); setIsProfileMenuOpen(false);
  };

  // Para el menú desplegable de SERVICIOS (escritorio)
  const toggleServiciosMenu = () => {
    setIsServiciosMenuOpen(prev => !prev);
    setIsLiquidacionMenuOpen(false); setIsGastosMenuOpen(false); setIsProfileMenuOpen(false);
  };


  return (
    <nav className="bg-white shadow-lg sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo y Nombre */}
          <div className="flex items-center">
            <img src="/images/smileyface.webp" alt="Logo" className="h-12 w-20 rounded-full flex-shrink-0"/>
            <span className="ml-2 text-xl font-semibold text-gray-900 hidden sm:block">Clínica Smiley</span>
            <span className="ml-2 text-lg font-semibold text-gray-900 sm:hidden">Smiley</span>
          </div>

          {/* Botón Menú Móvil */}
          <div className="flex items-center md:hidden">
            <button
              ref={mobileMenuButtonRef}
              onClick={toggleMenu}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-700 hover:text-gray-900 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
              aria-controls="mobile-menu"
              aria-expanded={isMenuOpen}
            >
              <span className="sr-only">Abrir menú principal</span>
              {isMenuOpen ? (
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              ) : (
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" /></svg>
              )}
            </button>
          </div>

          {/* Navegación Escritorio */}
          <div className="hidden md:flex md:items-center md:space-x-4 lg:space-x-8">
            <NavLink to="/" className={({ isActive }) => `inline-flex items-center px-1 pt-1 text-sm font-medium ${isActive ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}>
              Registros
            </NavLink>
            {isAdminOrOwner && (
              <>
                {/* Menú Liquidación (Escritorio) */}
                <div className="relative" ref={liquidacionRef}>
                  <button onClick={toggleLiquidacionMenu} className={`inline-flex items-center px-1 pt-1 text-sm font-medium focus:outline-none ${isLiquidacionActive ? 'text-blue-600' : 'text-gray-500 hover:text-gray-700'} ${isLiquidacionMenuOpen ? 'text-gray-900' : ''}`} aria-haspopup="true" aria-expanded={isLiquidacionMenuOpen}>
                    Liquidación <svg className={`ml-1 h-5 w-5 transition-transform duration-200 ${isLiquidacionMenuOpen ? 'transform rotate-180' : ''}`} fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
                  </button>
                  {isLiquidacionMenuOpen && (
                     <div className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none z-20">
                       <div className="py-1" role="menu" aria-orientation="vertical">
                        <NavLink to="/liquidacion" className={({ isActive }) => `block px-4 py-2 text-sm ${isActive ? 'bg-gray-100 text-gray-900' : 'text-gray-700'} hover:bg-gray-100 hover:text-gray-900`} role="menuitem" onClick={() => setIsLiquidacionMenuOpen(false)}>Liquidación</NavLink>
                        <NavLink to="/historial" className={({ isActive }) => `block px-4 py-2 text-sm ${isActive ? 'bg-gray-100 text-gray-900' : 'text-gray-700'} hover:bg-gray-100 hover:text-gray-900`} role="menuitem" onClick={() => setIsLiquidacionMenuOpen(false)}>Historial Liquidación</NavLink>
                       </div>
                     </div>
                  )}
                </div>
                {/* Menú Servicios (Escritorio) */}
                <div className="relative" ref={serviciosRef}>
                  <button onClick={toggleServiciosMenu} className={`inline-flex items-center px-1 pt-1 text-sm font-medium focus:outline-none ${isServiciosActive ? 'text-blue-600' : 'text-gray-500 hover:text-gray-700'} ${isServiciosMenuOpen ? 'text-gray-900' : ''}`} aria-haspopup="true" aria-expanded={isServiciosMenuOpen}>
                    Servicios <svg className={`ml-1 h-5 w-5 transition-transform duration-200 ${isServiciosMenuOpen ? 'transform rotate-180' : ''}`} fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
                  </button>
                  {isServiciosMenuOpen && (
                    <div className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none z-20">
                       <div className="py-1" role="menu" aria-orientation="vertical">
                        <NavLink to="/estandarizacion" className={({ isActive }) => `block px-4 py-2 text-sm ${isActive ? 'bg-gray-100 text-gray-900' : 'text-gray-700'} hover:bg-gray-100 hover:text-gray-900`} role="menuitem" onClick={() => setIsServiciosMenuOpen(false)}>Estandarización</NavLink>
                        <NavLink to="/gestion-laboratorios" className={({ isActive }) => `block px-4 py-2 text-sm ${isActive ? 'bg-gray-100 text-gray-900' : 'text-gray-700'} hover:bg-gray-100 hover:text-gray-900`} role="menuitem" onClick={() => setIsServiciosMenuOpen(false)}>Laboratorios</NavLink>
                        {isEstadioSede && (<NavLink to="/servicios-estadio" className={({ isActive }) => `block px-4 py-2 text-sm ${isActive ? 'bg-gray-100 text-gray-900' : 'text-gray-700'} hover:bg-gray-100 hover:text-gray-900`} role="menuitem" onClick={() => setIsServiciosMenuOpen(false)}>Servicios Estadio</NavLink>)}
                       </div>
                    </div>
                  )}
                </div>
              </>
            )}
            {/* Menú Gastos (Escritorio) */}
            <div className="relative" ref={gastosRef}>
              <button onClick={toggleGastosMenu} className={`inline-flex items-center px-1 pt-1 text-sm font-medium focus:outline-none ${isGastosActive ? 'text-blue-600' : 'text-gray-500 hover:text-gray-700'} ${isGastosMenuOpen ? 'text-gray-900' : ''}`} aria-haspopup="true" aria-expanded={isGastosMenuOpen}>
                Gastos <svg className={`ml-1 h-5 w-5 transition-transform duration-200 ${isGastosMenuOpen ? 'transform rotate-180' : ''}`} fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
              </button>
              {isGastosMenuOpen && (
                 <div className="origin-top-right absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none z-20">
                   <div className="py-1" role="menu" aria-orientation="vertical">
                    <NavLink to="/gastos" className={({ isActive }) => `block px-4 py-2 text-sm ${isActive ? 'bg-gray-100 text-gray-900' : 'text-gray-700'} hover:bg-gray-100 hover:text-gray-900`} role="menuitem" onClick={() => setIsGastosMenuOpen(false)}>Registro de Gastos</NavLink>
                    <NavLink to="/HistorialGastos" className={({ isActive }) => `block px-4 py-2 text-sm ${isActive ? 'bg-gray-100 text-gray-900' : 'text-gray-700'} hover:bg-gray-100 hover:text-gray-900`} role="menuitem" onClick={() => setIsGastosMenuOpen(false)}>Historial Gastos</NavLink>
                   </div>
                 </div>
              )}
            </div>
            {/* Menú Perfil (Escritorio) */}
            {user && (
              <div className="relative" ref={profileRef}>
                <button onClick={toggleProfileMenu} className="inline-flex items-center px-1 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 focus:outline-none rounded-md hover:bg-gray-100" aria-haspopup="true" aria-expanded={isProfileMenuOpen}>
                  <span className="sr-only">Abrir menú de usuario</span>
                  <span className="ml-2">{user.nombre || 'Usuario'}</span>
                  <svg className={`ml-1 h-5 w-5 transition-transform duration-200 ${isProfileMenuOpen ? 'transform rotate-180' : ''}`} fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
                </button>
                {isProfileMenuOpen && (
                  <div className="origin-top-right absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none z-20">
                    <div className="py-1" role="menu" aria-orientation="vertical">
                      <div className="px-4 py-3 border-b border-gray-200"><p className="text-sm font-medium text-gray-900 truncate">{user.nombre || 'Usuario'}</p><p className="text-sm text-gray-500 truncate">{user.usuario} | Sede: {sedeActual}</p></div>
                      <div className="py-1"><button onClick={handleChangeSede} className="w-full text-left block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900" role="menuitem">Cambiar Sede</button></div>
                      <div className="py-1 border-t border-gray-200"><button onClick={handleLogout} className="w-full text-left block px-4 py-2 text-sm text-red-600 hover:bg-red-50 hover:text-red-700" role="menuitem">Cerrar Sesión</button></div>
                    </div>
                  </div>
                 )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* --- Menú Móvil --- */}
      {/* Overlay */}
      {isMenuOpen && (<div className="fixed inset-0 z-40 bg-black bg-opacity-25 md:hidden" onClick={closeAllMenus} aria-hidden="true"></div>)}

      {/* Contenido del Menú Móvil (Ahora sin acordeón) */}
      <div
        ref={mobileMenuRef}
        id="mobile-menu"
        className={`fixed inset-y-0 left-0 z-50 w-3/4 max-w-sm bg-white shadow-xl transform transition-transform ease-in-out duration-300 md:hidden ${isMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="h-full flex flex-col">
          {/* Cabecera Menú Móvil */}
          <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between flex-shrink-0">
            <span className="text-lg font-semibold text-gray-900">Menú</span>
            <button onClick={toggleMenu} className="-mr-2 p-2 inline-flex items-center justify-center rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500">
              <span className="sr-only">Cerrar menú</span>
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>

          {/* Info Usuario y Sede (Móvil) */}
          {user && (
            <div className="px-4 py-3 border-b border-gray-200 flex-shrink-0">
              <p className="text-sm font-medium text-gray-900 truncate">Hola, {user.nombre || 'Usuario'}</p>
              <p className="text-sm text-gray-500 truncate">Sede: {sedeActual}</p>
            </div>
          )}

          {/* Items del Menú Móvil (Lista Plana) */}
          <div className="flex-grow overflow-y-auto py-3">
            <div className="px-2 space-y-1">

              {/* Registros */}
              <NavLink to="/" className={({ isActive }) => `block px-3 py-2 rounded-md text-base font-medium ${isActive ? 'text-blue-700 bg-blue-100' : 'text-gray-700 hover:text-gray-900 hover:bg-gray-50'}`} onClick={() => handleNavigation('/')}>
                Registros
              </NavLink>

              {/* Liquidación (Admin/Owner) */}
              {isAdminOrOwner && (
                <>
                  <NavLink to="/liquidacion" className={({ isActive }) => `block px-3 py-2 rounded-md text-base font-medium ${isActive ? 'text-blue-700 bg-blue-100' : 'text-gray-700 hover:text-gray-900 hover:bg-gray-50'}`} onClick={() => handleNavigation('/liquidacion')}>
                    Liquidación
                  </NavLink>
                  <NavLink to="/historial" className={({ isActive }) => `block px-3 py-2 rounded-md text-base font-medium ${isActive ? 'text-blue-700 bg-blue-100' : 'text-gray-700 hover:text-gray-900 hover:bg-gray-50'}`} onClick={() => handleNavigation('/historial')}>
                    Historial Liquidación
                  </NavLink>
                </>
              )}

              {/* Servicios (Admin/Owner) */}
              {isAdminOrOwner && (
                <>
                  <NavLink to="/estandarizacion" className={({ isActive }) => `block px-3 py-2 rounded-md text-base font-medium ${isActive ? 'text-blue-700 bg-blue-100' : 'text-gray-700 hover:text-gray-900 hover:bg-gray-50'}`} onClick={() => handleNavigation('/estandarizacion')}>
                    Estandarización
                  </NavLink>
                  <NavLink to="/gestion-laboratorios" className={({ isActive }) => `block px-3 py-2 rounded-md text-base font-medium ${isActive ? 'text-blue-700 bg-blue-100' : 'text-gray-700 hover:text-gray-900 hover:bg-gray-50'}`} onClick={() => handleNavigation('/gestion-laboratorios')}>
                    Laboratorios
                  </NavLink>
                  {isEstadioSede && (
                    <NavLink to="/servicios-estadio" className={({ isActive }) => `block px-3 py-2 rounded-md text-base font-medium ${isActive ? 'text-blue-700 bg-blue-100' : 'text-gray-700 hover:text-gray-900 hover:bg-gray-50'}`} onClick={() => handleNavigation('/servicios-estadio')}>
                      Servicios Estadio
                    </NavLink>
                  )}
                </>
              )}

              {/* Gastos (Todos los usuarios logueados) */}
              <NavLink to="/gastos" className={({ isActive }) => `block px-3 py-2 rounded-md text-base font-medium ${isActive ? 'text-blue-700 bg-blue-100' : 'text-gray-700 hover:text-gray-900 hover:bg-gray-50'}`} onClick={() => handleNavigation('/gastos')}>
                Registro de Gastos
              </NavLink>
              <NavLink to="/HistorialGastos" className={({ isActive }) => `block px-3 py-2 rounded-md text-base font-medium ${isActive ? 'text-blue-700 bg-blue-100' : 'text-gray-700 hover:text-gray-900 hover:bg-gray-50'}`} onClick={() => handleNavigation('/HistorialGastos')}>
                Historial Gastos
              </NavLink>

            </div>
          </div>

          {/* Acciones Fijas Abajo (Móvil) */}
          <div className="px-2 py-3 border-t border-gray-200 flex-shrink-0 space-y-2">
            <button onClick={handleChangeSede} className="block w-full text-center px-3 py-2 rounded-md text-base font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 border border-blue-600">
              Cambiar Sede
            </button>
            {user && (
              <button onClick={handleLogout} className="block w-full text-center px-3 py-2 rounded-md text-base font-medium text-red-600 hover:text-red-700 hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 border border-red-600">
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