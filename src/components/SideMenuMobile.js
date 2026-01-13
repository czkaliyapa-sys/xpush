import * as React from 'react';
import PropTypes from 'prop-types';
import Avatar from '@mui/material/Avatar';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import Drawer, { drawerClasses } from '@mui/material/Drawer';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import LogoutRoundedIcon from '@mui/icons-material/LogoutRounded';
import NotificationsRoundedIcon from '@mui/icons-material/NotificationsRounded';
import MenuButton from './MenuButton';
import MenuContent from './MenuContent';
import CardAlert from './CardAlert';
import { useAuth } from '../contexts/AuthContext.jsx';
import { useNavigate } from 'react-router-dom';

function SideMenuMobile({ open, toggleDrawer }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  // Extract user display name and email
  const getUserDisplayName = () => {
    if (user?.displayName) {
      return user.displayName;
    }
    if (user?.email) {
      // Extract name from email (part before @)
      return user.email.split('@')[0];
    }
    return 'User';
  };
  
  const handleLogout = async () => {
    await logout();
    navigate('/');
  };
  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={toggleDrawer(false)}
      sx={{
        zIndex: (theme) => theme.zIndex.drawer + 1,
        [`& .${drawerClasses.paper}`]: {
          backgroundImage: 'none',
          backgroundColor: 'background.paper',
        },
      }}
    >
      <Stack
        sx={{
          maxWidth: '70dvw',
          height: '100%',
        }}
      >
        <Stack direction="row" sx={{ p: 2, pb: 0, gap: 1 }}>
          <Stack
            direction="row"
            sx={{ gap: 1, alignItems: 'center', flexGrow: 1, p: 1 }}
          >
            <Avatar
              sizes="small"
              alt={getUserDisplayName()}
              src="/static/images/avatar/7.jpg"
              sx={{ width: 24, height: 24 }}
            />
            <Typography component="p" variant="h6">
              {getUserDisplayName()}
            </Typography>
          </Stack>
          <MenuButton showBadge>
            <NotificationsRoundedIcon />
          </MenuButton>
        </Stack>
        <Divider />
        <Stack sx={{ flexGrow: 1 }}>
          <MenuContent />
          <Divider />
        </Stack>
        <CardAlert />
        <Stack sx={{ p: 2 }}>
          <Button variant="outlined" fullWidth startIcon={<LogoutRoundedIcon />} onClick={handleLogout}>
            Logout
          </Button>
        </Stack>
      </Stack>
    </Drawer>
  );
}

SideMenuMobile.propTypes = {
  open: PropTypes.bool,
  toggleDrawer: PropTypes.func.isRequired,
};

export default SideMenuMobile;
