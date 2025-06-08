import { createContext, useContext, useState, useEffect } from 'react';

export const UserContext = createContext();

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Initialize user from localStorage on mount
  useEffect(() => {
    const savedUser = localStorage.getItem('meetme_user');
    const savedToken = localStorage.getItem('authToken');
    if (savedUser && savedToken) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (error) {
        console.error('Error parsing saved user:', error);
        localStorage.removeItem('meetme_user');
        localStorage.removeItem('authToken');
      }
    }
    setLoading(false);
  }, []);

  const login = (userData, token) => {
    setUser(userData);
    localStorage.setItem('meetme_user', JSON.stringify(userData));
    if (token) {
      localStorage.setItem('authToken', token);
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('meetme_user');
    localStorage.removeItem('authToken');
  };

  const updateUser = (updatedData) => {
    setUser(updatedData);
    localStorage.setItem('meetme_user', JSON.stringify(updatedData));
  };

  const value = {
    user,
    login,
    logout,
    updateUser,
    loading,
    isLoggedIn: !!user
  };

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
};