import React, { createContext, useContext, useReducer, useEffect, useCallback } from 'react';
import { toast } from 'react-hot-toast';
import authService from '../services/authService';

// Auth Context
const AuthContext = createContext();

// Action types
const AUTH_ACTIONS = {
  SET_LOADING: 'SET_LOADING',
  SET_USER: 'SET_USER',
  SET_TOKEN: 'SET_TOKEN',
  SET_ERROR: 'SET_ERROR',
  CLEAR_ERROR: 'CLEAR_ERROR',
  LOGOUT: 'LOGOUT',
  SET_AUTHENTICATING: 'SET_AUTHENTICATING'
};

// Initial state
const initialState = {
  user: null,
  token: localStorage.getItem('token'),
  loading: true,
  authenticating: false,
  error: null,
  isAuthenticated: false
};

// Auth reducer
const authReducer = (state, action) => {
  switch (action.type) {
    case AUTH_ACTIONS.SET_LOADING:
      return {
        ...state,
        loading: action.payload
      };
    
    case AUTH_ACTIONS.SET_AUTHENTICATING:
      return {
        ...state,
        authenticating: action.payload
      };
    
    case AUTH_ACTIONS.SET_USER:
      return {
        ...state,
        user: action.payload,
        isAuthenticated: !!action.payload,
        loading: false,
        authenticating: false,
        error: null
      };
    
    case AUTH_ACTIONS.SET_TOKEN:
      return {
        ...state,
        token: action.payload
      };
    
    case AUTH_ACTIONS.SET_ERROR:
      return {
        ...state,
        error: action.payload,
        loading: false,
        authenticating: false
      };
    
    case AUTH_ACTIONS.CLEAR_ERROR:
      return {
        ...state,
        error: null
      };
    
    case AUTH_ACTIONS.LOGOUT:
      return {
        ...initialState,
        loading: false,
        token: null
      };
    
    default:
      return state;
  }
};

// Auth Provider Component
export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Set token in localStorage and axios headers
  const setToken = useCallback((token) => {
    if (token) {
      localStorage.setItem('token', token);
      authService.setAuthToken(token);
    } else {
      localStorage.removeItem('token');
      authService.removeAuthToken();
    }
    dispatch({ type: AUTH_ACTIONS.SET_TOKEN, payload: token });
  }, []);

  // Clear error
  const clearError = useCallback(() => {
    dispatch({ type: AUTH_ACTIONS.CLEAR_ERROR });
  }, []);

  // Register user
  const register = useCallback(async (userData) => {
    try {
      dispatch({ type: AUTH_ACTIONS.SET_AUTHENTICATING, payload: true });
      dispatch({ type: AUTH_ACTIONS.CLEAR_ERROR });

      const response = await authService.register(userData);
      
      if (response.success) {
        toast.success(response.message || 'Registration successful! Please check your email to verify your account.');
        return { success: true, message: response.message };
      } else {
        throw new Error(response.message || 'Registration failed');
      }
    } catch (error) {
      const message = error.response?.data?.message || error.message || 'Registration failed';
      dispatch({ type: AUTH_ACTIONS.SET_ERROR, payload: message });
      toast.error(message);
      return { success: false, message };
    }
  }, []);

  // Login user
  const login = useCallback(async (credentials) => {
    try {
      dispatch({ type: AUTH_ACTIONS.SET_AUTHENTICATING, payload: true });
      dispatch({ type: AUTH_ACTIONS.CLEAR_ERROR });

      const response = await authService.login(credentials);
      
      if (response.success && response.data) {
        const { user, token } = response.data;
        
        // Set token
        setToken(token);
        
        // Set user
        dispatch({ type: AUTH_ACTIONS.SET_USER, payload: user });
        
        toast.success(`Welcome back, ${user.firstName}!`);
        return { success: true, user };
      } else {
        throw new Error(response.message || 'Login failed');
      }
    } catch (error) {
      const message = error.response?.data?.message || error.message || 'Login failed';
      dispatch({ type: AUTH_ACTIONS.SET_ERROR, payload: message });
      toast.error(message);
      return { success: false, message };
    }
  }, [setToken]);

  // Logout user
  const logout = useCallback(async () => {
    try {
      // Call logout endpoint to invalidate server-side session
      await authService.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Clear local state regardless of server response
      setToken(null);
      dispatch({ type: AUTH_ACTIONS.LOGOUT });
      toast.success('Logged out successfully');
    }
  }, [setToken]);

  // Get current user data
  const getMe = useCallback(async () => {
    try {
      const response = await authService.getMe();
      
      if (response.success && response.data) {
        dispatch({ type: AUTH_ACTIONS.SET_USER, payload: response.data.user });
        return response.data.user;
      } else {
        throw new Error('Failed to get user data');
      }
    } catch (error) {
      console.error('Get user error:', error);
      // If token is invalid, logout user
      if (error.response?.status === 401) {
        logout();
      }
      throw error;
    }
  }, [logout]);

  // Check authentication status
  const checkAuthStatus = useCallback(async () => {
    const token = localStorage.getItem('token');
    
    if (!token) {
      dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: false });
      return;
    }

    try {
      // Set token in headers
      authService.setAuthToken(token);
      
      // Check if token is valid and get user data
      await getMe();
    } catch (error) {
      console.error('Auth check error:', error);
      // Token is invalid, clear it
      setToken(null);
      dispatch({ type: AUTH_ACTIONS.LOGOUT });
    } finally {
      dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: false });
    }
  }, [getMe, setToken]);

  // Update user profile
  const updateProfile = useCallback(async (profileData) => {
    try {
      const response = await authService.updateProfile(profileData);
      
      if (response.success && response.data) {
        dispatch({ type: AUTH_ACTIONS.SET_USER, payload: response.data.user });
        toast.success('Profile updated successfully');
        return { success: true, user: response.data.user };
      } else {
        throw new Error(response.message || 'Profile update failed');
      }
    } catch (error) {
      const message = error.response?.data?.message || error.message || 'Profile update failed';
      toast.error(message);
      return { success: false, message };
    }
  }, []);

  // Update user data (for internal state updates)
  const updateUser = useCallback((userData) => {
    dispatch({ type: AUTH_ACTIONS.SET_USER, payload: { ...state.user, ...userData } });
  }, [state.user]);

  // Change password
  const changePassword = useCallback(async (passwordData) => {
    try {
      const response = await authService.changePassword(passwordData);
      
      if (response.success) {
        toast.success('Password changed successfully');
        return { success: true };
      } else {
        throw new Error(response.message || 'Password change failed');
      }
    } catch (error) {
      const message = error.response?.data?.message || error.message || 'Password change failed';
      toast.error(message);
      return { success: false, message };
    }
  }, []);

  // Verify email
  const verifyEmail = useCallback(async (token) => {
    try {
      const response = await authService.verifyEmail(token);
      
      if (response.success) {
        toast.success('Email verified successfully!');
        // Refresh user data to update emailVerified status
        if (state.user) {
          await getMe();
        }
        return { success: true };
      } else {
        throw new Error(response.message || 'Email verification failed');
      }
    } catch (error) {
      const message = error.response?.data?.message || error.message || 'Email verification failed';
      toast.error(message);
      return { success: false, message };
    }
  }, [state.user, getMe]);

  // Resend verification email
  const resendVerification = useCallback(async (email) => {
    try {
      const response = await authService.resendVerification(email);
      
      if (response.success) {
        toast.success('Verification email sent successfully');
        return { success: true };
      } else {
        throw new Error(response.message || 'Failed to send verification email');
      }
    } catch (error) {
      const message = error.response?.data?.message || error.message || 'Failed to send verification email';
      toast.error(message);
      return { success: false, message };
    }
  }, []);

  // Forgot password
  const forgotPassword = useCallback(async (email) => {
    try {
      const response = await authService.forgotPassword(email);
      
      if (response.success) {
        toast.success('Password reset email sent successfully');
        return { success: true };
      } else {
        throw new Error(response.message || 'Failed to send password reset email');
      }
    } catch (error) {
      const message = error.response?.data?.message || error.message || 'Failed to send password reset email';
      toast.error(message);
      return { success: false, message };
    }
  }, []);

  // Reset password
  const resetPassword = useCallback(async (token, password) => {
    try {
      const response = await authService.resetPassword(token, password);
      
      if (response.success) {
        toast.success('Password reset successfully');
        return { success: true };
      } else {
        throw new Error(response.message || 'Password reset failed');
      }
    } catch (error) {
      const message = error.response?.data?.message || error.message || 'Password reset failed';
      toast.error(message);
      return { success: false, message };
    }
  }, []);

  // Delete account
  const deleteAccount = useCallback(async (password) => {
    try {
      const response = await authService.deleteAccount(password);
      
      if (response.success) {
        toast.success('Account deleted successfully');
        // Logout user after successful deletion
        setToken(null);
        dispatch({ type: AUTH_ACTIONS.LOGOUT });
        return { success: true };
      } else {
        throw new Error(response.message || 'Account deletion failed');
      }
    } catch (error) {
      const message = error.response?.data?.message || error.message || 'Account deletion failed';
      toast.error(message);
      return { success: false, message };
    }
  }, [setToken]);

  // Check if user has permission
  const hasPermission = useCallback((permission) => {
    if (!state.user) return false;
    
    // Admin has all permissions
    if (state.user.role === 'admin') return true;
    
    // Add specific permission logic here
    switch (permission) {
      case 'create_application':
        return state.user.role === 'user' && state.user.emailVerified;
      case 'admin_access':
        return state.user.role === 'admin';
      default:
        return false;
    }
  }, [state.user]);

  // Check if user is admin
  const isAdmin = useCallback(() => {
    return state.user?.role === 'admin';
  }, [state.user]);

  // Check if user is verified
  const isVerified = useCallback(() => {
    return state.user?.emailVerified === true;
  }, [state.user]);

  // Initialize auth on mount
  useEffect(() => {
    checkAuthStatus();
  }, [checkAuthStatus]);

  // Context value
  const value = {
    // State
    user: state.user,
    token: state.token,
    loading: state.loading,
    authenticating: state.authenticating,
    error: state.error,
    isAuthenticated: state.isAuthenticated,
    
    // Actions
    register,
    login,
    logout,
    updateProfile,
    updateUser,
    changePassword,
    verifyEmail,
    resendVerification,
    forgotPassword,
    resetPassword,
    deleteAccount,
    clearError,
    checkAuthStatus,
    getMe,
    
    // Utility functions
    hasPermission,
    isAdmin,
    isVerified
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
};

// HOC for components that require authentication
export const withAuth = (Component) => {
  return function AuthenticatedComponent(props) {
    const { isAuthenticated, loading } = useAuth();
    
    if (loading) {
      return <div>Loading...</div>; // You can replace with a proper loading component
    }
    
    if (!isAuthenticated) {
      return <div>Access denied. Please log in.</div>;
    }
    
    return <Component {...props} />;
  };
};

// HOC for components that require admin access
export const withAdminAuth = (Component) => {
  return function AdminAuthenticatedComponent(props) {
    const { isAuthenticated, isAdmin, loading } = useAuth();
    
    if (loading) {
      return <div>Loading...</div>; // You can replace with a proper loading component
    }
    
    if (!isAuthenticated || !isAdmin()) {
      return <div>Access denied. Admin privileges required.</div>;
    }
    
    return <Component {...props} />;
  };
};

export default AuthContext;