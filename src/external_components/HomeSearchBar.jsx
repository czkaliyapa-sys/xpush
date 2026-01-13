// HomeSearchBar.jsx
import React, { useState, useEffect } from 'react';
import { InputBase, Paper, IconButton, Box, Typography, List, ListItem, ListItemText, Divider, Avatar, ListItemAvatar } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { gadgetsAPI } from '../services/api.js';

const MotionPaper = motion(Paper);

const HomeSearchBar = ({ onSearch }) => {
  const [query, setQuery] = useState('');
  const [focused, setFocused] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [showResults, setShowResults] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (query.trim() === '') {
      setSearchResults([]);
      setShowResults(false);
      return;
    }

    const searchGadgets = async () => {
      try {
        const response = await gadgetsAPI.getAll({ page: 1, limit: 20 });
        if (response.success) {
          const filteredResults = response.data.filter(gadget => 
            gadget.name.toLowerCase().includes(query.toLowerCase()) ||
            gadget.description.toLowerCase().includes(query.toLowerCase())
          );
          setSearchResults(filteredResults);
          setShowResults(true);
        }
      } catch (error) {
        console.error('Error searching gadgets:', error);
        setSearchResults([]);
        setShowResults(false);
      }
    };

    searchGadgets();
  }, [query]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (query.trim() !== '') {
      // Navigate to gadgets page if there are results
      if (searchResults.length > 0) {
        navigate(`/gadgets/${searchResults[0].id}`);
      }
    }
    if (onSearch) onSearch(query);
  };

  const handleItemClick = (id) => {
    setShowResults(false);
    navigate(`/gadgets/${id}`);
  };

  return (
    <Box sx={{ position: 'relative', width: { xs: '95%', sm: '85%', md: '80%' }, maxWidth: '600px', mx: 'auto' }}>
      <MotionPaper
        component="form"
        onSubmit={handleSubmit}
        initial={{ boxShadow: '0px 0px 0px 0px rgba(0,150,136,0)', filter: 'drop-shadow(0px 0px 0px rgba(0,150,136,0))' }}
        animate={{
          width: focused ? '100%' : '85%',
          boxShadow: focused
            ? [
                '0px 0px 0px 0px rgba(0,206,209,0)',
                '0px 8px 20px 8px rgba(0,206,209,0.28)',
                '0px 0px 0px 0px rgba(0,206,209,0)'
              ]
            : '0px 0px 0px 0px rgba(0,206,209,0)',
          filter: focused ? 'drop-shadow(0px 8px 12px rgba(0,206,209,0.22))' : 'drop-shadow(0px 0px 0px rgba(0,206,209,0))'
        }}
        transition={{
          width: { duration: 0.4, ease: 'easeInOut' },
          boxShadow: { duration: 1.8, ease: 'easeInOut', repeat: focused ? Infinity : 0, repeatType: 'mirror' },
          filter: { duration: 0.5, ease: 'easeInOut' }
        }}
        sx={{
          display: 'flex',
          alignItems: 'center',
          px: 1,
          borderRadius: 2,
          overflow: 'visible',
          borderTop: '1px solid rgba(255,255,255,0.08)',
          width: '100%', // allow framer motion to control width
          zIndex: 10
        }}
      >
        <InputBase
          sx={{ ml: 1, flex: 1 }}
          placeholder="Type your gadget"
          inputProps={{ 'aria-label': 'search' }}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
          }}
          onFocus={() => setFocused(true)}
          onBlur={() => {
            setFocused(false);
            setTimeout(() => setShowResults(false), 200);
          }}
        />
        <IconButton type="submit" sx={{ p: '10px' }} aria-label="search">
          <SearchIcon />
        </IconButton>
      </MotionPaper>

      {/* Glow layer, biased downward to keep the top edge clear */}
      <motion.div
        aria-hidden
        initial={{ opacity: 0 }}
        animate={{
          opacity: focused ? 0.55 : 0,
          boxShadow: focused ? '0 8px 24px 10px rgba(0,206,209,0.28)' : '0 0 0 0 rgba(0,0,0,0)'
        }}
        transition={{ duration: 0.5, ease: 'easeInOut' }}
        style={{
          position: 'absolute',
          top: 6,
          left: 0,
          right: 0,
          bottom: 0,
          borderRadius: 12,
          pointerEvents: 'none',
          zIndex: 9
        }}
      />
      
      {showResults && searchResults.length > 0 && (
        <Paper 
          sx={{ 
            position: 'absolute', 
            top: '100%', 
            left: 0, 
            right: 0, 
            zIndex: 9, 
            mt: 0.5, 
            maxHeight: '300px', 
            overflow: 'auto',
            boxShadow: 3
          }}
        >
          <List>
            {searchResults.map((result, index) => (
              <React.Fragment key={result.id}>
                <ListItem 
                  button 
                  onClick={() => handleItemClick(result.id)}
                  sx={{ 
                    '&:hover': { 
                      backgroundColor: 'rgba(92, 225, 230, 0.1)' 
                    } 
                  }}
                >
                  <ListItemAvatar>
                    <Avatar 
                      src={result.image} 
                      alt={result.name}
                      variant="rounded"
                      sx={{ width: 50, height: 50, mr: 1 }}
                  />
                </ListItemAvatar>
                <ListItemText 
                  primary={result.name} 
                  secondary={
                    <Typography variant="body2" color="text.secondary" noWrap>
                      {result.description}
                    </Typography>
                  }
                />
              </ListItem>
                {index < searchResults.length - 1 && <Divider />}
              </React.Fragment>
            ))}
          </List>
        </Paper>
      )}
    </Box>
  );
};

export default HomeSearchBar;