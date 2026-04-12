import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';

const AuthContext = createContext();
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

export const useAuth = () => useContext(AuthContext);

const getApiErrorMessage = (error, fallbackMessage) => {
  if (!error?.response) {
    return 'Cannot reach backend API. Check backend server and REACT_APP_API_URL.';
  }
  const data = error?.response?.data;
  if (data?.error) return data.error;
  if (Array.isArray(data?.errors) && data.errors.length > 0) {
    return data.errors[0]?.msg || fallbackMessage;
  }
  return fallbackMessage;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Force a fresh auth session on every app start.
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    delete axios.defaults.headers.common.Authorization;
    setToken(null);
    setUser(null);
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/auth/login`, {
        email: email.trim(),
        password
      });
      const { token: nextToken, user: nextUser } = response.data;
      localStorage.setItem('token', nextToken);
      localStorage.setItem('user', JSON.stringify(nextUser));
      axios.defaults.headers.common.Authorization = `Bearer ${nextToken}`;
      setToken(nextToken);
      setUser(nextUser);
      toast.success('Login successful!');
      return true;
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Login failed'));
      return false;
    }
  };

  const register = async (username, email, password) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/auth/register`, {
        username: username.trim(),
        email: email.trim().toLowerCase(),
        password
      });
      const { token: nextToken, user: nextUser } = response.data;
      localStorage.setItem('token', nextToken);
      localStorage.setItem('user', JSON.stringify(nextUser));
      axios.defaults.headers.common.Authorization = `Bearer ${nextToken}`;
      setToken(nextToken);
      setUser(nextUser);
      toast.success('Registration successful!');
      return true;
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Registration failed'));
      return false;
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    delete axios.defaults.headers.common.Authorization;
    setToken(null);
    setUser(null);
    toast.success('Logged out successfully');
  };

  return (
    <AuthContext.Provider value={{ user, token, login, register, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};
