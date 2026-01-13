import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Grid, 
  Button, 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  CircularProgress,
  TextField,
  Stepper,
  Step,
  StepLabel
} from '@mui/material';
import dayjs from 'dayjs';
import { useAuth } from '../contexts/AuthContext.jsx';
import { locations } from '../data/locations.js';
import { Link } from 'react-router-dom';
import { appointmentsAPI } from '../services/api.js';

const BookingCalendar = ({ gadgetId, gadgetName, onBookingComplete }) => {
  const [selectedDateStr, setSelectedDateStr] = useState(dayjs().add(1, 'day').format('YYYY-MM-DD'));
  const [selectedTime, setSelectedTime] = useState('');
  const [availableSlots, setAvailableSlots] = useState([]);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [selectedLocationId, setSelectedLocationId] = useState(locations[0]?.id || '');
  const [activeStep, setActiveStep] = useState(0);
  const [userHasActive, setUserHasActive] = useState(false);
  const { isAuthenticated, user } = useAuth();

  // Format the selected date to match our data structure
  const formattedDate = selectedDateStr;

  // Check if user has active appointment on component mount
  useEffect(() => {
    if (isAuthenticated && user?.id) {
      checkUserActiveAppointment();
    }
  }, [isAuthenticated, user?.id]);

  // Check user's active appointments
  const checkUserActiveAppointment = async () => {
    try {
      const res = await appointmentsAPI.getUserActive(user?.id);
      if (res?.success) {
        setUserHasActive(res.hasActive);
        if (res.hasActive) {
          setError('You already have an active appointment. Please complete or cancel it first.');
        }
      }
    } catch (err) {
      console.error('Error checking active appointments:', err);
    }
  };

  // Fetch available slots when date or location changes
  useEffect(() => {
    if (!selectedDateStr || !selectedLocationId) return;

    const fetchAvailableSlots = async () => {
      setSlotsLoading(true);
      setError(null);
      try {
        const res = await appointmentsAPI.getAvailableSlots(selectedDateStr, selectedLocationId);
        
        if (res?.success) {
          const slots = res.slots || [];
          setAvailableSlots(slots);
          
          // Check if it's a Sunday (day 0)
          const dayOfWeek = dayjs(selectedDateStr).day();
          if (dayOfWeek === 0) {
            setError('Appointments are not available on Sundays. Please select a different date.');
          } else if (slots.length === 0) {
            setError('No available slots for this date. Please choose another date.');
          }
        } else {
          setError(res?.message || 'Failed to load available time slots');
        }
        setSelectedTime(''); // Reset selected time when date changes
      } catch (err) {
        console.error('Error fetching available slots:', err);
        setError('Failed to load available time slots. Please try again.');
      } finally {
        setSlotsLoading(false);
      }
    };

    fetchAvailableSlots();
  }, [selectedDateStr, selectedLocationId]);

  const handleDateChange = (event) => {
    setSelectedDateStr(event.target.value);
    setActiveStep(0);
  };

  const handleTimeChange = (event) => {
    setSelectedTime(event.target.value);
    setActiveStep(1);
  };

  const handleLocationChange = (event) => {
    setSelectedLocationId(event.target.value);
    setSelectedTime('');
    setActiveStep(0);
  };

  const handleBookNow = () => {
    if (!isAuthenticated) {
      setError('Please sign in to book an appointment');
      return;
    }
    
    if (userHasActive) {
      setError('You already have an active appointment.');
      return;
    }
    
    if (!selectedTime) {
      setError('Please select a time slot');
      return;
    }
    
    setConfirmDialogOpen(true);
  };

  const handleConfirmBooking = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const locationName = locations.find(l => l.id === selectedLocationId)?.name || '';
      
      const payload = {
        gadgetId,
        gadgetName,
        appointmentDate: formattedDate,
        appointmentTime: selectedTime,
        locationId: selectedLocationId,
        locationName,
        userId: user?.id,
        userName: user?.displayName || user?.name || user?.email || 'Customer',
        userEmail: user?.email || ''
      };

      const res = await appointmentsAPI.create(payload);
      
      if (res?.success) {
        setSuccess(true);
        setConfirmDialogOpen(false);
        setError(null);
        
        // Reset form
        setSelectedTime('');
        setSelectedDateStr(dayjs().add(1, 'day').format('YYYY-MM-DD'));
        setActiveStep(0);
        
        // Update active appointment status
        setUserHasActive(true);
        
        if (onBookingComplete) {
          onBookingComplete({...payload, appointmentId: res.appointmentId});
        }
      } else {
        throw new Error(res?.error || 'Failed to create appointment');
      }
    } catch (err) {
      console.error('Error booking appointment:', err);
      setError(err.message || 'Failed to book appointment. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const minDate = dayjs().add(1, 'day').format('YYYY-MM-DD'); // Tomorrow minimum
  const maxDate = dayjs().add(90, 'day').format('YYYY-MM-DD'); // 90 days max

  const selectedDateObj = dayjs(selectedDateStr);
  const dayOfWeek = selectedDateObj.day();
  const isSunday = dayOfWeek === 0;

  return (
    <Paper elevation={3} sx={{ p: 3, mb: 4, borderRadius: 2, background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)' }}>
      <Typography variant="h5" component="h2" gutterBottom sx={{ fontWeight: 'bold', color: '#333', display: 'flex', alignItems: 'center', gap: 1 }}>
        📅 Schedule a Viewing
      </Typography>
      
      <Typography variant="body2" sx={{ mb: 2, color: '#666' }}>
        Book an appointment to view the <strong>{gadgetName}</strong> in person at our mobile van.
      </Typography>

      {userHasActive && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          You have an active appointment. Complete or cancel it before booking another viewing.
        </Alert>
      )}
      
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}
      
      {success && (
        <Alert severity="success" sx={{ mb: 2 }}>
          ✅ Your appointment has been booked successfully! Check your email for confirmation details.
        </Alert>
      )}

      {/* Stepper */}
      <Stepper activeStep={activeStep} sx={{ mb: 3 }}>
        <Step>
          <StepLabel>Select Date</StepLabel>
        </Step>
        <Step>
          <StepLabel>Select Time</StepLabel>
        </Step>
        <Step>
          <StepLabel>Confirm</StepLabel>
        </Step>
      </Stepper>
      
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              label="Select Date"
              type="date"
              value={selectedDateStr}
              onChange={handleDateChange}
              inputProps={{ min: minDate, max: maxDate }}
              fullWidth
              helperText="Business hours: Monday-Saturday, 9 AM-5 PM"
              disabled={userHasActive}
            />
            <FormControl fullWidth sx={{ my: 1 }} disabled={userHasActive}>
              <InputLabel id="location-label">Meeting Location</InputLabel>
              <Select
                labelId="location-label"
                id="location-select"
                value={selectedLocationId}
                label="Meeting Location"
                onChange={handleLocationChange}
              >
                {locations.map((loc) => (
                  <MenuItem key={loc.id} value={loc.id}>
                    {loc.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <Typography variant="caption" sx={{ color: '#666' }}>
              <Link to="/find-us" style={{ color: '#48CEDB', textDecoration: 'none', fontWeight: 'bold' }}>
                📍 Find Us
              </Link> for location details and directions.
            </Typography>
          </Box>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'center', gap: 2 }}>
            <Box>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
                {selectedDateObj.format('dddd, MMMM D, YYYY')}
              </Typography>
              {isSunday && (
                <Alert severity="info" sx={{ mb: 1 }}>
                  ⚠️ Appointments not available on Sundays
                </Alert>
              )}
            </Box>
            
            {slotsLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', my: 2 }}>
                <CircularProgress size={24} />
              </Box>
            ) : !isSunday && availableSlots.length > 0 ? (
              <>
                <FormControl fullWidth sx={{ my: 1 }} disabled={userHasActive}>
                  <InputLabel id="time-slot-label">Select Time</InputLabel>
                  <Select
                    labelId="time-slot-label"
                    id="time-slot-select"
                    value={selectedTime}
                    label="Select Time"
                    onChange={handleTimeChange}
                  >
                    {availableSlots.map((slot) => (
                      <MenuItem key={slot} value={slot}>
                        {dayjs(`2000-01-01 ${slot}`).format('h:mm A')}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                
                <Button 
                  variant="contained" 
                  color="success"
                  fullWidth
                  disabled={!selectedTime || loading || userHasActive}
                  onClick={handleBookNow}
                  sx={{ mt: 1, fontWeight: 'bold' }}
                >
                  {loading ? <CircularProgress size={20} /> : '✓ Book Appointment'}
                </Button>
              </>
            ) : (
              !isSunday && (
                <Alert severity="info" sx={{ my: 2 }}>
                  No available slots for this date. Please try another date.
                </Alert>
              )
            )}
          </Box>
        </Grid>
      </Grid>
      
      {/* Confirmation Dialog */}
      <Dialog open={confirmDialogOpen} onClose={() => setConfirmDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 'bold', color: '#48CEDB' }}>
          ✓ Confirm Your Booking
        </DialogTitle>
        <DialogContent sx={{ mt: 1 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            <Box>
              <Typography variant="caption" sx={{ color: '#666' }}>Gadget</Typography>
              <Typography variant="body1" sx={{ fontWeight: 'bold' }}>{gadgetName}</Typography>
            </Box>
            <Box>
              <Typography variant="caption" sx={{ color: '#666' }}>Date & Time</Typography>
              <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                {dayjs(selectedDateStr).format('dddd, MMMM D, YYYY')} at {dayjs(`2000-01-01 ${selectedTime}`).format('h:mm A')}
              </Typography>
            </Box>
            <Box>
              <Typography variant="caption" sx={{ color: '#666' }}>Location</Typography>
              <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                {locations.find(l => l.id === selectedLocationId)?.name}
              </Typography>
            </Box>
            <Box sx={{ background: '#f0f0f0', p: 1.5, borderRadius: 1, mt: 1 }}>
              <Typography variant="caption" sx={{ color: '#666' }}>
                A confirmation email will be sent to <strong>{user?.email}</strong>
              </Typography>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDialogOpen(false)} color="primary">
            Cancel
          </Button>
          <Button 
            onClick={handleConfirmBooking} 
            color="success" 
            variant="contained"
            disabled={loading}
            sx={{ fontWeight: 'bold' }}
          >
            {loading ? <CircularProgress size={20} /> : 'Confirm Booking'}
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
};

export default BookingCalendar;