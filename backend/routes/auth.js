const express = require('express');
const router = express.Router();
const { authenticateUser } = require('../services/userService');

// POST /api/auth/login - Login user
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email) {
      return res.status(400).json({
        error: 'Email is required'
      });
    }
    
    if (!password) {
      return res.status(400).json({
        error: 'Password is required'
      });
    }
    
    const user = await authenticateUser(email, password);
    
    res.json({
      message: 'Login successful',
      user: user
    });
  } catch (error) {
    console.error('Error in POST /auth/login:', error);
    
    // Return generic error message for security
    if (error.message === 'Invalid email or password') {
      return res.status(401).json({
        error: 'Invalid email or password'
      });
    }
    
    res.status(500).json({
      error: 'Failed to login',
      message: error.message
    });
  }
});

module.exports = router;