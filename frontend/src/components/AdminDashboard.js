import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  IconButton,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Tabs,
  Tab,
  Alert,
  Snackbar,
  CircularProgress,
  useTheme,
  useMediaQuery,
  Avatar,
  FormControl,
  InputLabel,
  Select,
  Badge
} from '@mui/material';
import {
  People as PeopleIcon,
  Description as ApplicationIcon,
  Assessment as ReportsIcon,
  Edit as EditIcon,
  CheckCircle as ApproveIcon,
  Refresh as RefreshIcon,
  GetApp as ExportIcon,
  RateReview as ReviewIcon,
  Delete as DeleteIcon,
  Today as TodayIcon,
  Pending as PendingIcon
} from '@mui/icons-material';
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';
import { adminService } from '../services/api';
import Layout from './common/Layout';
import { useAuth } from '../contexts/AuthContext';
import DashboardStats from './admin/DashboardStats';
import ApplicationDetailsDialog from './admin/ApplicationDetailsDialog';

const AdminDashboard = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { user } = useAuth();
  
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [dashboardStats, setDashboardStats] = useState(null);
  const [chartData, setChartData] = useState({
    statusDistribution: [],
    applicationTrends: []
  });
  
  // Applications data
  const [applications, setApplications] = useState([]);
  const [applicationPage, setApplicationPage] = useState(0);
  const [applicationRowsPerPage, setApplicationRowsPerPage] = useState(10);
  const [applicationFilters, setApplicationFilters] = useState({
    status: '',
    visaType: '',
    dateRange: '30d'
  });
  
  // Users data
  const [users, setUsers] = useState([]);
  const [userPage, setUserPage] = useState(0);
  const [userRowsPerPage, setUserRowsPerPage] = useState(10);
  const [userFilters, setUserFilters] = useState({
    status: '',
    role: '',
    search: ''
  });
  
  // Dialogs
  const [applicationDetailsDialog, setApplicationDetailsDialog] = useState({ open: false, application: null });
  const [userDialog, setUserDialog] = useState({ open: false, user: null });

  useEffect(() => {
    setLoading(true);
    if (activeTab === 0) {
      loadDashboardStats();
    } else if (activeTab === 1) {
      loadApplications();
    } else if (activeTab === 2) {
      loadUsers();
    }
  }, [activeTab, applicationPage, applicationRowsPerPage, userPage, userRowsPerPage, applicationFilters, userFilters]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadDashboardStats = async () => {
    try {
      const [statsResponse, appsResponse] = await Promise.all([
        adminService.getDashboardStats(),
        adminService.getAllApplications({ limit: 1000 })
      ]);
      
      setDashboardStats(statsResponse.data.data.stats);
      
      // Process chart data
      const applications = appsResponse.data.data.applications || [];
      
      // Status distribution for pie chart
      const statusCounts = applications.reduce((acc, app) => {
        acc[app.status] = (acc[app.status] || 0) + 1;
        return acc;
      }, {});

      const statusDistribution = Object.entries(statusCounts).map(([status, count]) => ({
        name: status.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()),
        value: count,
        color: getStatusColor(status) === 'success' ? '#4caf50' : 
               getStatusColor(status) === 'error' ? '#f44336' : 
               getStatusColor(status) === 'warning' ? '#ff9800' : 
               getStatusColor(status) === 'primary' ? '#2196f3' : '#607d8b'
      }));

      // Application trends (last 7 days)
      const last7Days = [...Array(7)].map((_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - (6 - i));
        return date;
      });

      const applicationTrends = last7Days.map(date => {
        const dayStart = new Date(date);
        dayStart.setHours(0, 0, 0, 0);
        const dayEnd = new Date(date);
        dayEnd.setHours(23, 59, 59, 999);

        const dayApplications = applications.filter(app => {
          const appDate = new Date(app.createdAt);
          return appDate >= dayStart && appDate <= dayEnd;
        });

        return {
          date: date.toLocaleDateString('en-US', { weekday: 'short' }),
          applications: dayApplications.length,
          approved: dayApplications.filter(app => app.status === 'approved').length,
          rejected: dayApplications.filter(app => app.status === 'rejected').length
        };
      });

      setChartData({
        statusDistribution,
        applicationTrends
      });
    } catch (err) {
      setError('Failed to load dashboard statistics');
      console.error('Dashboard stats error:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadApplications = async () => {
    try {
      const filters = {
        ...applicationFilters,
        page: applicationPage + 1,
        limit: applicationRowsPerPage
      };
      const response = await adminService.getAllApplications(filters);
      setApplications(response.data.data.applications || []);
    } catch (err) {
      setError('Failed to load applications');
      console.error('Applications load error:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadUsers = async () => {
    try {
      const filters = {
        ...userFilters,
        page: userPage + 1,
        limit: userRowsPerPage
      };
      const response = await adminService.getAllUsers(filters);
      setUsers(response.data.data.users || []);
    } catch (err) {
      setError('Failed to load users');
      console.error('Users load error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleApplicationStatusUpdate = async (applicationId, status, comment = '') => {
    try {
      await adminService.updateApplicationStatus(applicationId, { status, reviewNotes: comment });
      setSuccess(`Application ${status} successfully`);
      setApplicationDetailsDialog({ open: false, application: null });
      loadApplications();
    } catch (err) {
      setError(`Failed to ${status} application`);
      console.error('Status update error:', err);
    }
  };

  const handleDeleteUser = async (userId) => {
    if (window.confirm('Are you sure you want to delete this user? This action cannot be undone and will also delete all their applications.')) {
      try {
        await adminService.deleteUser(userId);
        setSuccess('User deleted successfully');
        setUserDialog({ open: false, user: null });
        loadUsers();
      } catch (err) {
        setError('Failed to delete user');
        console.error('User deletion error:', err);
      }
    }
  };

  const handleExportApplications = async () => {
    try {
      const response = await adminService.exportApplications(applicationFilters);
      const blob = new Blob([response.data], { 
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `applications-export-${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      setSuccess('Applications exported successfully');
    } catch (err) {
      setError('Failed to export applications');
      console.error('Export error:', err);
    }
  };

  const handleExportUsers = async () => {
    try {
      const response = await adminService.exportUsers(userFilters);
      const blob = new Blob([response.data], { 
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `users-export-${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      setSuccess('Users exported successfully');
    } catch (err) {
      setError('Failed to export users');
      console.error('Export error:', err);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      draft: 'default',
      submitted: 'primary',
      pending: 'warning',
      underReview: 'warning',
      approved: 'success',
      rejected: 'error',
      additionalInfoRequired: 'info'
    };
    return colors[status] || 'default';
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const renderDashboardOverview = () => (
    <Box>
      {/* Dashboard Statistics */}
      <DashboardStats />
      
      {/* Charts Section */}
      <Grid container spacing={3} sx={{ mt: 2, mb: 4 }}>
        {/* Application Status Distribution Chart */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Application Status Distribution
              </Typography>
              {chartData.statusDistribution.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={chartData.statusDistribution}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, value, percent }) => 
                        `${name}: ${value} (${(percent * 100).toFixed(1)}%)`
                      }
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {chartData.statusDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <Box display="flex" justifyContent="center" alignItems="center" height={300}>
                  <Typography color="text.secondary">No data available</Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Application Trends Chart */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Application Trends (Last 7 Days)
              </Typography>
              {chartData.applicationTrends.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={chartData.applicationTrends}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Area
                      type="monotone"
                      dataKey="applications"
                      stackId="1"
                      stroke="#2196f3"
                      fill="#2196f3"
                      fillOpacity={0.6}
                      name="Total Applications"
                    />
                    <Area
                      type="monotone"
                      dataKey="approved"
                      stackId="2"
                      stroke="#4caf50"
                      fill="#4caf50"
                      fillOpacity={0.6}
                      name="Approved"
                    />
                    <Area
                      type="monotone"
                      dataKey="rejected"
                      stackId="3"
                      stroke="#f44336"
                      fill="#f44336"
                      fillOpacity={0.6}
                      name="Rejected"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <Box display="flex" justifyContent="center" alignItems="center" height={300}>
                  <Typography color="text.secondary">No data available</Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* System Status */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            System Status
          </Typography>
          <Grid container spacing={3}>
            <Grid item xs={12} sm={4}>
              <Box textAlign="center" p={2}>
                <ApproveIcon sx={{ fontSize: 40, color: 'success.main', mb: 1 }} />
                <Typography variant="h5" color="success.main">
                  Operational
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  All systems running smoothly
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} sm={4}>
              <Box textAlign="center" p={2}>
                <PendingIcon sx={{ fontSize: 40, color: 'warning.main', mb: 1 }} />
                <Typography variant="h5" color="warning.main">
                  {dashboardStats?.pendingApplications || 0}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Applications awaiting review
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} sm={4}>
              <Box textAlign="center" p={2}>
                <TodayIcon sx={{ fontSize: 40, color: 'info.main', mb: 1 }} />
                <Typography variant="h5" color="info.main">
                  {dashboardStats?.todayApplications || 0}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Applications submitted today
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
    </Box>
  );

  const renderApplicationsTab = () => (
    <Box>
      {/* Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                fullWidth
                select
                label="Status"
                value={applicationFilters.status}
                onChange={(e) => setApplicationFilters(prev => ({ ...prev, status: e.target.value }))}
              >
                <MenuItem value="">All Statuses</MenuItem>
                <MenuItem value="draft">Draft</MenuItem>
                <MenuItem value="submitted">Submitted</MenuItem>
                <MenuItem value="pending">Pending</MenuItem>
                <MenuItem value="underReview">Under Review</MenuItem>
                <MenuItem value="approved">Approved</MenuItem>
                <MenuItem value="rejected">Rejected</MenuItem>
                <MenuItem value="additionalInfoRequired">Additional Info Required</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                fullWidth
                select
                label="Date Range"
                value={applicationFilters.dateRange}
                onChange={(e) => setApplicationFilters(prev => ({ ...prev, dateRange: e.target.value }))}
              >
                <MenuItem value="7d">Last 7 Days</MenuItem>
                <MenuItem value="30d">Last 30 Days</MenuItem>
                <MenuItem value="90d">Last 90 Days</MenuItem>
                <MenuItem value="all">All Time</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Button
                fullWidth
                variant="outlined"
                startIcon={<RefreshIcon />}
                onClick={loadApplications}
              >
                Refresh
              </Button>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Button
                fullWidth
                variant="contained"
                startIcon={<ExportIcon />}
                onClick={handleExportApplications}
              >
                Export
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Applications Table */}
      <Card>
        <CardContent sx={{ p: { xs: 1, sm: 2, md: 3 } }}>
          <TableContainer sx={{ maxHeight: 'calc(100vh - 400px)' }}>
            <Table stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell>Application ID</TableCell>
                  <TableCell>Applicant</TableCell>
                  <TableCell>Visa Type</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Submitted Date</TableCell>
                  <TableCell align="center">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {applications.map((application) => (
                  <TableRow key={application._id} hover>
                    <TableCell>
                      <Typography variant="body2" fontFamily="monospace">
                        {application.applicationNumber || application._id.slice(-8).toUpperCase()}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Box>
                        <Typography variant="body2">
                          {application.userId?.name || `${application.userId?.firstName || ''} ${application.userId?.lastName || ''}`.trim()}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {application.userId?.email}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      {application.visaType?.name || 'N/A'}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={application.status.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                        color={getStatusColor(application.status)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      {formatDate(application.createdAt)}
                    </TableCell>
                    <TableCell align="center">
                      <IconButton
                        size="small"
                        onClick={() => setApplicationDetailsDialog({ open: true, application })}
                        title="Review Application"
                        disabled={application.status === 'approved' || application.status === 'rejected'}
                      >
                        <ReviewIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          
          <TablePagination
            rowsPerPageOptions={[5, 10, 25]}
            component="div"
            count={-1} // Unknown total
            rowsPerPage={applicationRowsPerPage}
            page={applicationPage}
            onPageChange={(event, newPage) => setApplicationPage(newPage)}
            onRowsPerPageChange={(event) => {
              setApplicationRowsPerPage(parseInt(event.target.value, 10));
              setApplicationPage(0);
            }}
          />
        </CardContent>
      </Card>
    </Box>
  );

  const renderUsersTab = () => (
    <Box>
      {/* User Management Header */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="h6">
              User Management
            </Typography>
            <Box display="flex" gap={1}>
              <Button
                variant="outlined"
                startIcon={<RefreshIcon />}
                onClick={loadUsers}
              >
                Refresh
              </Button>
              <Button
                variant="contained"
                startIcon={<ExportIcon />}
                onClick={handleExportUsers}
              >
                Export Users
              </Button>
            </Box>
          </Box>
          
          {/* User Filters */}
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={4}>
              <FormControl fullWidth size="small">
                <InputLabel>Status Filter</InputLabel>
                <Select
                  value={userFilters.status}
                  onChange={(e) => setUserFilters(prev => ({ ...prev, status: e.target.value }))}
                  label="Status Filter"
                >
                  <MenuItem value="">All Status</MenuItem>
                  <MenuItem value="active">Active</MenuItem>
                  <MenuItem value="suspended">Suspended</MenuItem>
                  <MenuItem value="pending">Pending</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={4}>
              <FormControl fullWidth size="small">
                <InputLabel>Role Filter</InputLabel>
                <Select
                  value={userFilters.role}
                  onChange={(e) => setUserFilters(prev => ({ ...prev, role: e.target.value }))}
                  label="Role Filter"
                >
                  <MenuItem value="">All Roles</MenuItem>
                  <MenuItem value="user">User</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                size="small"
                label="Search Users"
                value={userFilters.search}
                onChange={(e) => setUserFilters(prev => ({ ...prev, search: e.target.value }))}
                placeholder="Search by name or email..."
              />
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardContent sx={{ p: { xs: 1, sm: 2, md: 3 } }}>
          <TableContainer sx={{ maxHeight: 'calc(100vh - 400px)' }}>
            <Table stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell>User</TableCell>
                  <TableCell>Email</TableCell>
                  <TableCell>Role</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Applications</TableCell>
                  <TableCell>Joined Date</TableCell>
                  <TableCell align="center">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user._id} hover>
                    <TableCell>
                      <Box display="flex" alignItems="center">
                        <Avatar sx={{ mr: 2, width: 32, height: 32 }}>
                          {user.firstName?.charAt(0)}{user.lastName?.charAt(0)}
                        </Avatar>
                        <Box>
                          <Typography variant="body2" fontWeight="medium">
                            {user.firstName} {user.lastName}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            ID: {user._id.slice(-8)}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {user.email}
                      </Typography>
                      {!user.emailVerified && (
                        <Typography variant="caption" color="warning.main">
                          ⚠️ Unverified
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={user.role?.toUpperCase()} 
                        color={user.role === 'admin' ? 'primary' : 'default'}
                        size="small"
                        variant={user.role === 'admin' ? 'filled' : 'outlined'}
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={user.status?.toUpperCase() || 'ACTIVE'}
                        color={
                          user.status === 'active' ? 'success' : 
                          user.status === 'suspended' ? 'error' : 
                          'default'
                        }
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Badge badgeContent={user.applicationCount || 0} color="primary">
                        <ApplicationIcon color="action" />
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {formatDate(user.createdAt)}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <IconButton
                        size="small"
                        onClick={() => setUserDialog({ open: true, user })}
                        title="Manage User"
                      >
                        <EditIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          
          <TablePagination
            rowsPerPageOptions={[5, 10, 25]}
            component="div"
            count={-1}
            rowsPerPage={userRowsPerPage}
            page={userPage}
            onPageChange={(event, newPage) => setUserPage(newPage)}
            onRowsPerPageChange={(event) => {
              setUserRowsPerPage(parseInt(event.target.value, 10));
              setUserPage(0);
            }}
          />
        </CardContent>
      </Card>
    </Box>
  );

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Layout fullWidth>
      <Box>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1">
          Admin Dashboard
        </Typography>
        <Box display="flex" alignItems="center">
          <IconButton onClick={() => {
            if (activeTab === 0) {
              loadApplications();
            } else if (activeTab === 1) {
              loadUsers();
            }
          }}>
            <RefreshIcon />
          </IconButton>
        </Box>
      </Box>

      {/* Tabs */}
      <Paper sx={{ mb: 3 }}>
        <Tabs
          value={activeTab}
          onChange={(e, newValue) => setActiveTab(newValue)}
          variant={isMobile ? 'scrollable' : 'standard'}
          scrollButtons="auto"
        >
          <Tab icon={<ReportsIcon />} label="Dashboard" />
          <Tab icon={<ApplicationIcon />} label="Applications" />
          <Tab icon={<PeopleIcon />} label="Users" />
        </Tabs>
      </Paper>

      {/* Tab Content */}
      {activeTab === 0 && renderDashboardOverview()}
      {activeTab === 1 && renderApplicationsTab()}
      {activeTab === 2 && renderUsersTab()}

      {/* Application Details Dialog */}
      <ApplicationDetailsDialog
        open={applicationDetailsDialog.open}
        onClose={() => setApplicationDetailsDialog({ open: false, application: null })}
        application={applicationDetailsDialog.application}
        onStatusUpdate={handleApplicationStatusUpdate}
        onReload={loadApplications}
      />

      {/* User Management Dialog */}
      <Dialog
        open={userDialog.open}
        onClose={() => setUserDialog({ open: false, user: null })}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="h6">
              Manage User: {userDialog.user?.firstName} {userDialog.user?.lastName}
            </Typography>
            <Chip 
              label={userDialog.user?.role?.toUpperCase() || 'USER'} 
              color={userDialog.user?.role === 'admin' ? 'primary' : 'default'}
              size="small"
            />
          </Box>
        </DialogTitle>
        <DialogContent>
          {userDialog.user && (
            <Box>
              <Card variant="outlined" sx={{ p: 2, mb: 2 }}>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" gutterBottom>
                      <strong>Email:</strong> {userDialog.user.email}
                    </Typography>
                    <Typography variant="body2" gutterBottom>
                      <strong>Status:</strong> {userDialog.user.status || 'active'}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" gutterBottom>
                      <strong>Joined:</strong> {formatDate(userDialog.user.createdAt)}
                    </Typography>
                    <Typography variant="body2" gutterBottom>
                      <strong>Applications:</strong> {userDialog.user.applicationCount || 0}
                    </Typography>
                  </Grid>
                </Grid>
              </Card>

              <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                User ID: {userDialog.user._id}
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setUserDialog({ open: false, user: null })}>
            Cancel
          </Button>
          <Button
            onClick={() => handleDeleteUser(userDialog.user?._id)}
            color="error"
            startIcon={<DeleteIcon />}
            variant="outlined"
            sx={{ ml: 1 }}
          >
            Delete User
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar Notifications */}
      <Snackbar
        open={!!error}
        autoHideDuration={6000}
        onClose={() => setError('')}
      >
        <Alert onClose={() => setError('')} severity="error">
          {error}
        </Alert>
      </Snackbar>

      <Snackbar
        open={!!success}
        autoHideDuration={4000}
        onClose={() => setSuccess('')}
      >
        <Alert onClose={() => setSuccess('')} severity="success">
          {success}
        </Alert>
      </Snackbar>
      </Box>
    </Layout>
  );
};

export default AdminDashboard;
