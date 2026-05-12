import axios from 'axios';
import { useState } from 'react';

const API_BASE = '/api/admin';

// Get auth token from localStorage or session
const getAuthToken = () => {
  return localStorage.getItem('auth_token');
};

const apiClient = axios.create({
  baseURL: API_BASE,
  headers: {
    'X-Requested-With': 'XMLHttpRequest',
    'Accept': 'application/json',
  },
});

// Add auth token to requests
apiClient.interceptors.request.use((config) => {
  const token = getAuthToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

interface Officer {
  id: number;
  nip: string;
  name: string;
  email: string;
  phone: string;
  status: 'ACTIVE' | 'INACTIVE' | 'ON_BREAK';
  role: 'OFFICER' | 'CS';
  created_at?: string;
}

interface Counter {
  id: number;
  code: string;
  counter_number: number;
  service: {
    id: number;
    code: string;
    name: string;
  };
  officer?: {
    id: number;
    nip: string;
    name: string;
  };
  status: 'ACTIVE' | 'INACTIVE' | 'MAINTENANCE';
  created_at?: string;
}

interface CounterPayload {
  service_category_id?: number;
  counter_number?: number;
  status?: 'ACTIVE' | 'INACTIVE' | 'MAINTENANCE';
  officer_id?: number | null;
}

export const useAdminAPI = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // OFFICERS API
  const getOfficers = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/officers');
      setError(null);
      return response.data.data || response.data;
    } catch (err: any) {
      const message = err.response?.data?.message || 'Failed to fetch officers';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const getOfficer = async (id: number) => {
    try {
      setLoading(true);
      const response = await apiClient.get(`/officers/${id}`);
      setError(null);
      return response.data.data || response.data;
    } catch (err: any) {
      const message = err.response?.data?.message || 'Failed to fetch officer';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const createOfficer = async (data: Partial<Officer>) => {
    try {
      setLoading(true);
      const response = await apiClient.post('/officers', data);
      setError(null);
      return response.data.data || response.data;
    } catch (err: any) {
      const message = err.response?.data?.message || 'Failed to create officer';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateOfficer = async (id: number, data: Partial<Officer>) => {
    try {
      setLoading(true);
      const response = await apiClient.put(`/officers/${id}`, data);
      setError(null);
      return response.data.data || response.data;
    } catch (err: any) {
      const message = err.response?.data?.message || 'Failed to update officer';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const deleteOfficer = async (id: number) => {
    try {
      setLoading(true);
      const response = await apiClient.delete(`/officers/${id}`);
      setError(null);
      return response.data;
    } catch (err: any) {
      const message = err.response?.data?.message || 'Failed to delete officer';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const resetOfficerPassword = async (id: number, password: string) => {
  try {
    setLoading(true);

    const response = await apiClient.post(`/officers/${id}/reset-password`, {
      password,
    });

    setError(null);
    return response.data.data || response.data;
  } catch (err: any) {
    const message = err.response?.data?.message || 'Failed to reset password';
    setError(message);
    throw err;
  } finally {
    setLoading(false);
  }
};

  // COUNTERS API
  const getCounters = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/counters');
      setError(null);
      return response.data.data || response.data;
    } catch (err: any) {
      const message = err.response?.data?.message || 'Failed to fetch counters';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const getCounter = async (id: number) => {
    try {
      setLoading(true);
      const response = await apiClient.get(`/counters/${id}`);
      setError(null);
      return response.data.data || response.data;
    } catch (err: any) {
      const message = err.response?.data?.message || 'Failed to fetch counter';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const createCounter = async (data: CounterPayload) => {
    try {
      setLoading(true);
      const response = await apiClient.post('/counters', data);
      setError(null);
      return response.data.data || response.data;
    } catch (err: any) {
      const message = err.response?.data?.message || 'Failed to create counter';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateCounter = async (id: number, data: CounterPayload) => {
    try {
      setLoading(true);
      const response = await apiClient.put(`/counters/${id}`, data);
      setError(null);
      return response.data.data || response.data;
    } catch (err: any) {
      const message = err.response?.data?.message || 'Failed to update counter';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateCounterStatus = async (id: number, status: 'ACTIVE' | 'INACTIVE' | 'MAINTENANCE') => {
    try {
      setLoading(true);
      const response = await apiClient.patch(`/counters/${id}/status`, { status });
      setError(null);
      return response.data.data || response.data;
    } catch (err: any) {
      const message = err.response?.data?.message || 'Failed to update counter status';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const assignOfficerToCounter = async (counterId: number, officerId: number | null) => {
    try {
      setLoading(true);
      const response = await apiClient.post(`/counters/${counterId}/assign-officer`, {
        officer_id: officerId,
      });
      setError(null);
      return response.data.data || response.data;
    } catch (err: any) {
      const message = err.response?.data?.message || 'Failed to assign officer';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const deleteCounter = async (id: number) => {
    try {
      setLoading(true);
      const response = await apiClient.delete(`/counters/${id}`);
      setError(null);
      return response.data;
    } catch (err: any) {
      const message = err.response?.data?.message || 'Failed to delete counter';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    error,
    // Officers
    getOfficers,
    getOfficer,
    createOfficer,
    updateOfficer,
    deleteOfficer,
    resetOfficerPassword,
    // Counters
    getCounters,
    getCounter,
    createCounter,
    updateCounter,
    updateCounterStatus,
    assignOfficerToCounter,
    deleteCounter,
  };
};
