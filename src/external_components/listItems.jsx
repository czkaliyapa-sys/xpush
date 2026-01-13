import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import ListSubheader from '@mui/material/ListSubheader';
import Divider from '@mui/material/Divider';
import Box from '@mui/material/Box';
import Collapse from '@mui/material/Collapse';
import Typography from '@mui/material/Typography';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import HomeIcon from '@mui/icons-material/Home';
import BarChartIcon from '@mui/icons-material/BarChart';
import PeopleIcon from '@mui/icons-material/People';
import AssignmentIcon from '@mui/icons-material/Assignment';
import SettingsIcon from '@mui/icons-material/Settings';
import InfoIcon from '@mui/icons-material/Info';
import LogoutIcon from '@mui/icons-material/Logout';
import DevicesIcon from '@mui/icons-material/Devices';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import AssignmentTurnedInIcon from '@mui/icons-material/AssignmentTurnedIn';
import ReceiptIcon from '@mui/icons-material/Receipt';
import WorkspacePremiumIcon from '@mui/icons-material/WorkspacePremium';
import HelpIcon from '@mui/icons-material/Help';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ContactSupportIcon from '@mui/icons-material/ContactSupport';
import ArticleIcon from '@mui/icons-material/Article';
import BugReportIcon from '@mui/icons-material/BugReport';
import { useAuth } from '../contexts/AuthContext.jsx';



const getMenuItemsForRole = (userRole) => {
  // Only show Home for non-admin users - admin users go straight to Analytics
  const baseItems = userRole === 'admin' ? [] : [
    { text: 'Home', icon: <HomeIcon />, path: '/dashboard', category: 'navigation' },
  ];

  const roleSpecificItems = {
    admin: [
      // Analytics is first for admin users (serves as their home page)
      { text: 'Analytics', icon: <TrendingUpIcon />, path: '/dashboard/analytics', category: 'admin' },
      { text: 'Users', icon: <PeopleIcon />, path: '/dashboard/users', category: 'admin' },
      { text: 'Gadgets', icon: <DevicesIcon />, path: '/dashboard/gadgets', category: 'admin' },
      { text: 'Trade-Ins Admin', icon: <DevicesIcon />, path: '/dashboard/trade-ins-admin', category: 'admin' },
      { text: 'Applications', icon: <AssignmentTurnedInIcon />, path: '/dashboard/applications', category: 'admin' },
      { text: 'Orders', icon: <ShoppingCartIcon />, path: '/dashboard/orders', category: 'admin' },
      { text: 'Installments', icon: <AccountBalanceIcon />, path: '/dashboard/installments', category: 'admin' },
      { text: 'Subscriptions', icon: <WorkspacePremiumIcon />, path: '/dashboard/subscriptions', category: 'admin' },
    ],
    seller: [
      { text: 'My Listings', icon: <DevicesIcon />, path: '/dashboard/listings', category: 'seller' },
      { text: 'Add Listing', icon: <AssignmentIcon />, path: '/dashboard/add-listing', category: 'seller' },
      { text: 'Orders', icon: <ShoppingCartIcon />, path: '/dashboard/orders', category: 'seller' },
    ],
    buyer: [
      { text: 'Orders', icon: <ShoppingCartIcon />, path: '/dashboard/orders', category: 'buyer' },
      { text: 'Applications', icon: <AssignmentTurnedInIcon />, path: '/dashboard/applications', category: 'buyer' },
      { text: 'Installments', icon: <AccountBalanceIcon />, path: '/dashboard/installments', category: 'buyer' },
      { text: 'Receipts', icon: <ReceiptIcon />, path: '/dashboard/receipts', category: 'buyer' },
    ]
  };

  const accountItems = [
    { text: 'Settings', icon: <SettingsIcon />, path: '/dashboard/settings', category: 'account' },
    { text: 'About', icon: <InfoIcon />, path: '/dashboard/about', category: 'account' },
    { text: 'Sign Out', icon: <LogoutIcon />, path: '/', category: 'account' },
  ];

  const items = [...baseItems];
  if (roleSpecificItems[userRole]) {
    items.push(...roleSpecificItems[userRole]);
  }
  items.push(...accountItems);
  
  return items;
};

export const MainListItems = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout, userRole } = useAuth();
  
  const menuItems = getMenuItemsForRole(userRole || 'buyer');
  
  // Group items by category
  const groupedItems = menuItems.reduce((acc, item) => {
    if (!acc[item.category]) {
      acc[item.category] = [];
    }
    acc[item.category].push(item);
    return acc;
  }, {});

  const sectionOrder = ['navigation', 'admin', 'seller', 'buyer', 'account'];
  const orderedSections = sectionOrder.filter((key) => groupedItems[key]).map((key) => [key, groupedItems[key]]);
  const remainingSections = Object.entries(groupedItems).filter(([key]) => !sectionOrder.includes(key));
  const sections = [...orderedSections, ...remainingSections];
  
  // Define category names
  const categoryNames = {
    navigation: 'Navigation',
    admin: 'Admin Tools',
    seller: 'Seller Tools',
    buyer: 'My Account',
    account: 'Account'
  };
  
  return (
    <React.Fragment>
      {sections.map(([category, items]) => (
        <React.Fragment key={category}>
          {category !== 'navigation' && (
            <ListSubheader
              sx={{
                color: '#7b90b0',
                fontSize: '0.72rem',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.6px',
                pt: 1.4,
                pb: 0.35,
                px: 1.5,
                bgcolor: 'transparent',
              }}
            >
              {categoryNames[category] || category}
            </ListSubheader>
          )}
          {items.map((item) => {
            const isSignOut = item.text === 'Sign Out';
            // Normalize paths and compute active state robustly
            const normalize = (p) => {
              if (!p) return '/';
              const trimmed = p.replace(/\/+$/, '');
              return trimmed === '' ? '/' : trimmed;
            };
            const currentPath = normalize(location.pathname);
            const itemPath = normalize(item.path);
            const isActive = (() => {
              // Sign Out ('/') should never be considered active unless on root
              if (itemPath === '/') return currentPath === '/';
              // Base dashboard should only match exactly
              if (itemPath === '/dashboard') return currentPath === '/dashboard';
              // Deeper routes: match exact or as a prefix segment
              return currentPath === itemPath || currentPath.startsWith(itemPath + '/');
            })();

            return (
              <ListItemButton
                key={item.text}
                sx={{
                  mx: 1,
                  mb: 0.35,
                  borderRadius: 2,
                  py: 0.95,
                  px: 1.2,
                  alignItems: 'center',
                  background: isActive ? 'linear-gradient(90deg, rgba(72, 206, 219, 0.22), rgba(72, 206, 219, 0.05))' : 'transparent',
                  border: isActive ? '1px solid rgba(72, 206, 219, 0.45)' : '1px solid rgba(255,255,255,0.04)',
                  boxShadow: isActive ? '0 4px 12px rgba(72, 206, 219, 0.15)' : 'none',
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    backgroundColor: isSignOut ? 'rgba(239, 68, 68, 0.12)' : 'rgba(72, 206, 219, 0.12)',
                    border: isSignOut ? '1px solid rgba(239, 68, 68, 0.3)' : '1px solid rgba(72, 206, 219, 0.35)',
                    transform: 'translateY(-1px)',
                  },
                }}
                onClick={async () => {
                  if (item.text === 'Sign Out') {
                    await logout();
                    navigate('/');
                  } else {
                    navigate(item.path);
                  }
                }}
              >
                <ListItemIcon
                  sx={{
                    color: isSignOut ? '#EF4444' : isActive ? '#48cedb' : '#9ca9c4',
                    minWidth: 36,
                    transition: 'color 0.2s ease, transform 0.2s ease',
                    fontSize: '1.1rem',
                  }}
                >
                  {item.icon}
                </ListItemIcon>
                <ListItemText
                  primary={item.text}
                  sx={{
                    '& .MuiListItemText-primary': {
                      color: isSignOut ? '#EF4444' : isActive ? '#e2f8fb' : '#d0d7e4',
                      fontWeight: isActive ? 700 : 500,
                      fontSize: '0.92rem',
                      letterSpacing: '0.01em',
                    },
                  }}
                />
              </ListItemButton>
            );
          })}
          {(category !== 'account') && (
            <Divider
              sx={{
                my: category === 'navigation' ? 0.5 : 0.9,
                mx: 1,
                bgcolor: '#243347',
                opacity: 0.5,
              }}
            />
          )}
        </React.Fragment>
      ))}
      <HelpSection />
    </React.Fragment>
  );
};

// Help Section Component
const HelpSection = () => {
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedHelp, setSelectedHelp] = useState(null);
  const [helpExpanded, setHelpExpanded] = useState(false);

  const helpItems = [
    {
      id: 'getting-started',
      title: 'Getting Started',
      icon: <ArticleIcon />,
      content: 'Learn the basics of using XtraPush. Navigate your dashboard, place orders, and manage your devices.'
    },
    {
      id: 'orders-payments',
      title: 'Orders & Payments',
      icon: <ShoppingCartIcon />,
      content: 'Understand how to track your orders, manage payments, and set up installment plans.'
    },
    {
      id: 'devices-tradeins',
      title: 'Devices & Trade-Ins',
      icon: <DevicesIcon />,
      content: 'Manage your device inventory and learn how to trade in your old gadgets for value.'
    },
    {
      id: 'subscriptions',
      title: 'Subscriptions & Insurance',
      icon: <ShoppingCartIcon />,
      content: 'Explore our XtraPush Plus and Premium plans with insurance coverage.'
    },
    {
      id: 'contact',
      title: 'Contact Support',
      icon: <ContactSupportIcon />,
      content: 'Reach out to our support team. Email: conrad@itsxtrapush.com | Call: +265-994-385706'
    },
    {
      id: 'bugs',
      title: 'Report an Issue',
      icon: <BugReportIcon />,
      content: 'Found a bug or have a suggestion? Let us know so we can improve your experience.'
    }
  ];

  return (
    <>
      <Divider sx={{ my: 1.25, bgcolor: '#243347', opacity: 0.65 }} />
      <Box sx={{ px: 1 }}>
        <ListItemButton
          onClick={() => setHelpExpanded(!helpExpanded)}
          sx={{
            borderRadius: 2,
            bgcolor: 'rgba(72, 206, 219, 0.08)',
            border: '1px solid rgba(72, 206, 219, 0.25)',
            boxShadow: '0 8px 24px rgba(0,0,0,0.18)',
            '&:hover': { bgcolor: 'rgba(72, 206, 219, 0.15)', transform: 'translateY(-1px)' },
            mb: 1
          }}
        >
          <ListItemIcon sx={{ color: '#48cedb', minWidth: 40 }}>
            <HelpIcon />
          </ListItemIcon>
          <ListItemText
            primary="Help & Support"
            sx={{ '& .MuiListItemText-primary': { color: '#48cedb', fontWeight: 600, fontSize: '0.95rem' } }}
          />
          {helpExpanded ? <ExpandLessIcon sx={{ color: '#48cedb' }} /> : <ExpandMoreIcon sx={{ color: '#48cedb' }} />}
        </ListItemButton>
        <Collapse in={helpExpanded}>
          <Box sx={{ pl: 2, pr: 1, py: 1 }}>
            {helpItems.map((item) => (
              <ListItemButton
                key={item.id}
                onClick={() => { setSelectedHelp(item); setOpenDialog(true); }}
                sx={{
                  py: 1,
                  px: 1.25,
                  borderRadius: 1.5,
                  bgcolor: 'rgba(255,255,255,0.03)',
                  '&:hover': { bgcolor: 'rgba(72, 206, 219, 0.15)' },
                  mb: 0.5,
                  border: '1px solid rgba(72, 206, 219, 0.18)'
                }}
              >
                <ListItemIcon sx={{ color: '#48cedb', minWidth: 32, fontSize: '1.1rem' }}>
                  {item.icon}
                </ListItemIcon>
                <ListItemText
                  primary={item.title}
                  primaryTypographyProps={{
                    variant: 'body2',
                    sx: { color: 'rgba(255,255,255,0.9)', fontWeight: 500, fontSize: '0.85rem' }
                  }}
                />
              </ListItemButton>
            ))}
          </Box>
        </Collapse>
      </Box>

      {/* Help Dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth
        PaperProps={{ sx: { bgcolor: 'rgba(5, 19, 35, 0.95)', border: '1px solid rgba(72, 206, 219, 0.3)' } }}>
        <DialogTitle sx={{ color: '#48cedb', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 1 }}>
          {selectedHelp?.icon}
          {selectedHelp?.title}
        </DialogTitle>
        <DialogContent sx={{ py: 2, color: 'rgba(255,255,255,0.9)' }}>
          <Typography variant="body2" sx={{ mb: 2 }}>{selectedHelp?.content}</Typography>
          {selectedHelp?.id === 'contact' && (
            <Box sx={{ bgcolor: 'rgba(72, 206, 219, 0.12)', p: 2, borderRadius: 1, border: '1px solid rgba(72, 206, 219, 0.3)' }}>
              <Typography variant="caption" sx={{ display: 'block', mb: 1 }}>
                <strong>UK Support:</strong> +44-7506-369609
              </Typography>
              <Typography variant="caption" sx={{ display: 'block', mb: 1 }}>
                <strong>Malawi Support:</strong> +265-994-385706
              </Typography>
              <Typography variant="caption">
                <strong>Email:</strong> conrad@itsxtrapush.com
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setOpenDialog(false)} sx={{ color: '#48cedb' }}>Close</Button>
          {selectedHelp?.id === 'bugs' && (
            <Button variant="contained" sx={{ bgcolor: '#48cedb', color: '#051323' }} onClick={() => window.location.href = 'mailto:conrad@itsxtrapush.com?subject=Bug Report'}>Report Now</Button>
          )}
        </DialogActions>
      </Dialog>
    </>
  );
};

// For backward compatibility
export const mainListItems = <MainListItems />;