import axios from 'axios';

export const formatCOP = (amount: number) => {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

export const fetchDoctors = async (id_sede: string): Promise<string[]> => {
  const token = localStorage.getItem('token');
  const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/doctors`, {
    params: { id_sede },
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data as string[];
};

export const fetchAssistants = async (id_sede: string): Promise<string[]> => {
  const token = localStorage.getItem('token');
  const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/assistants`, {
    params: { id_sede },
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data as string[];
};

export const fetchServices = async (): Promise<{ nombre: string; precio: number; descripcion: string; sesiones: number; }[]> => {
  const token = localStorage.getItem('token');
  const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/services`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data as { nombre: string; precio: number; descripcion: string; sesiones: number; }[];
};

export const fetchPaymentMethods = async (): Promise<string[]> => {
  const token = localStorage.getItem('token');
  const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/payment-methods`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data as string[];
};

// Nueva función para obtener las cuentas bancarias
export const fetchAccounts = async (id_sede: string): Promise<{ id_cuenta: number; cuentas: string }[]> => {
  const token = localStorage.getItem('token');
  const response = await axios.get<{ id_cuenta: number; cuentas: string }[]>(`${import.meta.env.VITE_API_URL}/api/accounts`, {
    params: { id_sede },
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data;
};

export const fetchCajaBase = async (id_sede: string): Promise<number> => {
  const token = localStorage.getItem('token');
  try {
    const response = await axios.get<{ base: number }>(`${import.meta.env.VITE_API_URL}/api/caja/${id_sede}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data.base;
  } catch (error) {
    console.error("Error fetching caja base:", error);
    // Considera cómo manejar el error en la UI, quizás devolver 0 o lanzar el error
    return 0;
  }
};

export const updateCajaBase = async (id_sede: string, base: number): Promise<number> => {
  const token = localStorage.getItem('token');
  const response = await axios.put<{ base: number }>(
    `${import.meta.env.VITE_API_URL}/api/caja/${id_sede}`,
    { base }, // Enviar el nuevo valor de la base en el cuerpo
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );
  return response.data.base; // Devuelve la base actualizada desde el backend
};