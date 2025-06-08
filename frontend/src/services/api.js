import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('authToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle token expiration
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
      window.location.href = '/';
    }
    return Promise.reject(error);
  }
);

export default api;

export const venueService = {
  async searchVenues(postcodes, venueType) {
    try {
      const response = await fetch(`${API_BASE_URL}/venues/search`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          postcodes,
          venueType,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to search venues');
      }

      return await response.json();
    } catch (error) {
      console.error('Error searching venues:', error);
      throw error;
    }
  },

  async geocodePostcode(postcode) {
    try {
      const response = await fetch(`${API_BASE_URL}/geocode/${encodeURIComponent(postcode)}`);
      
      if (!response.ok) {
        throw new Error('Failed to geocode postcode');
      }

      return await response.json();
    } catch (error) {
      console.error('Error geocoding postcode:', error);
      throw error;
    }
  },

  async calculateMidpoint(coordinates) {
    try {
      const response = await fetch(`${API_BASE_URL}/midpoint`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ coordinates }),
      });

      if (!response.ok) {
        throw new Error('Failed to calculate midpoint');
      }

      return await response.json();
    } catch (error) {
      console.error('Error calculating midpoint:', error);
      throw error;
    }
  },
};