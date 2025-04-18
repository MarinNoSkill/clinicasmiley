import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import axios from 'axios';
import Navbar from './components/Navbar';
import RegistrosDiarios from './components/RegistrosDiarios';
import Liquidacion from './components/Liquidacion';
import EstandarizacionServicios from './components/EstandarizacionServicios';
import HistorialLiquidaciones from './components/HistorialLiquidaciones';
import Login from './components/Login';
import Sedes from './components/Sedes';
import { DentalRecord } from './types';
import RegistroGasto from './components/RegistroGasto';

axios.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const { data } = await axios.post<{ token: string }>(`${import.meta.env.VITE_API_URL}/api/refresh-token`, {
          token: localStorage.getItem('token'),
        });
        localStorage.setItem('token', data.token);
        originalRequest.headers.Authorization = `Bearer ${data.token}`;
        return axios(originalRequest);
      } catch (err) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('selectedSede');
        window.location.href = '/login';
        return Promise.reject(err);
      }
    }
    return Promise.reject(error);
  }
);

const ProtectedRoute: React.FC<{ children: JSX.Element; adminOnly?: boolean }> = ({ children, adminOnly = false }) => {
  const token = localStorage.getItem('token');
  const selectedSede = localStorage.getItem('selectedSede');
  const user = JSON.parse(localStorage.getItem('user') || 'null');

  if (!token) return <Navigate to="/login" />;
  if (!selectedSede) return <Navigate to="/sedes" />;
  
  if (adminOnly && user && !['Dueño', 'Admin'].includes(user.usuario)) {
    return <Navigate to="/" />;
  }

  return children;
};

const AuthRoute: React.FC<{ children: JSX.Element }> = ({ children }) => {
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

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('selectedSede');
    window.location.href = '/login';
  };

  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/sedes"
            element={
              <AuthRoute>
                <Sedes />
              </AuthRoute>
            }
          />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <>
                  <Navbar onLogout={handleLogout} />
                  <RegistrosDiarios registros={registros} setRegistros={setRegistros} />
                </>
              </ProtectedRoute>
            }
          />
          <Route
            path="/liquidacion"
            element={
              <ProtectedRoute adminOnly={true}>
                <>
                  <Navbar onLogout={handleLogout} />
                  <Liquidacion registros={registros} setRegistros={setRegistros} />
                </>
              </ProtectedRoute>
            }
          />
          <Route
            path="/estandarizacion"
            element={
              <ProtectedRoute adminOnly={true}>
                <>
                  <Navbar onLogout={handleLogout} />
                  <EstandarizacionServicios />
                </>
              </ProtectedRoute>
            }
          />
          <Route
            path="/historial"
            element={
              <ProtectedRoute adminOnly={true}>
                <>
                  <Navbar onLogout={handleLogout} />
                  <HistorialLiquidaciones />
                </>
              </ProtectedRoute>
            }
          />
          <Route
            path="/gastos"
            element={
              <ProtectedRoute>
                <>
                  <Navbar onLogout={handleLogout} />
                  <RegistroGasto />
                </>
              </ProtectedRoute>
            }
          />
          <Route
            path="*"
            element={
              <Navigate
                to={
                  localStorage.getItem('token')
                    ? (localStorage.getItem('selectedSede') ? '/' : '/sedes')
                    : '/login'
                }
                replace
              />
            }
          />
        </Routes>
      </div>
    </Router>
  );
}

export default App;