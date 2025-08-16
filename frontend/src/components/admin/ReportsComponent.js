import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  CircularProgress,
  Chip,
  useTheme,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  LinearProgress
} from '@mui/material';
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';
import {
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  GetApp as ExportIcon,
  People as PeopleIcon,
  Description as ApplicationIcon,
  CheckCircle as ApprovedIcon,
  Cancel as RejectedIcon,
  Pending as PendingIcon,
  Today as TodayIcon
} from '@mui/icons-material';
import { adminService } from '../../services/api';

const ReportsComponent = () => {
  console.log('ReportsComponent rendering...');
  const theme = useTheme();
  const [loading, setLoading] = useState(true);
  const [dashboardStats, setDashboardStats] = useState(null);
  const [dateRange, setDateRange] = useState('30d');
  const [error, setError] = useState('');
  const [reportData, setReportData] = useState({
    statusDistribution: [],
    applicationTrends: [],
    visaTypeStats: [],
    userRegistrationTrends: []
  });

  const COLORS = {
    approved: '#4caf50',
    rejected: '#f44336',
    pending: '#ff9800',
    underReview: '#2196f3',
    submitted: '#9c27b0',
    draft: '#607d8b'
  };

  useEffect(() => {
    const loadData = async () => {
      await loadReportData();
    };
    loadData();
  }, [dateRange]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadReportData = async () => {
    setLoading(true);
    setError('');
    try {
      console.log('Loading report data...');
      
      // Load dashboard stats
      const statsResponse = await adminService.getDashboardStats();
      console.log('Dashboard stats loaded:', statsResponse.data);
      setDashboardStats(statsResponse.data.data.stats);

      // Load applications for analysis
      const appsResponse = await adminService.getAllApplications({ 
        dateRange, 
        limit: 1000 
      });
      console.log('Applications loaded:', appsResponse.data);
      const applications = appsResponse.data.data.applications || [];

      // Load users for analysis
      const usersResponse = await adminService.getAllUsers({ 
        limit: 1000 
      });
      console.log('Users loaded:', usersResponse.data);
      const users = usersResponse.data.data.users || [];

      // Process data for charts
      processReportData(applications, users);
    } catch (err) {
      console.error('Report data loading error:', err);
      setError(`Failed to load report data: ${err.response?.data?.message || err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const processReportData = (applications, users) => {
    // Status distribution
    const statusCounts = applications.reduce((acc, app) => {
      acc[app.status] = (acc[app.status] || 0) + 1;
      return acc;
    }, {});

    const statusDistribution = Object.entries(statusCounts).map(([status, count]) => ({
      name: status.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()),
      value: count,
      color: COLORS[status] || theme.palette.grey[500]
    }));

    // Application trends (last 30 days)
    const last30Days = [...Array(30)].map((_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (29 - i));
      return date;
    });

    const applicationTrends = last30Days.map(date => {
      const dayStart = new Date(date);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(date);
      dayEnd.setHours(23, 59, 59, 999);

      const dayApplications = applications.filter(app => {
        const appDate = new Date(app.createdAt);
        return appDate >= dayStart && appDate <= dayEnd;
      });

      return {
        date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        applications: dayApplications.length,
        approved: dayApplications.filter(app => app.status === 'approved').length,
        rejected: dayApplications.filter(app => app.status === 'rejected').length
      };
    });

    // Visa type statistics
    const visaTypeCounts = applications.reduce((acc, app) => {
      const visaType = app.visaType?.name || 'Unknown';
      acc[visaType] = (acc[visaType] || 0) + 1;
      return acc;
    }, {});

    const visaTypeStats = Object.entries(visaTypeCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([type, count]) => ({
        name: type,
        applications: count,
        percentage: ((count / applications.length) * 100).toFixed(1)
      }));

    // User registration trends
    const userRegistrationTrends = last30Days.map(date => {
      const dayStart = new Date(date);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(date);
      dayEnd.setHours(23, 59, 59, 999);

      const dayUsers = users.filter(user => {
        const userDate = new Date(user.createdAt);
        return userDate >= dayStart && userDate <= dayEnd;
      });

      return {
        date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        registrations: dayUsers.length
      };
    });

    setReportData({
      statusDistribution,
      applicationTrends,
      visaTypeStats,
      userRegistrationTrends
    });
  };

  const exportReport = async () => {
    try {
      const response = await adminService.exportApplications({ dateRange });
      const blob = new Blob([response.data], { 
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `applications-report-${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError('Failed to export report');
      console.error('Export error:', err);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mt: 2 }}>
        {error}
      </Alert>
    );
  }

  const StatCard = ({ title, value, icon, color, trend, trendValue }) => (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="flex-start">
          <Box>
            <Typography color="textSecondary" gutterBottom variant="body2">
              {title}
            </Typography>
            <Typography variant="h4" component="div" color={color}>
              {value?.toLocaleString() || 0}
            </Typography>
            {trend && (
              <Box display="flex" alignItems="center" mt={1}>
                {trend === 'up' ? (
                  <TrendingUpIcon color="success" fontSize="small" />
                ) : (
                  <TrendingDownIcon color="error" fontSize="small" />
                )}
                <Typography 
                  variant="body2" 
                  color={trend === 'up' ? 'success.main' : 'error.main'}
                  sx={{ ml: 0.5 }}
                >
                  {trendValue}%
                </Typography>
              </Box>
            )}
          </Box>
          <Box
            sx={{
              backgroundColor: color,
              borderRadius: 1,
              p: 1,
              color: 'white'
            }}
          >
            {icon}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );

  return (
    <Box>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h5" component="h2" gutterBottom>
            Reports & Analytics
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Comprehensive insights into your E-Visa application system
          </Typography>
        </Box>
        <Box display="flex" gap={2}>
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Date Range</InputLabel>
            <Select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              label="Date Range"
            >
              <MenuItem value="7d">Last 7 Days</MenuItem>
              <MenuItem value="30d">Last 30 Days</MenuItem>
              <MenuItem value="90d">Last 90 Days</MenuItem>
              <MenuItem value="all">All Time</MenuItem>
            </Select>
          </FormControl>
          <Button
            variant="contained"
            startIcon={<ExportIcon />}
            onClick={exportReport}
          >
            Export Report
          </Button>
        </Box>
      </Box>

      {/* Key Metrics */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Applications"
            value={dashboardStats?.totalApplications}
            icon={<ApplicationIcon />}
            color={theme.palette.primary.main}
            trend="up"
            trendValue="12"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Users"
            value={dashboardStats?.totalUsers}
            icon={<PeopleIcon />}
            color={theme.palette.info.main}
            trend="up"
            trendValue="8"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Pending Reviews"
            value={dashboardStats?.pendingApplications}
            icon={<PendingIcon />}
            color={theme.palette.warning.main}
            trend="down"
            trendValue="5"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Today's Applications"
            value={dashboardStats?.todayApplications}
            icon={<TodayIcon />}
            color={theme.palette.success.main}
            trend="up"
            trendValue="25"
          />
        </Grid>
      </Grid>

      {/* Charts Section */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {/* Application Status Distribution */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Application Status Distribution
              </Typography>
              {reportData.statusDistribution.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={reportData.statusDistribution}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, value }) => {
                        const total = reportData.statusDistribution.reduce((a, b) => a + b.value, 0);
                        const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
                        return `${name} (${percentage}%)`;
                      }}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {reportData.statusDistribution.map((entry, index) => (
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

        {/* Application Trends */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Application Trends (Last 30 Days)
              </Typography>
              {reportData.applicationTrends.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={reportData.applicationTrends}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Area
                      type="monotone"
                      dataKey="applications"
                      stackId="1"
                      stroke={theme.palette.primary.main}
                      fill={theme.palette.primary.main}
                      fillOpacity={0.6}
                      name="Total Applications"
                    />
                    <Area
                      type="monotone"
                      dataKey="approved"
                      stackId="2"
                      stroke={COLORS.approved}
                      fill={COLORS.approved}
                      fillOpacity={0.6}
                      name="Approved"
                    />
                    <Area
                      type="monotone"
                      dataKey="rejected"
                      stackId="3"
                      stroke={COLORS.rejected}
                      fill={COLORS.rejected}
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

        {/* User Registration Trends */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                User Registration Trends
              </Typography>
              {reportData.userRegistrationTrends.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={reportData.userRegistrationTrends}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="registrations"
                      stroke={theme.palette.info.main}
                      strokeWidth={2}
                      dot={{ fill: theme.palette.info.main }}
                      name="New Registrations"
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <Box display="flex" justifyContent="center" alignItems="center" height={300}>
                  <Typography color="text.secondary">No data available</Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Visa Type Statistics */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Popular Visa Types
              </Typography>
              {reportData.visaTypeStats.length > 0 ? (
                <TableContainer sx={{ maxHeight: 300 }}>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Visa Type</TableCell>
                        <TableCell align="right">Applications</TableCell>
                        <TableCell align="right">Percentage</TableCell>
                        <TableCell align="right">Popularity</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {reportData.visaTypeStats.map((stat, index) => (
                        <TableRow key={stat.name}>
                          <TableCell component="th" scope="row">
                            <Box display="flex" alignItems="center">
                              <Chip
                                label={index + 1}
                                size="small"
                                sx={{ mr: 1, minWidth: 24 }}
                                color={index < 3 ? 'primary' : 'default'}
                              />
                              {stat.name}
                            </Box>
                          </TableCell>
                          <TableCell align="right">{stat.applications}</TableCell>
                          <TableCell align="right">{stat.percentage}%</TableCell>
                          <TableCell align="right">
                            <LinearProgress
                              variant="determinate"
                              value={parseFloat(stat.percentage)}
                              sx={{ width: 60, height: 6, borderRadius: 3 }}
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              ) : (
                <Box display="flex" justifyContent="center" alignItems="center" height={300}>
                  <Typography color="text.secondary">No data available</Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Summary Statistics */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Quick Statistics Summary
          </Typography>
          <Grid container spacing={3}>
            <Grid item xs={12} sm={4}>
              <Box textAlign="center" p={2}>
                <ApprovedIcon sx={{ fontSize: 40, color: 'success.main', mb: 1 }} />
                <Typography variant="h4" color="success.main">
                  {dashboardStats?.approvedApplications || 0}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Approved Applications
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {((dashboardStats?.approvedApplications || 0) / (dashboardStats?.totalApplications || 1) * 100).toFixed(1)}% of total
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} sm={4}>
              <Box textAlign="center" p={2}>
                <RejectedIcon sx={{ fontSize: 40, color: 'error.main', mb: 1 }} />
                <Typography variant="h4" color="error.main">
                  {dashboardStats?.rejectedApplications || 0}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Rejected Applications
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {((dashboardStats?.rejectedApplications || 0) / (dashboardStats?.totalApplications || 1) * 100).toFixed(1)}% of total
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} sm={4}>
              <Box textAlign="center" p={2}>
                <PendingIcon sx={{ fontSize: 40, color: 'warning.main', mb: 1 }} />
                <Typography variant="h4" color="warning.main">
                  {dashboardStats?.pendingApplications || 0}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Pending Review
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {((dashboardStats?.pendingApplications || 0) / (dashboardStats?.totalApplications || 1) * 100).toFixed(1)}% of total
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
    </Box>
  );
};

export default ReportsComponent;
