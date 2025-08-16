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
  Badge,
  useTheme,
  useMediaQuery
} from '@mui/material';
import {
  Logout,
  Settings,
  Person,
  Notifications,
  Home,
  Dashboard as DashboardIcon,
  AdminPanelSettings
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
  const [notificationAnchorEl, setNotificationAnchorEl] = useState(null);

  const handleProfileMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleProfileMenuClose = () => {
    setAnchorEl(null);
  };

  const handleNotificationMenuOpen = (event) => {
    setNotificationAnchorEl(event.currentTarget);
  };

  const handleNotificationMenuClose = () => {
    setNotificationAnchorEl(null);
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
  const isNotificationMenuOpen = Boolean(notificationAnchorEl);

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
            {user?.role !== 'admin' && (
              <Button
                color="inherit"
                startIcon={<DashboardIcon />}
                onClick={() => handleNavigation('/dashboard')}
                sx={{
                  backgroundColor: location.pathname === '/dashboard' ? 'rgba(255,255,255,0.1)' : 'transparent'
                }}
              >
                Dashboard
              </Button>
            )}
            
            {user?.role === 'admin' && (
              <Button
                color="inherit"
                startIcon={<AdminPanelSettings />}
                onClick={() => handleNavigation('/admin')}
                sx={{
                  backgroundColor: location.pathname === '/admin' ? 'rgba(255,255,255,0.1)' : 'transparent'
                }}
              >
                Admin
              </Button>
            )}
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
          {/* Notifications */}
          <IconButton
            color="inherit"
            onClick={handleNotificationMenuOpen}
            sx={{ mr: 1 }}
          >
            <Badge badgeContent={3} color="error">
              <Notifications />
            </Badge>
          </IconButton>

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

        {/* Notifications Menu */}
        <Menu
          anchorEl={notificationAnchorEl}
          open={isNotificationMenuOpen}
          onClose={handleNotificationMenuClose}
          onClick={handleNotificationMenuClose}
          PaperProps={{
            elevation: 3,
            sx: {
              overflow: 'visible',
              filter: 'drop-shadow(0px 2px 8px rgba(0,0,0,0.32))',
              mt: 1.5,
              minWidth: 300,
              maxHeight: 400
            },
          }}
          transformOrigin={{ horizontal: 'right', vertical: 'top' }}
          anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        >
          <Box sx={{ px: 2, py: 1.5, bgcolor: 'grey.50' }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
              Notifications
            </Typography>
          </Box>
          
          <Divider />
          
          {/* Sample notifications - replace with real data */}
          <MenuItem>
            <Box>
              <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                Application Update
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Your visa application #VIS-2024-001 has been approved
              </Typography>
              <Typography variant="caption" color="text.secondary" display="block">
                2 hours ago
              </Typography>
            </Box>
          </MenuItem>
          
          <MenuItem>
            <Box>
              <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                Document Required
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Additional documents needed for application #VIS-2024-002
              </Typography>
              <Typography variant="caption" color="text.secondary" display="block">
                1 day ago
              </Typography>
            </Box>
          </MenuItem>
          
          <MenuItem>
            <Box>
              <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                Welcome!
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Welcome to E-Visa Portal. Complete your profile to get started.
              </Typography>
              <Typography variant="caption" color="text.secondary" display="block">
                3 days ago
              </Typography>
            </Box>
          </MenuItem>
          
          <Divider />
          
          <MenuItem sx={{ justifyContent: 'center' }}>
            <Button size="small" variant="text">
              View All Notifications
            </Button>
          </MenuItem>
        </Menu>
      </Toolbar>
    </AppBar>
  );
};

export default Header;
