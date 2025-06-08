const express = require('express');
const router = express.Router();
const prisma = require('../lib/prisma');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Middleware to authenticate user
const authenticate = async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.userId = decoded.userId;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' });
  }
};

// Send friend request
router.post('/request', authenticate, async (req, res) => {
  const { email } = req.body;
  const senderId = req.userId;

  try {
    // Find receiver by email
    const receiver = await prisma.user.findUnique({
      where: { email }
    });

    if (!receiver) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (receiver.id === senderId) {
      return res.status(400).json({ error: 'Cannot send friend request to yourself' });
    }

    // Check if friendship already exists
    const existingFriendship = await prisma.friendship.findFirst({
      where: {
        OR: [
          { senderId, receiverId: receiver.id },
          { senderId: receiver.id, receiverId: senderId }
        ]
      }
    });

    if (existingFriendship) {
      return res.status(400).json({ error: 'Friend request already exists' });
    }

    // Create friend request
    const friendship = await prisma.friendship.create({
      data: {
        senderId,
        receiverId: receiver.id,
        status: 'pending'
      },
      include: {
        receiver: {
          select: { id: true, email: true, name: true }
        }
      }
    });

    res.json(friendship);
  } catch (error) {
    console.error('Error sending friend request:', error);
    res.status(500).json({ error: 'Failed to send friend request' });
  }
});

// Accept/reject friend request
router.put('/request/:id', authenticate, async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  const userId = req.userId;

  if (!['accepted', 'rejected'].includes(status)) {
    return res.status(400).json({ error: 'Invalid status' });
  }

  try {
    // Find the friendship request
    const friendship = await prisma.friendship.findUnique({
      where: { id }
    });

    if (!friendship) {
      return res.status(404).json({ error: 'Friend request not found' });
    }

    // Only the receiver can accept/reject
    if (friendship.receiverId !== userId) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    // Update friendship status
    const updatedFriendship = await prisma.friendship.update({
      where: { id },
      data: { status },
      include: {
        sender: {
          select: { id: true, email: true, name: true }
        }
      }
    });

    res.json(updatedFriendship);
  } catch (error) {
    console.error('Error updating friend request:', error);
    res.status(500).json({ error: 'Failed to update friend request' });
  }
});

// Get all friends (accepted friendships)
router.get('/list', authenticate, async (req, res) => {
  const userId = req.userId;

  try {
    const friendships = await prisma.friendship.findMany({
      where: {
        AND: [
          { status: 'accepted' },
          {
            OR: [
              { senderId: userId },
              { receiverId: userId }
            ]
          }
        ]
      },
      include: {
        sender: {
          select: { id: true, email: true, name: true, location: true }
        },
        receiver: {
          select: { id: true, email: true, name: true, location: true }
        }
      }
    });

    // Format the response to return friend data
    const friends = friendships.map(friendship => {
      const friend = friendship.senderId === userId ? friendship.receiver : friendship.sender;
      return {
        id: friendship.id,
        friend,
        createdAt: friendship.createdAt
      };
    });

    res.json(friends);
  } catch (error) {
    console.error('Error fetching friends:', error);
    res.status(500).json({ error: 'Failed to fetch friends' });
  }
});

// Get pending friend requests
router.get('/requests/pending', authenticate, async (req, res) => {
  const userId = req.userId;

  try {
    const pendingRequests = await prisma.friendship.findMany({
      where: {
        receiverId: userId,
        status: 'pending'
      },
      include: {
        sender: {
          select: { id: true, email: true, name: true }
        }
      }
    });

    res.json(pendingRequests);
  } catch (error) {
    console.error('Error fetching pending requests:', error);
    res.status(500).json({ error: 'Failed to fetch pending requests' });
  }
});

// Remove friend
router.delete('/:id', authenticate, async (req, res) => {
  const { id } = req.params;
  const userId = req.userId;

  try {
    const friendship = await prisma.friendship.findUnique({
      where: { id }
    });

    if (!friendship) {
      return res.status(404).json({ error: 'Friendship not found' });
    }

    // Check if user is part of this friendship
    if (friendship.senderId !== userId && friendship.receiverId !== userId) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    await prisma.friendship.delete({
      where: { id }
    });

    res.json({ message: 'Friend removed successfully' });
  } catch (error) {
    console.error('Error removing friend:', error);
    res.status(500).json({ error: 'Failed to remove friend' });
  }
});

module.exports = router;