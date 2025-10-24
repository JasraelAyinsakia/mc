import React, { createContext, useState, useContext, useEffect, useCallback, useRef } from 'react';
import { authAPI } from '../utils/api';
import { useNavigate, useLocation } from 'react-router-dom';

const AuthContext = createContext(null);

// Auto-logout after 10 minutes of inactivity (in milliseconds)
const INACTIVITY_TIMEOUT = 10 * 60 * 1000; // 10 minutes

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const inactivityTimerRef = useRef(null);
  const lastActivityRef = useRef(Date.now());

  useEffect(() => {
    // Check if user is logged in on mount
    checkAuth();
    
    // Set up activity tracking
    const handleActivity = () => {
      lastActivityRef.current = Date.now();
    };

    // Track user activity
    const events = ['mousedown', 'keydown', 'scroll', 'touchstart', 'click'];
    events.forEach(event => {
      document.addEventListener(event, handleActivity);
    });

    // Check for inactivity every minute
    const checkInactivity = setInterval(() => {
      const timeSinceLastActivity = Date.now() - lastActivityRef.current;
      if (user && timeSinceLastActivity >= INACTIVITY_TIMEOUT) {
        handleInactivityLogout();
      }
    }, 60000); // Check every minute

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, handleActivity);
      });
      clearInterval(checkInactivity);
      if (inactivityTimerRef.current) {
        clearTimeout(inactivityTimerRef.current);
      }
    };
  }, [user]);

  const checkAuth = async () => {
    try {
      const response = await authAPI.getCurrentUser();
      setUser(response.data.user);
      lastActivityRef.current = Date.now();
    } catch (error) {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const handleInactivityLogout = useCallback(() => {
    // Save current location before logout
    if (window.location.pathname !== '/login' && window.location.pathname !== '/register') {
      sessionStorage.setItem('returnPath', window.location.pathname);
      sessionStorage.setItem('logoutReason', 'inactivity');
    }
    
    // Logout user
    logout();
    
    // Redirect to login
    window.location.href = '/login';
  }, []);

  const login = async (credentials) => {
    try {
      setError(null);
      const response = await authAPI.login(credentials);
      setUser(response.data.user);
      lastActivityRef.current = Date.now();
      
      // Check if there's a return path
      const returnPath = sessionStorage.getItem('returnPath');
      const logoutReason = sessionStorage.getItem('logoutReason');
      
      // Clear stored values
      sessionStorage.removeItem('returnPath');
      sessionStorage.removeItem('logoutReason');
      
      return { 
        success: true, 
        returnPath: returnPath || '/dashboard',
        wasInactive: logoutReason === 'inactivity'
      };
    } catch (error) {
      const errorMessage = error.response?.data?.error || 'Login failed';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  const register = async (userData) => {
    try {
      setError(null);
      const response = await authAPI.register(userData);
      setUser(response.data.user);
      return { success: true };
    } catch (error) {
      const errorMessage = error.response?.data?.error || 'Registration failed';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  const logout = async (saveLocation = false) => {
    // Optionally save location before logout
    if (saveLocation && window.location.pathname !== '/login' && window.location.pathname !== '/register') {
      sessionStorage.setItem('returnPath', window.location.pathname);
    }
    
    try {
      await authAPI.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setUser(null);
      lastActivityRef.current = Date.now();
    }
  };

  const updateUser = (updatedUser) => {
    setUser(updatedUser);
  };

  const value = {
    user,
    loading,
    error,
    login,
    register,
    logout,
    updateUser,
    isAuthenticated: !!user,
    isSingle: user?.role === 'single',
    isCommitteeMember: user?.role === 'committee_member',
    isCentralCommittee: user?.role === 'central_committee',
    isOverseer: user?.role === 'overseer',
    isCommittee: ['committee_member', 'central_committee', 'overseer'].includes(user?.role),
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

