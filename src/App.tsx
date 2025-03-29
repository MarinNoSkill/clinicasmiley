// src/App.tsx
import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import RegistrosDiarios from './components/RegistrosDiarios';
import Liquidacion from './components/Liquidacion';
import EstandarizacionServicios from './components/EstandarizacionServicios';
import HistorialLiquidaciones from './components/HistorialLiquidaciones'; // Nueva vista
import { DentalRecord } from './types';

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
        <Navbar />
        <Routes>
          <Route path="/" element={<RegistrosDiarios registros={registros} setRegistros={setRegistros} />} />
          <Route path="/liquidacion" element={<Liquidacion registros={registros} setRegistros={setRegistros} />} />
          <Route path="/estandarizacion" element={<EstandarizacionServicios />} />
          <Route path="/historial" element={<HistorialLiquidaciones />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;