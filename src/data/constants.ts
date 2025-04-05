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

export const fetchServices = async (): Promise<{ nombre: string; precio: number }[]> => {
  const token = localStorage.getItem('token');
  const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/services`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data as { nombre: string; precio: number }[];
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