import React, { useState, useEffect } from "react";
import axios from "axios";

interface Gasto {
  fecha: string;
  concepto: string;
  proveedor: string;
  tipoGasto: string;
  valor: number;
  responsable: string;
  comentario?: string;
}

interface GastoPayload extends Gasto {
  id_sede: number;
}

const conceptosData = [
  { concepto: "Bolsa de basura", proveedor: "Bolsas el indio", tipo: "Aseo general" },
  { concepto: "Recogida residuos peligrosos", proveedor: "Asei", tipo: "Gasto fijo" },
  { concepto: "Factura insumos", proveedor: "Sierradent", tipo: "Consumibles" },
  { concepto: "Jardín", proveedor: "Persona natural Alejandro", tipo: "Eventual" },
  { concepto: "Domicilios", proveedor: "Didi / Picap", tipo: "Eventual" },
  { concepto: "Productos de aseo", proveedor: "D1", tipo: "Aseo general" },
  { concepto: "Servicio técnico", proveedor: "Wilson", tipo: "Eventual" },
];

const RegistroGasto: React.FC = () => {
  const [gasto, setGasto] = useState<Gasto>({
    fecha: new Date().toISOString().split("T")[0],
    concepto: "",
    proveedor: "",
    tipoGasto: "",
    valor: 0,
    responsable: "",
    comentario: "",
  });
  const [responsables, setResponsables] = useState<string[]>([]);
  const [error, setError] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [successMessage, setSuccessMessage] = useState<string>("");

  useEffect(() => {
    const fetchResponsables = async () => {
      try {
        const id_sede = localStorage.getItem("selectedSede");
        if (!id_sede) {
          setError("No se ha seleccionado una sede. Por favor, selecciónala.");
          return;
        }

        const token = localStorage.getItem("token");
        const headers = { Authorization: `Bearer ${token}` };

        const doctorsResponse = await axios.get(`${import.meta.env.VITE_API_URL}/api/doctors`, {
          headers,
          params: { id_sede },
        });

        const assistantsResponse = await axios.get(`${import.meta.env.VITE_API_URL}/api/assistants`, {
          headers,
          params: { id_sede },
        });

        const combinedResponsables = [
          ...new Set([
            ...(doctorsResponse.data as string[]),
            ...(assistantsResponse.data as string[]),
          ]),
        ].sort();

        setResponsables(combinedResponsables);
      } catch (err: any) {
        console.error("Error al cargar responsables:", err);
        setError("No se pudo cargar la lista de responsables.");
      }
    };

    fetchResponsables();
  }, []);

  const handleConceptoChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const conceptoSeleccionado = conceptosData.find((c) => c.concepto === e.target.value);
    setGasto({
      ...gasto,
      concepto: e.target.value,
      proveedor: conceptoSeleccionado?.proveedor || "",
      tipoGasto: conceptoSeleccionado?.tipo || "",
    });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setGasto({
      ...gasto,
      [name]: name === "valor" ? parseFloat(value) || 0 : value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccessMessage("");
    setLoading(true);

    const id_sede_str = localStorage.getItem("selectedSede");
    if (!id_sede_str) {
      setError("No se ha seleccionado una sede. Por favor, selecciónala.");
      setLoading(false);
      return;
    }

    const id_sede = parseInt(id_sede_str, 10);

    if (
      !gasto.fecha ||
      !gasto.concepto ||
      !gasto.proveedor ||
      !gasto.tipoGasto ||
      !gasto.valor ||
      gasto.valor <= 0 ||
      !gasto.responsable
    ) {
      setError("Por favor, completa todos los campos obligatorios y asegúrate que el valor sea positivo.");
      setLoading(false);
      return;
    }

    const payload: GastoPayload = {
      ...gasto,
      id_sede,
    };

    console.log("Enviando Gasto:", payload);

    try {
      const token = localStorage.getItem("token");
      await axios.post(
        `${import.meta.env.VITE_API_URL}/api/gastos`,
        payload,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setSuccessMessage("¡Gasto registrado exitosamente!");
      setGasto({
        fecha: new Date().toISOString().split("T")[0],
        concepto: "",
        proveedor: "",
        tipoGasto: "",
        valor: 0,
        responsable: "",
        comentario: "",
      });
    } catch (err: any) {
      console.error("Error registrando gasto:", err);
      setError(err.response?.data?.error || err.message || "Error al registrar el gasto.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-8">
      <h2 className="text-3xl font-bold text-gray-800 mb-8 text-center">
        Registrar Gasto Diario - Clínica Smiley
      </h2>
      <form onSubmit={handleSubmit} className="bg-white shadow-md rounded-lg p-6 border border-teal-200">
        {error && (
          <p className="mb-4 p-2 bg-red-50 text-red-600 rounded-md text-sm">
            {error}
          </p>
        )}
        {successMessage && (
          <p className="mb-4 p-2 bg-teal-50 text-teal-600 rounded-md text-sm">
            {successMessage}
          </p>
        )}

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-600">Fecha</label>
          <input
            type="date"
            name="fecha"
            value={gasto.fecha}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-teal-500 focus:ring-teal-500 text-sm p-1.5"
            required
          />
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-600">Concepto</label>
          <select
            name="concepto"
            value={gasto.concepto}
            onChange={handleConceptoChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-teal-500 focus:ring-teal-500 text-sm p-1.5"
            required
          >
            <option value="">Seleccione un concepto</option>
            {conceptosData.map((c) => (
              <option key={c.concepto} value={c.concepto}>
                {c.concepto}
              </option>
            ))}
          </select>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-600">Proveedor</label>
          <input
            type="text"
            name="proveedor"
            value={gasto.proveedor}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 bg-teal-50 text-sm p-1.5"
            readOnly
            required
          />
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-600">Tipo de Gasto</label>
          <input
            type="text"
            name="tipoGasto"
            value={gasto.tipoGasto}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 bg-teal-50 text-sm p-1.5"
            readOnly
            required
          />
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-600">Valor ($)</label>
          <input
            type="number"
            name="valor"
            value={gasto.valor}
            onChange={handleChange}
            min="0"
            step="any"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-amber-500 focus:ring-amber-500 text-sm p-1.5"
            required
          />
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-600">Responsable</label>
          <select
            name="responsable"
            value={gasto.responsable}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-teal-500 focus:ring-teal-500 text-sm p-1.5"
            required
          >
            <option value="">Seleccione un responsable</option>
            {responsables.map((responsable) => (
              <option key={responsable} value={responsable}>
                {responsable}
              </option>
            ))}
          </select>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-600">Comentario (opcional)</label>
          <textarea
            name="comentario"
            value={gasto.comentario || ""}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-teal-500 focus:ring-teal-500 text-sm p-1.5"
            rows={3}
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className={`w-full flex justify-center items-center px-3 py-1.5 rounded-md text-white font-medium bg-gradient-to-r from-teal-600 to-teal-700 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 transition-transform duration-200 text-sm ${
            loading ? "opacity-50 cursor-not-allowed" : ""
          }`}
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
              d="M12 4v16m8-8H4"
            />
          </svg>
          {loading ? "Registrando..." : "Registrar Gasto"}
        </button>
      </form>
    </div>
  );
};

export default RegistroGasto;