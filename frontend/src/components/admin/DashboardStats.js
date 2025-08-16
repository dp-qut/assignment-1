import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  CircularProgress,
  Alert,
  useTheme,
  Chip,
  LinearProgress
} from '@mui/material';
import {
  People as PeopleIcon,
  Description as ApplicationIcon,
  CheckCircle as ApprovedIcon,
  Cancel as RejectedIcon,
  Pending as PendingIcon,
  Today as TodayIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon
} from '@mui/icons-material';
import { adminService } from '../../services/api';

const DashboardStats = () => {
  const theme = useTheme();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      setLoading(true);
      const response = await adminService.getDashboardStats();
      setStats(response.data.data.stats);
    } catch (err) {
      setError('Failed to load dashboard statistics');
      console.error('Dashboard stats error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" py={4}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 3 }}>
        {error}
      </Alert>
    );
  }

  const StatCard = ({ title, value, icon, color, trend, trendValue, percentage }) => (
    <Card sx={{ height: '100%', position: 'relative', overflow: 'visible' }}>
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
                  {trendValue}
                </Typography>
              </Box>
            )}
            {percentage !== undefined && (
              <Box mt={1}>
                <LinearProgress
                  variant="determinate"
                  value={percentage}
                  sx={{ 
                    height: 4, 
                    borderRadius: 2,
                    backgroundColor: theme.palette.grey[200],
                    '& .MuiLinearProgress-bar': {
                      backgroundColor: color,
                    }
                  }}
                />
                <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5 }}>
                  {percentage.toFixed(1)}% of total
                </Typography>
              </Box>
            )}
          </Box>
          <Box
            sx={{
              backgroundColor: color,
              borderRadius: 1,
              p: 1,
              color: 'white',
              boxShadow: `0 2px 8px ${color}30`
            }}
          >
            {icon}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );

  const totalApplications = stats?.totalApplications || 0;

  return (
    <Box>
      <Typography variant="h6" gutterBottom sx={{ mb: 3 }}>
        System Overview
      </Typography>
      
      <Grid container spacing={3}>
        {/* Total Applications */}
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Applications"
            value={stats?.totalApplications}
            icon={<ApplicationIcon />}
            color={theme.palette.primary.main}
            trend="up"
            trendValue="+12% this month"
          />
        </Grid>

        {/* Total Users */}
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Users"
            value={stats?.totalUsers}
            icon={<PeopleIcon />}
            color={theme.palette.info.main}
            trend="up"
            trendValue="+8% this month"
          />
        </Grid>

        {/* Pending Applications */}
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Pending Reviews"
            value={stats?.pendingApplications}
            icon={<PendingIcon />}
            color={theme.palette.warning.main}
            trend="down"
            trendValue="-5% this week"
            percentage={(stats?.pendingApplications / totalApplications) * 100 || 0}
          />
        </Grid>

        {/* Today's Applications */}
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Today's Applications"
            value={stats?.todayApplications}
            icon={<TodayIcon />}
            color={theme.palette.success.main}
            trend="up"
            trendValue="+25% vs yesterday"
          />
        </Grid>

        {/* Approved Applications */}
        <Grid item xs={12} sm={6} md={4}>
          <StatCard
            title="Approved Applications"
            value={stats?.approvedApplications}
            icon={<ApprovedIcon />}
            color={theme.palette.success.main}
            percentage={(stats?.approvedApplications / totalApplications) * 100 || 0}
          />
        </Grid>

        {/* Rejected Applications */}
        <Grid item xs={12} sm={6} md={4}>
          <StatCard
            title="Rejected Applications"
            value={stats?.rejectedApplications}
            icon={<RejectedIcon />}
            color={theme.palette.error.main}
            percentage={(stats?.rejectedApplications / totalApplications) * 100 || 0}
          />
        </Grid>

        {/* Processing Rate */}
        <Grid item xs={12} sm={6} md={4}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography color="textSecondary" gutterBottom variant="body2">
                Processing Rate
              </Typography>
              <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
                <Typography variant="h4" component="div" color="primary.main">
                  {totalApplications > 0 ? 
                    (((stats?.approvedApplications + stats?.rejectedApplications) / totalApplications) * 100).toFixed(1) 
                    : 0}%
                </Typography>
                <Chip 
                  label="Efficient" 
                  color="success" 
                  size="small" 
                  variant="outlined" 
                />
              </Box>
              <LinearProgress
                variant="determinate"
                value={totalApplications > 0 ? 
                  ((stats?.approvedApplications + stats?.rejectedApplications) / totalApplications) * 100 
                  : 0}
                sx={{ 
                  height: 8, 
                  borderRadius: 4,
                  backgroundColor: theme.palette.grey[200]
                }}
              />
              <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                {(stats?.approvedApplications + stats?.rejectedApplications) || 0} of {totalApplications} applications processed
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default DashboardStats;
