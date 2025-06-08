const express = require('express');
const router = express.Router();
const { searchVenues } = require('../services/venueService');

router.post('/search', async (req, res) => {
  try {
    const { postcodes, venueType } = req.body;

    if (!postcodes || !Array.isArray(postcodes) || postcodes.length < 2) {
      return res.status(400).json({
        error: 'Please provide at least 2 postcodes'
      });
    }

    if (!venueType) {
      return res.status(400).json({
        error: 'Please provide a venue type'
      });
    }

    const results = await searchVenues(postcodes, venueType);
    res.json(results);
  } catch (error) {
    console.error('Error in venue search endpoint:', error);
    res.status(500).json({
      error: 'Failed to search venues',
      message: error.message
    });
  }
});

module.exports = router;