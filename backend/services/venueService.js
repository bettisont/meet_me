const axios = require('axios');
const { geocodePostcode, calculateMidpoint, calculateDistance } = require('../utils/geocoding');

const venueTypeMapping = {
  pub: 'pub',
  cafe: 'cafe',
  restaurant: 'restaurant',
  bar: 'bar',
  park: 'park',
  museum: 'museum',
  cinema: 'cinema',
  shopping: 'shopping_mall'
};

const getSearchQuery = (venueType, radius, lat, lng) => {
  if (venueType === 'park') {
    // Comprehensive park search including various leisure areas
    return `
      [out:json][timeout:25];
      (
        node["amenity"="park"](around:${radius},${lat},${lng});
        way["amenity"="park"](around:${radius},${lat},${lng});
        relation["amenity"="park"](around:${radius},${lat},${lng});
        node["leisure"="park"](around:${radius},${lat},${lng});
        way["leisure"="park"](around:${radius},${lat},${lng});
        relation["leisure"="park"](around:${radius},${lat},${lng});
        node["leisure"="garden"](around:${radius},${lat},${lng});
        way["leisure"="garden"](around:${radius},${lat},${lng});
        relation["leisure"="garden"](around:${radius},${lat},${lng});
        node["leisure"="recreation_ground"](around:${radius},${lat},${lng});
        way["leisure"="recreation_ground"](around:${radius},${lat},${lng});
        relation["leisure"="recreation_ground"](around:${radius},${lat},${lng});
        node["landuse"="recreation_ground"](around:${radius},${lat},${lng});
        way["landuse"="recreation_ground"](around:${radius},${lat},${lng});
        relation["landuse"="recreation_ground"](around:${radius},${lat},${lng});
      );
      out body;
      >;
      out skel qt;
    `;
  } else {
    // Standard search for other venue types
    return `
      [out:json][timeout:25];
      (
        node["amenity"="${venueTypeMapping[venueType] || venueType}"](around:${radius},${lat},${lng});
        way["amenity"="${venueTypeMapping[venueType] || venueType}"](around:${radius},${lat},${lng});
        relation["amenity"="${venueTypeMapping[venueType] || venueType}"](around:${radius},${lat},${lng});
      );
      out body;
      >;
      out skel qt;
    `;
  }
};

const searchVenuesNearLocation = async (lat, lng, venueType, radius = 10000) => {
  try {
    // Using Overpass API (OpenStreetMap) for venue search
    const query = getSearchQuery(venueType, radius, lat, lng);

    const response = await axios.post('https://overpass-api.de/api/interpreter', query, {
      headers: { 'Content-Type': 'text/plain' }
    });

    const venues = response.data.elements
      .filter(element => element.tags && element.tags.name)
      .map(element => ({
        id: element.id,
        name: element.tags.name,
        type: venueType,
        address: formatAddress(element.tags),
        lat: element.lat || element.center?.lat,
        lng: element.lon || element.center?.lon,
        rating: Math.random() * 2 + 3, // Mock rating between 3-5
        phone: element.tags.phone,
        website: element.tags.website
      }))
      .filter(venue => venue.lat && venue.lng)
      .slice(0, 20); // Limit to 20 venues for better coverage

    return venues;
  } catch (error) {
    console.error('Error searching venues:', error.message);
    // Fallback to mock data if API fails
    return generateMockVenues(lat, lng, venueType);
  }
};

const formatAddress = (tags) => {
  const parts = [];
  if (tags['addr:housenumber']) parts.push(tags['addr:housenumber']);
  if (tags['addr:street']) parts.push(tags['addr:street']);
  if (tags['addr:city']) parts.push(tags['addr:city']);
  if (tags['addr:postcode']) parts.push(tags['addr:postcode']);
  
  return parts.length > 0 ? parts.join(', ') : 'Address not available';
};

const generateMockVenues = (lat, lng, venueType) => {
  const mockNames = {
    pub: ['The Red Lion', 'The Crown', 'The Kings Arms', 'The White Hart', 'The Rose & Crown'],
    cafe: ['Central Perk', 'The Daily Grind', 'Bean There', 'Coffee Corner', 'Brew & Co'],
    restaurant: ['The Ivy', 'Bella Italia', 'Nandos', 'Pizza Express', 'Wagamama'],
    bar: ['Sky Bar', 'The Alchemist', 'Be At One', 'Revolution', 'All Bar One'],
    park: ['Hyde Park', 'Regents Park', 'Green Park', 'St James Park', 'Victoria Park'],
    museum: ['British Museum', 'Natural History Museum', 'Science Museum', 'V&A', 'Tate Modern'],
    cinema: ['Odeon', 'Vue', 'Cineworld', 'Picturehouse', 'Everyman'],
    shopping: ['Westfield', 'Oxford Street', 'Covent Garden', 'Camden Market', 'Carnaby Street']
  };

  const names = mockNames[venueType] || mockNames.pub;
  
  return names.slice(0, 5).map((name, index) => ({
    id: index + 1,
    name: name,
    type: venueType,
    address: `${Math.floor(Math.random() * 100) + 1} High Street, London`,
    lat: lat + (Math.random() - 0.5) * 0.02,
    lng: lng + (Math.random() - 0.5) * 0.02,
    rating: (Math.random() * 2 + 3).toFixed(1),
    distance: (Math.random() * 2 + 0.5).toFixed(1)
  }));
};

const searchVenues = async (postcodes, venueType) => {
  try {
    // Geocode all postcodes
    const geocodingPromises = postcodes.map(postcode => geocodePostcode(postcode));
    const postcodeLocations = await Promise.all(geocodingPromises);

    // Calculate midpoint
    const midpoint = calculateMidpoint(postcodeLocations);

    // Search for venues near midpoint
    const venues = await searchVenuesNearLocation(midpoint.lat, midpoint.lng, venueType);

    // Calculate distances from midpoint to venues
    const venuesWithDistance = venues.map(venue => ({
      ...venue,
      distance: calculateDistance(midpoint.lat, midpoint.lng, venue.lat, venue.lng).toFixed(1)
    })).sort((a, b) => parseFloat(a.distance) - parseFloat(b.distance));

    // Calculate distances from each postcode to midpoint
    const postcodeDistances = postcodeLocations.map(location => ({
      ...location,
      distanceToMidpoint: calculateDistance(location.lat, location.lng, midpoint.lat, midpoint.lng).toFixed(1)
    }));

    return {
      midpoint,
      postcodeLocations: postcodeDistances,
      venues: venuesWithDistance
    };
  } catch (error) {
    console.error('Error in searchVenues:', error);
    throw error;
  }
};

module.exports = {
  searchVenues
};