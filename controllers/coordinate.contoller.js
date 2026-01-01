const axios = require('axios')

const getLatLngFromPlaceId = async (req, res) => {
  const { placeId } = req.body;

  try {
    const url = `https://maps.googleapis.com/maps/api/geocode/json`;
    const response = await axios.get(url, {
      params: {
        place_id: placeId,
        key: process.env.GEOCODING_API_KEY,
      },
    });

    console.log('Fetched location:', response.data.results);
    const location = response.data.results[0].geometry.location;

    res.json({
      lat: location.lat,
      lng: location.lng,
    });
  } catch (error) {
    console.error('Error fetching location:', error);
    res.status(500).json({ error: 'Failed to fetch location' });
  }
};

module.exports = { getLatLngFromPlaceId }