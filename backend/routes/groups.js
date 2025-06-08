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

// Create a new group
router.post('/create', authenticate, async (req, res) => {
  const { name, description } = req.body;
  const creatorId = req.userId;

  try {
    const group = await prisma.group.create({
      data: {
        name,
        description,
        creatorId,
        members: {
          create: {
            userId: creatorId,
            role: 'admin'
          }
        }
      },
      include: {
        members: {
          include: {
            user: {
              select: { id: true, email: true, name: true }
            }
          }
        }
      }
    });

    res.json(group);
  } catch (error) {
    console.error('Error creating group:', error);
    res.status(500).json({ error: 'Failed to create group' });
  }
});

// Get all groups for a user
router.get('/my-groups', authenticate, async (req, res) => {
  const userId = req.userId;

  try {
    const groups = await prisma.group.findMany({
      where: {
        members: {
          some: {
            userId
          }
        }
      },
      include: {
        members: {
          include: {
            user: {
              select: { id: true, email: true, name: true, location: true }
            }
          }
        },
        _count: {
          select: { members: true }
        }
      }
    });

    res.json(groups);
  } catch (error) {
    console.error('Error fetching groups:', error);
    res.status(500).json({ error: 'Failed to fetch groups' });
  }
});

// Get group details
router.get('/:id', authenticate, async (req, res) => {
  const { id } = req.params;
  const userId = req.userId;

  try {
    const group = await prisma.group.findUnique({
      where: { id },
      include: {
        members: {
          include: {
            user: {
              select: { id: true, email: true, name: true, location: true }
            }
          }
        },
        meetups: {
          orderBy: { date: 'desc' },
          take: 10
        }
      }
    });

    if (!group) {
      return res.status(404).json({ error: 'Group not found' });
    }

    // Check if user is a member
    const isMember = group.members.some(member => member.userId === userId);
    if (!isMember) {
      return res.status(403).json({ error: 'Not a member of this group' });
    }

    res.json(group);
  } catch (error) {
    console.error('Error fetching group:', error);
    res.status(500).json({ error: 'Failed to fetch group' });
  }
});

// Add member to group
router.post('/:id/members', authenticate, async (req, res) => {
  const { id } = req.params;
  const { email } = req.body;
  const userId = req.userId;

  try {
    // Check if requester is admin
    const requesterMembership = await prisma.groupMember.findFirst({
      where: {
        groupId: id,
        userId,
        role: 'admin'
      }
    });

    if (!requesterMembership) {
      return res.status(403).json({ error: 'Only admins can add members' });
    }

    // Find user by email
    const userToAdd = await prisma.user.findUnique({
      where: { email }
    });

    if (!userToAdd) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check if user is already a member
    const existingMembership = await prisma.groupMember.findUnique({
      where: {
        groupId_userId: {
          groupId: id,
          userId: userToAdd.id
        }
      }
    });

    if (existingMembership) {
      return res.status(400).json({ error: 'User is already a member' });
    }

    // Add member
    const membership = await prisma.groupMember.create({
      data: {
        groupId: id,
        userId: userToAdd.id,
        role: 'member'
      },
      include: {
        user: {
          select: { id: true, email: true, name: true }
        }
      }
    });

    res.json(membership);
  } catch (error) {
    console.error('Error adding member:', error);
    res.status(500).json({ error: 'Failed to add member' });
  }
});

// Remove member from group
router.delete('/:id/members/:memberId', authenticate, async (req, res) => {
  const { id, memberId } = req.params;
  const userId = req.userId;

  try {
    // Check if requester is admin or removing themselves
    const requesterMembership = await prisma.groupMember.findFirst({
      where: {
        groupId: id,
        userId
      }
    });

    if (!requesterMembership) {
      return res.status(403).json({ error: 'Not a member of this group' });
    }

    const memberToRemove = await prisma.groupMember.findFirst({
      where: {
        groupId: id,
        userId: memberId
      }
    });

    if (!memberToRemove) {
      return res.status(404).json({ error: 'Member not found' });
    }

    // Only admins can remove others, but anyone can leave
    if (memberId !== userId && requesterMembership.role !== 'admin') {
      return res.status(403).json({ error: 'Only admins can remove other members' });
    }

    await prisma.groupMember.delete({
      where: { id: memberToRemove.id }
    });

    res.json({ message: 'Member removed successfully' });
  } catch (error) {
    console.error('Error removing member:', error);
    res.status(500).json({ error: 'Failed to remove member' });
  }
});

// Create a meetup for a group
router.post('/:id/meetups', authenticate, async (req, res) => {
  const { id } = req.params;
  const { name, description, date, location } = req.body;
  const userId = req.userId;

  try {
    // Check if user is a member
    const membership = await prisma.groupMember.findFirst({
      where: {
        groupId: id,
        userId
      }
    });

    if (!membership) {
      return res.status(403).json({ error: 'Not a member of this group' });
    }

    // Create meetup
    const meetup = await prisma.meetup.create({
      data: {
        groupId: id,
        name,
        description,
        date: new Date(date),
        location
      },
      include: {
        group: {
          include: {
            members: {
              include: {
                user: {
                  select: { id: true, email: true, name: true, location: true }
                }
              }
            }
          }
        }
      }
    });

    res.json(meetup);
  } catch (error) {
    console.error('Error creating meetup:', error);
    res.status(500).json({ error: 'Failed to create meetup' });
  }
});

// Get meetups for a group
router.get('/:id/meetups', authenticate, async (req, res) => {
  const { id } = req.params;
  const userId = req.userId;

  try {
    // Check if user is a member
    const membership = await prisma.groupMember.findFirst({
      where: {
        groupId: id,
        userId
      }
    });

    if (!membership) {
      return res.status(403).json({ error: 'Not a member of this group' });
    }

    const meetups = await prisma.meetup.findMany({
      where: { groupId: id },
      orderBy: { date: 'desc' },
      include: {
        group: {
          include: {
            members: {
              include: {
                user: {
                  select: { id: true, email: true, name: true, location: true }
                }
              }
            }
          }
        }
      }
    });

    res.json(meetups);
  } catch (error) {
    console.error('Error fetching meetups:', error);
    res.status(500).json({ error: 'Failed to fetch meetups' });
  }
});

module.exports = router;