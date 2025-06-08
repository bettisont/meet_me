const axios = require('axios');

const geocodePostcode = async (postcode) => {
  try {
    const cleanPostcode = postcode.replace(/\s+/g, '');
    const response = await axios.get(`https://api.postcodes.io/postcodes/${cleanPostcode}`);
    
    if (response.data.status === 200) {
      const { latitude, longitude } = response.data.result;
      return {
        postcode: postcode,
        lat: latitude,
        lng: longitude
      };
    }
    throw new Error('Invalid postcode');
  } catch (error) {
    console.error(`Error geocoding postcode ${postcode}:`, error.message);
    throw new Error(`Failed to geocode postcode: ${postcode}`);
  }
};

const calculateMidpoint = (coordinates) => {
  if (!coordinates || coordinates.length === 0) {
    throw new Error('No coordinates provided');
  }

  const sumLat = coordinates.reduce((sum, coord) => sum + coord.lat, 0);
  const sumLng = coordinates.reduce((sum, coord) => sum + coord.lng, 0);

  return {
    lat: sumLat / coordinates.length,
    lng: sumLng / coordinates.length
  };
};

const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 3959; // Earth's radius in miles
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

const toRad = (value) => {
  return value * Math.PI / 180;
};

module.exports = {
  geocodePostcode,
  calculateMidpoint,
  calculateDistance
};