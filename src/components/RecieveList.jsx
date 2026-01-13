import * as React from 'react';
import Box from '@mui/material/Box';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Divider from '@mui/material/Divider';
import InboxIcon from '@mui/icons-material/Inbox';
import DraftsIcon from '@mui/icons-material/Drafts';
import { Home, Settings, Info, Star,
    
} from "@mui/icons-material";

export default function RecieveList() {
  return (
    <Box sx={{ width: '100%', maxWidth: 360, backgroundColor: '#051323', color: 'white'}}>
    
      <nav aria-label="secondary mailbox folders">
        <List>
          <ListItem disablePadding>
            <ListItemButton>
            <ListItemIcon>
                <Star sx={{ color: "white", fontSize: 30 }}/>
              </ListItemIcon>
              <ListItemText primary="Paypal" />
            </ListItemButton>
          </ListItem>
          <ListItem disablePadding>
            <ListItemButton>
            <ListItemIcon>
                <Star sx={{ color: "white", fontSize: 30 }}/>
              </ListItemIcon>
              <ListItemText primary="Wise" />
            </ListItemButton>
          </ListItem>
          <ListItem disablePadding>
            <ListItemButton>
            <ListItemIcon>
                <Star sx={{ color: "white", fontSize: 30 }}/>
              </ListItemIcon>
              <ListItemText primary="Revolut" />
            </ListItemButton>
          </ListItem>
          <ListItem disablePadding>
            <ListItemButton>
            <ListItemIcon>
                <Star sx={{ color: "white", fontSize: 30 }}/>
              </ListItemIcon>
              <ListItemText primary="Binance" />
            </ListItemButton>
          </ListItem>
          <ListItem disablePadding>
            <ListItemButton>
            <ListItemIcon>
                <Star sx={{ color: "white", fontSize: 30 }}/>
              </ListItemIcon>
              <ListItemText primary="Airtel Money / TNM Mpamba" />
            </ListItemButton>
          </ListItem>
          <ListItem disablePadding>
            <ListItemButton>
            <ListItemIcon>
                <Star sx={{ color: "white", fontSize: 30 }}/>
              </ListItemIcon>
              <ListItemText primary="National Bank of Malawi" />
            </ListItemButton>
          </ListItem>
        </List>
      </nav>
    </Box>
  );
}
