const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { 
  createUser, 
  getUserById, 
  getUserByEmail, 
  getAllUsers, 
  updateUser, 
  deleteUser 
} = require('../services/userService');

// GET /api/users - Get all users
router.get('/', async (req, res) => {
  try {
    const users = await getAllUsers();
    res.json(users);
  } catch (error) {
    console.error('Error in GET /users:', error);
    res.status(500).json({
      error: 'Failed to fetch users',
      message: error.message
    });
  }
});

// GET /api/users/:id - Get user by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const user = await getUserById(id);
    
    if (!user) {
      return res.status(404).json({
        error: 'User not found'
      });
    }
    
    res.json(user);
  } catch (error) {
    console.error('Error in GET /users/:id:', error);
    res.status(500).json({
      error: 'Failed to fetch user',
      message: error.message
    });
  }
});

// GET /api/users/email/:email - Get user by email
router.get('/email/:email', async (req, res) => {
  try {
    const { email } = req.params;
    const user = await getUserByEmail(email);
    
    if (!user) {
      return res.status(404).json({
        error: 'User not found'
      });
    }
    
    res.json(user);
  } catch (error) {
    console.error('Error in GET /users/email/:email:', error);
    res.status(500).json({
      error: 'Failed to fetch user',
      message: error.message
    });
  }
});

// POST /api/users - Create new user
router.post('/', async (req, res) => {
  try {
    const { email, name, password, location } = req.body;
    
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
    
    if (password.length < 6) {
      return res.status(400).json({
        error: 'Password must be at least 6 characters long'
      });
    }

    if (!location) {
      return res.status(400).json({
        error: 'Default location is required'
      });
    }
    
    // Check if user already exists
    const existingUser = await getUserByEmail(email);
    if (existingUser) {
      return res.status(409).json({
        error: 'User with this email already exists'
      });
    }
    
    const user = await createUser({ email, name, password, location });
    
    // Generate JWT token for the new user
    const token = jwt.sign(
      { 
        userId: user.id, 
        email: user.email 
      },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    
    res.status(201).json({ 
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        location: user.location
      },
      token 
    });
  } catch (error) {
    console.error('Error in POST /users:', error);
    res.status(500).json({
      error: 'Failed to create user',
      message: error.message
    });
  }
});

// PUT /api/users/:id - Update user
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { email, name, location } = req.body;
    
    // Check if user exists
    const existingUser = await getUserById(id);
    if (!existingUser) {
      return res.status(404).json({
        error: 'User not found'
      });
    }
    
    // If email is being updated, check it's not taken by another user
    if (email && email !== existingUser.email) {
      const userWithEmail = await getUserByEmail(email);
      if (userWithEmail) {
        return res.status(409).json({
          error: 'Email is already taken by another user'
        });
      }
    }
    
    const updateData = {};
    if (email !== undefined) updateData.email = email;
    if (name !== undefined) updateData.name = name;
    if (location !== undefined) updateData.location = location;
    
    const user = await updateUser(id, updateData);
    res.json(user);
  } catch (error) {
    console.error('Error in PUT /users/:id:', error);
    res.status(500).json({
      error: 'Failed to update user',
      message: error.message
    });
  }
});

// DELETE /api/users/:id - Delete user
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if user exists
    const existingUser = await getUserById(id);
    if (!existingUser) {
      return res.status(404).json({
        error: 'User not found'
      });
    }
    
    await deleteUser(id);
    res.status(204).send();
  } catch (error) {
    console.error('Error in DELETE /users/:id:', error);
    res.status(500).json({
      error: 'Failed to delete user',
      message: error.message
    });
  }
});

module.exports = router;