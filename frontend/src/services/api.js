const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

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