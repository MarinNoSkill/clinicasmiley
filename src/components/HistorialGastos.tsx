import { useEffect, useState } from "react";
import axios from "axios";
import * as XLSX from "xlsx";

interface Gasto {
  id: number;
  concepto: string;
  proveedor: string;
  tipo_gasto: string;
  monto: number;
  fecha: string;
  responsable: string;
  comentario?: string;
  id_sede: number;
}

const HistorialGastos = () => {
  const [gastos, setGastos] = useState<Gasto[]>([]);
  const [filteredGastos, setFilteredGastos] = useState<Gasto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    fechaInicio: "",
    fechaFinal: "",
    concepto: "",
    proveedor: "",
    responsable: "",
  });
  const [conceptos, setConceptos] = useState<string[]>([]);
  const [proveedores, setProveedores] = useState<string[]>([]);
  const [responsables, setResponsables] = useState<string[]>([]);

  const fetchGastos = async () => {
    setLoading(true);
    setError(null);

    try {
      const id_sede = localStorage.getItem("selectedSede");
      if (!id_sede) {
        throw new Error("No se ha seleccionado una sede. Por favor, selecciónala.");
      }

      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("No se encontró un token de autenticación. Por favor, inicia sesión.");
      }

      const headers = { Authorization: `Bearer ${token}` };

      const response = await axios.get<Gasto[]>(
        `${import.meta.env.VITE_API_URL}/api/gastos`,
        {
          headers,
          params: { id_sede },
        }
      );

      const data = response.data || [];
      setGastos(data);
      setFilteredGastos(data);

      // Populate filter options
      setConceptos(Array.from(new Set(data.map((g) => g.concepto))));
      setProveedores(Array.from(new Set(data.map((g) => g.proveedor))));
      setResponsables(Array.from(new Set(data.map((g) => g.responsable))));
    } catch (err: any) {
      console.error("Error al cargar los gastos:", err);
      setError(
        err.response?.data?.error || err.message || "Error al cargar los gastos."
      );
      setGastos([]);
      setFilteredGastos([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGastos();
  }, []);

  useEffect(() => {
    const applyFilters = () => {
      let filtered = [...gastos];

      if (filters.fechaInicio) {
        filtered = filtered.filter((g) => {
          const fechaGasto = g.fecha.split('T')[0];
          return fechaGasto >= filters.fechaInicio;
        });
      }
      if (filters.fechaFinal) {
        filtered = filtered.filter((g) => {
          const fechaGasto = g.fecha.split('T')[0];
          return fechaGasto <= filters.fechaFinal;
        });
      }
      if (filters.concepto) {
        filtered = filtered.filter((g) =>
          g.concepto.toLowerCase().includes(filters.concepto.toLowerCase())
        );
      }
      if (filters.proveedor) {
        filtered = filtered.filter((g) =>
          g.proveedor.toLowerCase().includes(filters.proveedor.toLowerCase())
        );
      }
      if (filters.responsable) {
        filtered = filtered.filter((g) =>
          g.responsable.toLowerCase().includes(filters.responsable.toLowerCase())
        );
      }

      setFilteredGastos(filtered);
    };

    applyFilters();
  }, [filters, gastos]);

  const handleFilterChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const handleDescargarExcel = () => {
    const datos = filteredGastos.map((gasto) => {
      // Parse the date without timezone adjustment
      const [year, month, day] = gasto.fecha.split('T')[0].split('-');
      const formattedDate = `${day}/${month}/${year}`;
      
      return {
        ID: gasto.id,
        Concepto: gasto.concepto,
        Proveedor: gasto.proveedor,
        "Tipo de Gasto": gasto.tipo_gasto,
        Monto: `$${gasto.monto.toFixed(2)}`,
        Fecha: formattedDate,
        Responsable: gasto.responsable,
        Comentario: gasto.comentario || "-",
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(datos);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Gastos");
    XLSX.writeFile(workbook, `Historial_Gastos_${new Date().toISOString().split("T")[0]}.xlsx`);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h2 className="text-3xl font-bold text-gray-800 mb-8">
        Historial de Gastos - Clínica Smiley
      </h2>

      <div className="bg-white shadow-md rounded-lg p-5 mb-6 border border-teal-200">
        <h3 className="text-lg font-medium text-gray-700 mb-3">Filtrar Gastos</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-600">
              Fecha Inicio
            </label>
            <input
              type="date"
              name="fechaInicio"
              value={filters.fechaInicio}
              onChange={handleFilterChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-teal-500 focus:ring-teal-500 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600">
              Fecha Final
            </label>
            <input
              type="date"
              name="fechaFinal"
              value={filters.fechaFinal}
              onChange={handleFilterChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-teal-500 focus:ring-teal-500 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600">
              Concepto
            </label>
            <select
              name="concepto"
              value={filters.concepto}
              onChange={handleFilterChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-teal-500 focus:ring-teal-500 text-sm"
            >
              <option value="">Todos los conceptos</option>
              {conceptos.map((concepto) => (
                <option key={concepto} value={concepto}>
                  {concepto}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600">
              Proveedor
            </label>
            <select
              name="proveedor"
              value={filters.proveedor}
              onChange={handleFilterChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-teal-500 focus:ring-teal-500 text-sm"
            >
              <option value="">Todos los proveedores</option>
              {proveedores.map((proveedor) => (
                <option key={proveedor} value={proveedor}>
                  {proveedor}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600">
              Responsable
            </label>
            <select
              name="responsable"
              value={filters.responsable}
              onChange={handleFilterChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-teal-500 focus:ring-teal-500 text-sm"
            >
              <option value="">Todos los responsables</option>
              {responsables.map((responsable) => (
                <option key={responsable} value={responsable}>
                  {responsable}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-6 text-gray-500">Cargando gastos...</div>
      ) : error ? (
        <div className="text-center py-6 text-red-500">{error}</div>
      ) : filteredGastos.length === 0 ? (
        <p className="text-gray-600 text-center">
          No hay gastos que coincidan con los filtros seleccionados.
        </p>
      ) : (
        <div className="bg-white shadow-md rounded-lg p-5">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium text-gray-700">
              Resumen de Gastos
            </h3>
            <button
              onClick={handleDescargarExcel}
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
                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                />
              </svg>
              Exportar a Excel
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-100">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                    ID
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                    Concepto
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                    Proveedor
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                    Tipo de Gasto
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                    Monto
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                    Fecha
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                    Responsable
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                    Comentario
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredGastos.map((gasto, index) => (
                  <tr
                    key={gasto.id}
                    className={`${
                      index % 2 === 0 ? "bg-white" : "bg-gray-50"
                    } hover:bg-gray-100 transition-colors duration-150`}
                  >
                    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">
                      {gasto.id}
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">
                      {gasto.concepto}
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">
                      {gasto.proveedor}
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">
                      {gasto.tipo_gasto}
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap text-sm font-semibold text-amber-600">
                      ${gasto.monto.toFixed(2)}
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">
                      {(() => {
                        // Parse the date without timezone adjustment
                        const [year, month, day] = gasto.fecha.split('T')[0].split('-');
                        return `${day}/${month}/${year}`;
                      })()}
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">
                      {gasto.responsable}
                    </td>
                    <td className="px-4 py-2 text-sm text-gray-900">
                      {gasto.comentario || "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default HistorialGastos;