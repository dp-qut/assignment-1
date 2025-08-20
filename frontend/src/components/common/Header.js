import React, { useState } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Box,
  IconButton,
  Menu,
  MenuItem,
  Avatar,
  Button,
  Divider,
  ListItemIcon,
  ListItemText,
  useTheme,
  useMediaQuery
} from '@mui/material';
import {
  Logout,
  Settings,
  Person,
  Home,
  Dashboard as DashboardIcon
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const Header = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { user, logout } = useAuth();

  const [anchorEl, setAnchorEl] = useState(null);

  const handleProfileMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleProfileMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = async () => {
    handleProfileMenuClose();
    await logout();
    navigate('/login');
  };

  const handleProfile = () => {
    handleProfileMenuClose();
    navigate('/profile');
  };

  const handleSettings = () => {
    handleProfileMenuClose();
    navigate('/settings');
  };

  const handleNavigation = (path) => {
    navigate(path);
  };

  const getPageTitle = () => {
    const path = location.pathname;
    if (path === '/dashboard') return 'Dashboard';
    if (path === '/admin') return 'Admin Dashboard';
    if (path === '/profile') return 'Profile';
    if (path === '/settings') return 'Settings';
    if (path.startsWith('/applications/')) return 'Application Details';
    return 'E-Visa Portal';
  };

  const getInitials = (firstName, lastName) => {
    return `${firstName?.charAt(0) || ''}${lastName?.charAt(0) || ''}`.toUpperCase();
  };

  const isProfileMenuOpen = Boolean(anchorEl);

  return (
    <AppBar position="sticky" elevation={1} sx={{ zIndex: theme.zIndex.drawer + 1 }}>
      <Toolbar variant="dense" sx={{ minHeight: { xs: 56, sm: 64 } }}>
        {/* Logo/Brand */}
        <Box display="flex" alignItems="center" sx={{ flexGrow: isMobile ? 1 : 0, mr: 2 }}>
          <IconButton
            edge="start"
            color="inherit"
            onClick={() => handleNavigation(user?.role === 'admin' ? '/admin' : '/dashboard')}
          >
            <Home />
          </IconButton>
          <Typography
            variant="h6"
            component="div"
            sx={{ 
              display: { xs: 'none', sm: 'block' },
              fontWeight: 'bold',
              cursor: 'pointer'
            }}
            onClick={() => handleNavigation(user?.role === 'admin' ? '/admin' : '/dashboard')}
          >
            E-Visa Portal
          </Typography>
        </Box>

        {/* Navigation Menu for larger screens */}
        {!isMobile && (
          <Box sx={{ flexGrow: 1, display: 'flex', ml: 2 }}>
            {/* No navigation buttons for users */}
          </Box>
        )}

        {/* Page Title for mobile */}
        {isMobile && (
          <Typography variant="h6" component="div" sx={{ flexGrow: 1, textAlign: 'center' }}>
            {getPageTitle()}
          </Typography>
        )}

        {/* Right side - User actions */}
        <Box display="flex" alignItems="center">
          {/* User Profile */}
          <Box display="flex" alignItems="center">
            {!isMobile && (
              <Box sx={{ mr: 2, textAlign: 'right' }}>
                <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                  {user?.profile?.firstName} {user?.profile?.lastName}
                </Typography>
                <Typography variant="caption" sx={{ opacity: 0.8 }}>
                  {user?.role === 'admin' ? 'Administrator' : 'User'}
                </Typography>
              </Box>
            )}
            
            <IconButton
              edge="end"
              onClick={handleProfileMenuOpen}
              color="inherit"
            >
              {user?.profile?.avatar ? (
                <Avatar
                  src={user.profile.avatar}
                  alt={user.profile.firstName}
                  sx={{ width: 32, height: 32 }}
                />
              ) : (
                <Avatar sx={{ width: 32, height: 32, bgcolor: 'secondary.main' }}>
                  {getInitials(user?.profile?.firstName, user?.profile?.lastName)}
                </Avatar>
              )}
            </IconButton>
          </Box>
        </Box>

        {/* Profile Menu */}
        <Menu
          anchorEl={anchorEl}
          open={isProfileMenuOpen}
          onClose={handleProfileMenuClose}
          onClick={handleProfileMenuClose}
          PaperProps={{
            elevation: 3,
            sx: {
              overflow: 'visible',
              filter: 'drop-shadow(0px 2px 8px rgba(0,0,0,0.32))',
              mt: 1.5,
              minWidth: 200,
              '& .MuiAvatar-root': {
                width: 32,
                height: 32,
                ml: -0.5,
                mr: 1,
              }
            },
          }}
          transformOrigin={{ horizontal: 'right', vertical: 'top' }}
          anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        >
          {/* User Info Header */}
          <Box sx={{ px: 2, py: 1.5, bgcolor: 'grey.50' }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
              {user?.profile?.firstName} {user?.profile?.lastName}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {user?.email}
            </Typography>
          </Box>
          
          <Divider />
          
          {/* Menu Items */}
          <MenuItem onClick={handleProfile}>
            <ListItemIcon>
              <Person fontSize="small" />
            </ListItemIcon>
            <ListItemText>Profile</ListItemText>
          </MenuItem>
          
          <MenuItem onClick={handleSettings}>
            <ListItemIcon>
              <Settings fontSize="small" />
            </ListItemIcon>
            <ListItemText>Settings</ListItemText>
          </MenuItem>
          
          <Divider />
          
          <MenuItem onClick={handleLogout} sx={{ color: 'error.main' }}>
            <ListItemIcon>
              <Logout fontSize="small" sx={{ color: 'error.main' }} />
            </ListItemIcon>
            <ListItemText>Logout</ListItemText>
          </MenuItem>
        </Menu>
      </Toolbar>
    </AppBar>
  );
};

export default Header;
