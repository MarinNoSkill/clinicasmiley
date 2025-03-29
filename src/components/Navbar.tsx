import { NavLink } from 'react-router-dom';

const Navbar = () => {
  return (
    <nav className="bg-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <img
              src="/public/images/smileyface.webp"
              alt="Logo"  
              className="h-14 w-24 rounded-full"
            />
            <span className="ml-2 text-xl font-semibold text-gray-900">Clínica Smiley</span>
          </div>
          <div className="flex space-x-8">
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
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;