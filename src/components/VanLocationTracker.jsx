import React, { useState, useEffect } from 'react';
import { Box, Typography, Paper, CircularProgress, Alert, Button } from '@mui/material';
import { useAuth } from '../contexts/AuthContext.jsx';
import { useNavigate } from 'react-router-dom';

// Mock data for van location - in a real app, this would come from a real-time database
const mockVanLocation = {
  latitude: 51.5074,
  longitude: -0.1278,
  address: "123 Tech Street, London",
  lastUpdated: new Date().toISOString(),
  status: "On route",
  estimatedArrival: "2:30 PM"
};

const VanLocationTracker = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [vanLocation, setVanLocation] = useState(null);
  const { isAuthenticated, user } = useAuth();
  const [mapLoaded, setMapLoaded] = useState(false);

  useEffect(() => {
    // In a real app, this would be a real-time subscription to van location
    const fetchVanLocation = async () => {
      if (!isAuthenticated) {
        setError("Please sign in to view the van location");
        setLoading(false);
        return;
      }

      try {
        // Simulate API call delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Set mock data
        setVanLocation(mockVanLocation);
        setMapLoaded(true);
      } catch (err) {
        console.error('Error fetching van location:', err);
        setError('Failed to load van location data');
      } finally {
        setLoading(false);
      }
    };

    fetchVanLocation();

    // In a real app, you would set up a real-time listener here
    // and clean it up in the return function
    const intervalId = setInterval(() => {
      if (isAuthenticated) {
        // Simulate location updates by slightly changing coordinates
        setVanLocation(prev => {
          if (!prev) return mockVanLocation;
          
          return {
            ...prev,
            latitude: prev.latitude + (Math.random() * 0.001 - 0.0005),
            longitude: prev.longitude + (Math.random() * 0.001 - 0.0005),
            lastUpdated: new Date().toISOString()
          };
        });
      }
    }, 10000); // Update every 10 seconds

    return () => clearInterval(intervalId);
  }, [isAuthenticated]);

  // Function to load Google Maps script
  useEffect(() => {
    if (!vanLocation) return;

    // This would be replaced with actual Google Maps integration
    const loadGoogleMapsScript = () => {
      // In a real implementation, you would load the Google Maps script here
      // and initialize the map with the van's location
      console.log("Map would be initialized with:", vanLocation);
    };

    loadGoogleMapsScript();
  }, [vanLocation]);

  if (loading) {
    return (
      <Paper elevation={3} sx={{ p: 3, mb: 4, borderRadius: 2, textAlign: 'center' }}>
        <CircularProgress size={40} sx={{ mb: 2 }} />
        <Typography>Loading van location...</Typography>
      </Paper>
    );
  }

  if (error) {
    return (
      <Paper elevation={3} sx={{ p: 3, mb: 4, borderRadius: 2 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
        {!isAuthenticated && (
          <Button 
            variant="contained" 
            color="primary" 
            onClick={() => navigate('/signin')}
            fullWidth
          >
            Sign In to View Location
          </Button>
        )}
      </Paper>
    );
  }

  return (
    <Paper elevation={3} sx={{ p: 3, mb: 4, borderRadius: 2 }}>
      <Typography variant="h5" component="h2" gutterBottom sx={{ fontWeight: 'bold', color: '#333' }}>
        Mobile Van Location
      </Typography>
      
      <Typography variant="body1" sx={{ mb: 3, color: '#666' }}>
        Track the location of our mobile gadget van in real-time.
      </Typography>
      
      {vanLocation && (
        <>
          {/* Map placeholder - would be replaced with actual Google Maps component */}
          <Box 
            sx={{ 
              width: '100%', 
              height: 300, 
              bgcolor: '#e0e0e0', 
              mb: 2, 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              position: 'relative',
              borderRadius: 1,
              overflow: 'hidden'
            }}
          >
            {mapLoaded ? (
              <>
                <Typography variant="body1" sx={{ position: 'absolute', zIndex: 1 }}>
                  Map showing van location
                </Typography>
                <Box 
                  sx={{ 
                    position: 'absolute', 
                    top: 10, 
                    right: 10, 
                    bgcolor: 'rgba(255,255,255,0.8)', 
                    p: 1, 
                    borderRadius: 1,
                    zIndex: 2
                  }}
                >
                  <Typography variant="caption">
                    Last updated: {new Date(vanLocation.lastUpdated).toLocaleTimeString()}
                  </Typography>
                </Box>
                <img 
                  src={`https://maps.googleapis.com/maps/api/staticmap?center=${vanLocation.latitude},${vanLocation.longitude}&zoom=14&size=600x300&markers=color:red%7C${vanLocation.latitude},${vanLocation.longitude}&key=YOUR_API_KEY`} 
                  alt="Van Location Map"
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              </>
            ) : (
              <CircularProgress />
            )}
          </Box>
          
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            <Typography variant="body1">
              <strong>Current Address:</strong> {vanLocation.address}
            </Typography>
            <Typography variant="body1">
              <strong>Status:</strong> {vanLocation.status}
            </Typography>
            <Typography variant="body1">
              <strong>Estimated Arrival:</strong> {vanLocation.estimatedArrival}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Coordinates: {vanLocation.latitude.toFixed(4)}, {vanLocation.longitude.toFixed(4)}
            </Typography>
          </Box>
        </>
      )}
    </Paper>
  );
};

export default VanLocationTracker;