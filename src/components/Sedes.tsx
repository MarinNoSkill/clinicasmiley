// frontend/src/components/Sedes.tsx
import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import SedesNavbar from './SedesNavbar';

interface Sede {
  id_sede: number;
  sede: string;
}

const Sedes: React.FC = () => {
  const [sedes, setSedes] = useState<Sede[]>([]);
  const [selectedSede, setSelectedSede] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchSedes = async () => {
      setLoading(true);
      try {
        const response = await axios.get<Sede[]>(
          `${import.meta.env.VITE_API_URL}/api/sedes`,
          {
            headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
          }
        );
        setSedes(response.data);
      } catch {
        setError('Error al cargar las sedes');
      } finally {
        setLoading(false);
      }
    };

    fetchSedes();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSedeSelect = (id_sede: number, sedeName: string) => {
    setSelectedSede(id_sede);
    localStorage.setItem('selectedSede', id_sede.toString());
    setIsOpen(false);
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <SedesNavbar />
      <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
        <div className="w-full max-w-lg mx-auto relative" ref={dropdownRef}>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setIsOpen(!isOpen)}
            className="w-full px-4 py-3 text-left bg-white border border-gray-300 rounded-full shadow-sm hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200 font-sans text-gray-700"
          >
            {loading ? 'Cargando sedes...' : selectedSede ? 
              sedes.find(s => s.id_sede === selectedSede)?.sede : 
              'Haz clic para seleccionar una sede'}
          </motion.button>

          <AnimatePresence>
            {isOpen && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="absolute w-full mt-2 bg-white border border-gray-200 rounded-md shadow-lg z-10 max-h-60 overflow-y-auto"
              >
                {error ? (
                  <p className="p-4 text-red-500 text-center font-sans">{error}</p>
                ) : sedes.length > 0 ? (
                  sedes.map((sede) => (
                    <motion.button
                      key={sede.id_sede}
                      whileHover={{ backgroundColor: '#f3f4f6' }}
                      onClick={() => handleSedeSelect(sede.id_sede, sede.sede)}
                      className="w-full text-left px-4 py-2 focus:bg-gray-100 transition-colors duration-150 font-sans text-gray-700 border-b border-gray-100 last:border-b-0"
                    >
                      {sede.sede}
                    </motion.button>
                  ))
                ) : (
                  <p className="p-4 text-gray-500 text-center font-sans">No hay sedes disponibles</p>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default Sedes;