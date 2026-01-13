import React, { useState, useEffect, useCallback } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  CircularProgress,
  Stepper,
  Step,
  StepLabel
} from '@mui/material';
import dayjs from 'dayjs';
import { useAuth } from '../contexts/AuthContext.jsx';
import { locations } from '../data/locations.js';
import { appointmentsAPI } from '../services/api.js';

interface QuickBookingModalProps {
  open: boolean;
  onClose: () => void;
  gadgetId: number | string;
  gadgetName: string;
  gadgetImage?: string;
}

const QuickBookingModal: React.FC<QuickBookingModalProps> = ({
  open,
  onClose,
  gadgetId,
  gadgetName,
  gadgetImage
}) => {
  const [selectedDateStr, setSelectedDateStr] = useState(dayjs().add(1, 'day').format('YYYY-MM-DD'));
  const [selectedTime, setSelectedTime] = useState('');
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [selectedLocationId, setSelectedLocationId] = useState(locations[0]?.id || '');
  const [loading, setLoading] = useState(false);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  const [userHasActive, setUserHasActive] = useState(false);
  const { isAuthenticated, user } = useAuth();

  const checkUserActiveAppointment = useCallback(async () => {
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
  }, [user?.id]);

  // Check user active appointment on mount
  useEffect(() => {
    if (isAuthenticated && user?.id && open) {
      checkUserActiveAppointment();
    }
  }, [isAuthenticated, user?.id, open, checkUserActiveAppointment]);

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
          
          const dayOfWeek = dayjs(selectedDateStr).day();
          if (dayOfWeek === 0) {
            setError('Appointments are not available on Sundays. Please select a different date.');
          } else if (slots.length === 0) {
            setError('No available slots for this date. Please choose another date.');
          }
        } else {
          setError(res?.message || 'Failed to load available time slots');
        }
        setSelectedTime('');
      } catch (err) {
        console.error('Error fetching available slots:', err);
        setError('Failed to load available time slots. Please try again.');
      } finally {
        setSlotsLoading(false);
      }
    };

    fetchAvailableSlots();
  }, [selectedDateStr, selectedLocationId]);

  const handleBooking = async () => {
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
    
    setLoading(true);
    setError(null);
    
    try {
      const locationName = locations.find(l => l.id === selectedLocationId)?.name || '';
      
      const payload = {
        gadgetId,
        gadgetName,
        appointmentDate: selectedDateStr,
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
        setError(null);
        
        // Reset form
        setTimeout(() => {
          setSelectedTime('');
          setSelectedDateStr(dayjs().add(1, 'day').format('YYYY-MM-DD'));
          setActiveStep(0);
          setSuccess(false);
          setUserHasActive(true);
          onClose();
        }, 2000);
      } else {
        throw new Error(res?.error || 'Failed to create appointment');
      }
    } catch (err) {
      console.error('Error booking appointment:', err);
      setError((err as any)?.message || 'Failed to book appointment. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const minDate = dayjs().add(1, 'day').format('YYYY-MM-DD');
  const maxDate = dayjs().add(90, 'day').format('YYYY-MM-DD');

  const selectedDateObj = dayjs(selectedDateStr);
  const dayOfWeek = selectedDateObj.day();
  const isSunday = dayOfWeek === 0;

  // Set flag to prevent parent navigation when modal is open
  useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as any).__dialogOpen = open;
    }
    return () => {
      if (typeof window !== 'undefined') {
        (window as any).__dialogOpen = false;
      }
    };
  }, [open]);

  if (!open) return null;

  return (
    <Dialog 
      open={open} 
      onClose={(event: any, reason: string) => {
        // Only allow closing via Escape or backdrop if not in loading state
        if (loading) {
          if (event?.preventDefault) {
            event.preventDefault();
          }
          return;
        }
        onClose();
      }}
      maxWidth="sm" 
      fullWidth
      disableEscapeKeyDown={loading}
    >
      <DialogTitle sx={{ fontWeight: 'bold', color: '#48CEDB', display: 'flex', alignItems: 'center', gap: 1 }}>
        📅 Schedule Viewing - {gadgetName}
      </DialogTitle>
      
      <DialogContent sx={{ mt: 1 }}>
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
            ✅ Your appointment has been booked successfully! Check your email for confirmation.
          </Alert>
        )}

        <Stepper activeStep={activeStep} sx={{ mb: 2 }}>
          <Step>
            <StepLabel>Select Date</StepLabel>
          </Step>
          <Step>
            <StepLabel>Select Time</StepLabel>
          </Step>
        </Stepper>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <TextField
            label="Select Date"
            type="date"
            value={selectedDateStr}
            onChange={(e) => {
              setSelectedDateStr(e.target.value);
              setActiveStep(0);
            }}
            inputProps={{ min: minDate, max: maxDate }}
            fullWidth
            disabled={userHasActive}
            helperText="Business hours: Monday-Saturday, 9 AM-5 PM"
          />
          
          <FormControl fullWidth disabled={userHasActive}>
            <InputLabel id="location-label">Meeting Location</InputLabel>
            <Select
              labelId="location-label"
              value={selectedLocationId}
              label="Meeting Location"
              onChange={(e) => setSelectedLocationId(e.target.value)}
            >
              {locations.map((loc) => (
                <MenuItem key={loc.id} value={loc.id}>
                  {loc.emoji} {loc.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <Box>
            <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 'bold' }}>
              {selectedDateObj.format('dddd, MMMM D, YYYY')}
            </Typography>
            
            {isSunday && (
              <Alert severity="info" sx={{ mb: 1 }}>
                ⚠️ Appointments not available on Sundays
              </Alert>
            )}

            {slotsLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
                <CircularProgress size={24} />
              </Box>
            ) : !isSunday && availableSlots.length > 0 ? (
              <FormControl fullWidth>
                <InputLabel id="time-slot-label">Select Time</InputLabel>
                <Select
                  labelId="time-slot-label"
                  value={selectedTime}
                  label="Select Time"
                  onChange={(e) => {
                    setSelectedTime(e.target.value);
                    setActiveStep(1);
                  }}
                  disabled={userHasActive}
                >
                  {availableSlots.map((slot) => (
                    <MenuItem key={slot} value={slot}>
                      {dayjs(`2000-01-01 ${slot}`).format('h:mm A')}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            ) : (
              !isSunday && (
                <Alert severity="info">
                  No available slots for this date. Please try another date.
                </Alert>
              )
            )}
          </Box>
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 2, gap: 1 }}>
        <Button onClick={onClose} color="primary">
          Cancel
        </Button>
        <Button 
          onClick={handleBooking} 
          color="success" 
          variant="contained"
          disabled={!selectedTime || loading || userHasActive}
        >
          {loading ? <CircularProgress size={20} /> : '✓ Book Viewing'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default QuickBookingModal;
