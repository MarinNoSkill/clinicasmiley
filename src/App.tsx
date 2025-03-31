// frontend/src/App.tsx
import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import RegistrosDiarios from './components/RegistrosDiarios';
import Liquidacion from './components/Liquidacion';
import EstandarizacionServicios from './components/EstandarizacionServicios';
import HistorialLiquidaciones from './components/HistorialLiquidaciones';
import Login from './components/Login';
import { DentalRecord } from './types';

const ProtectedRoute: React.FC<{ children: JSX.Element }> = ({ children }) => {
  const token = localStorage.getItem('token');
  return token ? children : <Navigate to="/login" />;
};

function App() {
  const [registros, setRegistros] = useState<DentalRecord[]>([]);

  useEffect(() => {
    const registrosGuardados = localStorage.getItem('registrosDentales');
    if (registrosGuardados) {
      setRegistros(JSON.parse(registrosGuardados));
    }
  }, []);

  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <>
                  <Navbar />
                  <RegistrosDiarios registros={registros} setRegistros={setRegistros} />
                </>
              </ProtectedRoute>
            }
          />
          <Route
            path="/liquidacion"
            element={
              <ProtectedRoute>
                <>
                  <Navbar />
                  <Liquidacion registros={registros} setRegistros={setRegistros} />
                </>
              </ProtectedRoute>
            }
          />
          <Route
            path="/estandarizacion"
            element={
              <ProtectedRoute>
                <>
                  <Navbar />
                  <EstandarizacionServicios />
                </>
              </ProtectedRoute>
            }
          />
          <Route
            path="/historial"
            element={
              <ProtectedRoute>
                <>
                  <Navbar />
                  <HistorialLiquidaciones />
                </>
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/login" />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;