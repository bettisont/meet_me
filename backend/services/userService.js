const prisma = require('../lib/prisma');

const createUser = async (userData) => {
  try {
    const user = await prisma.user.create({
      data: {
        email: userData.email,
        name: userData.name,
      },
    });
    return user;
  } catch (error) {
    console.error('Error creating user:', error);
    throw error;
  }
};

const getUserById = async (id) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id },
    });
    return user;
  } catch (error) {
    console.error('Error getting user by ID:', error);
    throw error;
  }
};

const getUserByEmail = async (email) => {
  try {
    const user = await prisma.user.findUnique({
      where: { email },
    });
    return user;
  } catch (error) {
    console.error('Error getting user by email:', error);
    throw error;
  }
};

const getAllUsers = async () => {
  try {
    const users = await prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return users;
  } catch (error) {
    console.error('Error getting all users:', error);
    throw error;
  }
};

const updateUser = async (id, userData) => {
  try {
    const user = await prisma.user.update({
      where: { id },
      data: userData,
    });
    return user;
  } catch (error) {
    console.error('Error updating user:', error);
    throw error;
  }
};

const deleteUser = async (id) => {
  try {
    const user = await prisma.user.delete({
      where: { id },
    });
    return user;
  } catch (error) {
    console.error('Error deleting user:', error);
    throw error;
  }
};

module.exports = {
  createUser,
  getUserById,
  getUserByEmail,
  getAllUsers,
  updateUser,
  deleteUser,
};