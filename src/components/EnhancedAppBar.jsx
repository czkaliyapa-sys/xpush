import React, { useState } from 'react';
import {
  AppBar,
  Toolbar,
  Box,
  TextField,
  InputAdornment,
  IconButton,
  Typography,
  Menu,
  MenuItem,
  Avatar,
  Badge,
  Divider,
  Button,
  Tooltip,
  Chip,
  useTheme,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import {
  Menu as MenuIcon,
  Search as SearchIcon,
  Notifications as NotificationsIcon,
  Settings as SettingsIcon,
  Logout as LogoutIcon,
  Dashboard as DashboardIcon,
  KeyboardArrowDown as KeyboardArrowDownIcon,
  CalendarToday as CalendarTodayIcon,
  Bell as BellIcon,
  Help as HelpIcon,
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.jsx';

const StyledAppBar = styled(AppBar)(({ theme }) => ({
  backgroundColor: '#0f172a',
  borderBottom: '1px solid #334155',
  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.5)',
  backdropFilter: 'blur(10px)',
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  zIndex: theme.zIndex.drawer + 1,
  [theme.breakpoints.up('md')]: {
    marginLeft: 320, // drawer width
    width: 'calc(100% - 320px)',
  },
}));

const StyledToolbar = styled(Toolbar)(({ theme }) => ({
  padding: theme.spacing(1, 1.5),
  minHeight: 64,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: theme.spacing(1),
  flexWrap: 'nowrap',
  overflow: 'hidden',
  [theme.breakpoints.up('sm')]: {
    padding: theme.spacing(1.5, 2),
    minHeight: 70,
    gap: theme.spacing(2),
  },
}));

const SearchContainer = styled(Box)(({ theme }) => ({
  flex: '1 1 auto',
  minWidth: 100,
  maxWidth: '100%',
  position: 'relative',
  [theme.breakpoints.up('sm')]: {
    minWidth: 200,
    maxWidth: 400,
  },
}));

const StyledSearchField = styled(TextField)(({ theme }) => ({
  '& .MuiOutlinedInput-root': {
    backgroundColor: '#1e293b',
    borderRadius: 8,
    border: '2px solid #334155',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    '&:hover': {
      borderColor: '#475569',
      backgroundColor: '#1e293b',
    },
    '&.Mui-focused': {
      borderColor: '#3b82f6',
      backgroundColor: '#1e293b',
      boxShadow: '0 0 0 3px rgba(59, 130, 246, 0.1)',
    },
  },
  '& .MuiOutlinedInput-input': {
    padding: '10px 12px',
    fontSize: 14,
  },
  '& .MuiOutlinedInput-input::placeholder': {
    color: '#64748b',
    opacity: 0.7,
  },
}));

const SearchResults = styled(Box)(({ theme }) => ({
  position: 'absolute',
  top: '100%',
  left: 0,
  right: 0,
  zIndex: 1300,
  marginTop: 8,
  maxHeight: 400,
  overflowY: 'auto',
  backgroundColor: '#1e293b',
  border: '1px solid #334155',
  borderRadius: 8,
  boxShadow: '0 10px 40px rgba(0, 0, 0, 0.4)',
  '&::-webkit-scrollbar': {
    width: 6,
  },
  '&::-webkit-scrollbar-track': {
    background: 'transparent',
  },
  '&::-webkit-scrollbar-thumb': {
    background: '#475569',
    borderRadius: 3,
  },
}));

const ResultItem = styled(Box)(({ theme }) => ({
  padding: theme.spacing(1.5, 2),
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  transition: 'background-color 0.2s',
  '&:hover': {
    backgroundColor: '#0f172a',
  },
  borderBottom: '1px solid #334155',
  '&:last-child': {
    borderBottom: 'none',
  },
}));

const AvatarMenu = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(0.5),
  cursor: 'pointer',
  padding: theme.spacing(0.25, 0.5),
  borderRadius: 8,
  transition: 'all 0.3s',
  '&:hover': {
    backgroundColor: '#1e293b',
  },
  [theme.breakpoints.up('sm')]: {
    gap: theme.spacing(1),
    padding: theme.spacing(0.5, 1),
  },
}));

const BreadcrumbBox = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(0.5),
  [theme.breakpoints.down('sm')]: {
    display: 'none',
  },
}));

const ActionButtonsBox = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(0.5),
  flexShrink: 0,
  [theme.breakpoints.up('sm')]: {
    gap: theme.spacing(1),
  },
}));

export default function EnhancedAppBar({
  onDrawerToggle,
  dateLabel,
  headerSearch,
  onHeaderSearchChange,
  headerSearchResults,
  onResultClick,
  pendingInstallments,
  showHeaderSearchResults,
  onSearchFocus,
  onSearchBlur,
  onHeaderSearchKeyDown,
}) {
  const theme = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const [userMenuAnchor, setUserMenuAnchor] = useState(null);
  const [notificationsAnchor, setNotificationsAnchor] = useState(null);

  // Get breadcrumb label
  const getBreadcrumbLabel = () => {
    const path = location.pathname || '';
    const mapLabels = {
      '': 'Home',
      analytics: 'Analytics',
      clients: 'Clients',
      gadgets: 'Gadgets',
      users: 'Users',
      settings: 'Settings',
      about: 'About',
      orders: 'Orders',
      installments: 'Installments',
      applications: 'Installment Applications',
      receipts: 'Receipts',
      verify: 'Verify Listings',
      listings: 'My Listings',
      'add-listing': 'Add Listing',
    };
    const section = path.startsWith('/dashboard/')
      ? path.split('/')[2] || ''
      : '';
    const label =
      mapLabels[section] ??
      (section
        ? section.charAt(0).toUpperCase() + section.slice(1)
        : 'Home');
    return label;
  };

  const getUserDisplayName = () => {
    if (user?.displayName) {
      return user.displayName;
    }
    if (user?.email) {
      return user.email.split('@')[0];
    }
    return 'User';
  };

  const getUserInitials = () => {
    const name = getUserDisplayName();
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const handleUserMenuOpen = (e) => {
    setUserMenuAnchor(e.currentTarget);
  };

  const handleUserMenuClose = () => {
    setUserMenuAnchor(null);
  };

  const handleNotificationsOpen = (e) => {
    setNotificationsAnchor(e.currentTarget);
  };

  const handleNotificationsClose = () => {
    setNotificationsAnchor(null);
  };

  const handleLogout = async () => {
    handleUserMenuClose();
    await logout();
    navigate('/');
  };

  const handleNavigate = (path) => {
    navigate(path);
    handleUserMenuClose();
  };

  return (
    <StyledAppBar position="fixed">
      <StyledToolbar>
        {/* Left Section: Menu and Breadcrumb */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 0.5, sm: 2 }, minWidth: 0, flexShrink: 0 }}>
          {/* Mobile menu toggle */}
          <Tooltip title="Toggle menu">
            <IconButton
              color="inherit"
              aria-label="toggle drawer"
              onClick={onDrawerToggle}
              size="small"
              sx={{
                display: { xs: 'flex', md: 'none' },
                p: { xs: 0.5, sm: 1 },
                '&:hover': { backgroundColor: '#1e293b' },
              }}
            >
              <MenuIcon sx={{ fontSize: { xs: 20, sm: 24 } }} />
            </IconButton>
          </Tooltip>

          {/* Breadcrumb Navigation */}
          <BreadcrumbBox>
            <DashboardIcon sx={{ fontSize: 18, color: '#3b82f6' }} />
            <Typography
              variant="body2"
              sx={{
                color: '#94a3b8',
                fontWeight: 500,
              }}
            >
              Dashboard
            </Typography>
            <Typography sx={{ color: '#475569' }}>/</Typography>
            <Typography
              variant="body2"
              sx={{
                color: '#f8fafc',
                fontWeight: 600,
              }}
              noWrap
            >
              {getBreadcrumbLabel()}
            </Typography>
          </BreadcrumbBox>

          {/* Mobile Breadcrumb (simplified) */}
          <Box sx={{ display: { xs: 'block', sm: 'none' }, maxWidth: { xs: 80, sm: 'none' } }}>
            <Typography
              variant="caption"
              sx={{
                color: '#f8fafc',
                fontWeight: 600,
                fontSize: { xs: 11, sm: 14 },
              }}
              noWrap
            >
              {getBreadcrumbLabel()}
            </Typography>
          </Box>
        </Box>

        {/* Center Section: Search */}
        <SearchContainer>
          <StyledSearchField
            fullWidth
            size="small"
            placeholder="Search gadgets, orders, clients..."
            value={headerSearch}
            onChange={onHeaderSearchChange}
            onKeyDown={onHeaderSearchKeyDown}
            onFocus={onSearchFocus}
            onBlur={onSearchBlur}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ color: '#64748b', fontSize: 18 }} />
                </InputAdornment>
              ),
            }}
          />

          {/* Search Results Dropdown */}
          {showHeaderSearchResults && headerSearchResults.length > 0 && (
            <SearchResults>
              {headerSearchResults.map((item, idx) => (
                <ResultItem
                  key={`${item.type}-${item.id || item.to || item.label}-${idx}`}
                  onClick={() => onResultClick(item)}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <SearchIcon sx={{ fontSize: 16, color: '#64748b' }} />
                    <Box>
                      <Typography variant="body2" sx={{ color: '#f8fafc' }}>
                        {item.type === 'route'
                          ? item.label
                          : item.name || item.label || 'View item'}
                      </Typography>
                      {item.brand && (
                        <Typography variant="caption" sx={{ color: '#64748b' }}>
                          {item.brand}
                          {item.category && ` • ${item.category}`}
                        </Typography>
                      )}
                    </Box>
                  </Box>
                  {item.type === 'route' && (
                    <KeyboardArrowDownIcon
                      sx={{ fontSize: 16, color: '#475569' }}
                    />
                  )}
                </ResultItem>
              ))}
            </SearchResults>
          )}
        </SearchContainer>

        {/* Right Section: Date, Notifications, Settings */}
        <ActionButtonsBox>
          {/* Date Display - Hidden on mobile */}
          <Box
            sx={{
              display: { xs: 'none', sm: 'flex' },
              alignItems: 'center',
              gap: 1,
              px: 2,
              py: 0.75,
              backgroundColor: '#1e293b',
              borderRadius: '8px',
              border: '1px solid #334155',
              minWidth: 'fit-content',
            }}
          >
            <CalendarTodayIcon
              sx={{ fontSize: 16, color: '#64748b' }}
            />
            <Typography
              variant="body2"
              sx={{
                fontWeight: 500,
                color: '#f8fafc',
                whiteSpace: 'nowrap',
              }}
            >
              {dateLabel}
            </Typography>
          </Box>

          {/* Notifications Button */}
          <Tooltip title="Notifications">
            <IconButton
              color="inherit"
              size="small"
              onClick={handleNotificationsOpen}
              sx={{
                position: 'relative',
                p: { xs: 0.5, sm: 1 },
                '&:hover': { backgroundColor: '#1e293b' },
              }}
            >
              <Badge
                badgeContent={pendingInstallments}
                color="error"
                overlap="circular"
                sx={{
                  '& .MuiBadge-badge': {
                    fontSize: { xs: 9, sm: 10 },
                    height: { xs: 16, sm: 18 },
                    minWidth: { xs: 16, sm: 18 },
                  },
                }}
              >
                <NotificationsIcon sx={{ fontSize: { xs: 18, sm: 22 } }} />
              </Badge>
            </IconButton>
          </Tooltip>

          {/* Notifications Menu */}
          <Menu
            anchorEl={notificationsAnchor}
            open={Boolean(notificationsAnchor)}
            onClose={handleNotificationsClose}
            PaperProps={{
              sx: {
                backgroundColor: '#1e293b',
                border: '1px solid #334155',
                borderRadius: 1,
                minWidth: 320,
              },
            }}
          >
            <MenuItem disabled>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                Notifications
              </Typography>
            </MenuItem>
            <Divider sx={{ borderColor: '#334155', my: 1 }} />
            {pendingInstallments > 0 ? (
              <>
                <MenuItem
                  onClick={() => {
                    handleNavigate('/dashboard/installments');
                    handleNotificationsClose();
                  }}
                  sx={{
                    backgroundColor: 'rgba(239, 68, 68, 0.1)',
                    borderLeft: '3px solid #ef4444',
                  }}
                >
                  <Box>
                    <Typography variant="body2">
                      {pendingInstallments} Pending Installment
                      {pendingInstallments !== 1 ? 's' : ''}
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#94a3b8' }}>
                      Action required
                    </Typography>
                  </Box>
                </MenuItem>
                <Divider sx={{ borderColor: '#334155', my: 1 }} />
              </>
            ) : (
              <MenuItem disabled>
                <Typography variant="body2" sx={{ color: '#94a3b8' }}>
                  No new notifications
                </Typography>
              </MenuItem>
            )}
            <MenuItem
              onClick={() => {
                handleNavigate('/dashboard/orders');
                handleNotificationsClose();
              }}
            >
              <Typography variant="body2">View all orders</Typography>
            </MenuItem>
          </Menu>

          {/* Settings Button */}
          <Tooltip title="Settings">
            <IconButton
              color="inherit"
              size="small"
              onClick={() => navigate('/dashboard/settings')}
              sx={{
                p: { xs: 0.5, sm: 1 },
                display: { xs: 'none', sm: 'inline-flex' },
                '&:hover': { backgroundColor: '#1e293b' },
              }}
            >
              <SettingsIcon sx={{ fontSize: { xs: 18, sm: 22 } }} />
            </IconButton>
          </Tooltip>

          {/* Help Button */}
          <Tooltip title="Help & Support">
            <IconButton
              color="inherit"
              size="small"
              onClick={() => navigate('/contact')}
              sx={{
                display: { xs: 'none', md: 'inline-flex' },
                p: { xs: 0.5, sm: 1 },
                '&:hover': { backgroundColor: '#1e293b' },
              }}
            >
              <HelpIcon sx={{ fontSize: { xs: 18, sm: 22 } }} />
            </IconButton>
          </Tooltip>

          {/* User Menu */}
          <Tooltip title="Profile menu">
            <AvatarMenu onClick={handleUserMenuOpen}>
              <Avatar
                sx={{
                  width: { xs: 28, sm: 32 },
                  height: { xs: 28, sm: 32 },
                  backgroundColor: '#3b82f6',
                  fontSize: { xs: 12, sm: 14 },
                  fontWeight: 600,
                  cursor: 'pointer',
                  '&:hover': {
                    backgroundColor: '#2563eb',
                  },
                }}
              >
                {getUserInitials()}
              </Avatar>
              <Box sx={{ display: { xs: 'none', md: 'block' } }}>
                <Typography
                  variant="body2"
                  sx={{
                    color: '#f8fafc',
                    fontWeight: 600,
                    fontSize: { sm: 13, md: 14 },
                  }}
                  noWrap
                >
                  {getUserDisplayName()}
                </Typography>
                <Typography
                  variant="caption"
                  sx={{
                    color: '#94a3b8',
                  }}
                >
                  {user?.role || 'User'}
                </Typography>
              </Box>
              <KeyboardArrowDownIcon sx={{ display: { xs: 'none', sm: 'block' }, fontSize: { xs: 16, sm: 18 }, color: '#94a3b8' }} />
            </AvatarMenu>
          </Tooltip>

          {/* User Menu Dropdown */}
          <Menu
            anchorEl={userMenuAnchor}
            open={Boolean(userMenuAnchor)}
            onClose={handleUserMenuClose}
            PaperProps={{
              sx: {
                backgroundColor: '#1e293b',
                border: '1px solid #334155',
                borderRadius: 1,
                minWidth: 280,
              },
            }}
            anchorOrigin={{
              vertical: 'bottom',
              horizontal: 'right',
            }}
            transformOrigin={{
              vertical: 'top',
              horizontal: 'right',
            }}
          >
            <MenuItem disabled>
              <Box>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  {getUserDisplayName()}
                </Typography>
                <Typography variant="caption" sx={{ color: '#94a3b8' }}>
                  {user?.email}
                </Typography>
              </Box>
            </MenuItem>
            <Divider sx={{ borderColor: '#334155', my: 1 }} />
            <MenuItem onClick={() => handleNavigate('/dashboard/settings')}>
              <SettingsIcon sx={{ mr: 1, fontSize: 18 }} />
              <Typography variant="body2">Settings</Typography>
            </MenuItem>
            <MenuItem onClick={() => handleNavigate('/dashboard')}>
              <DashboardIcon sx={{ mr: 1, fontSize: 18 }} />
              <Typography variant="body2">Dashboard Home</Typography>
            </MenuItem>
            <Divider sx={{ borderColor: '#334155', my: 1 }} />
            <MenuItem onClick={handleLogout}>
              <LogoutIcon sx={{ mr: 1, fontSize: 18, color: '#ef4444' }} />
              <Typography variant="body2" sx={{ color: '#ef4444' }}>
                Logout
              </Typography>
            </MenuItem>
          </Menu>
        </ActionButtonsBox>
      </StyledToolbar>
    </StyledAppBar>
  );
}
