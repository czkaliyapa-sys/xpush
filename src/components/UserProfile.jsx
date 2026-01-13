import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Grid,
  Avatar,
  Divider,
  Alert,
  CircularProgress,
  IconButton,
  Paper
} from '@mui/material';
import { styled } from '@mui/material/styles';
import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Save';
import CancelIcon from '@mui/icons-material/Cancel';
import PersonIcon from '@mui/icons-material/Person';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import PhoneIcon from '@mui/icons-material/Phone';
import EmailIcon from '@mui/icons-material/Email';
import { useAuth } from '../contexts/AuthContext.jsx';

const ProfileCard = styled(Card)(({ theme }) => ({
  width: '100%',
  maxWidth: 'none',
  margin: '16px auto',
  background: 'rgba(255, 255, 255, 0.05)',
  backdropFilter: 'blur(10px)',
  border: '1px solid rgba(255, 255, 255, 0.1)',
  borderRadius: 16,
  color: 'white'
  ,
  [theme.breakpoints.down('md')]: {
    width: '100%'
  }
}));

const SectionCard = styled(Paper)(({ theme }) => ({
  background: 'rgba(255, 255, 255, 0.03)',
  backdropFilter: 'blur(10px)',
  border: '1px solid rgba(255, 255, 255, 0.08)',
  borderRadius: 12,
  padding: theme.spacing(3),
  marginBottom: theme.spacing(2)
}));

const ProfileHeader = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  marginBottom: theme.spacing(3),
  gap: theme.spacing(2)
}));

const UserProfile = () => {
  const { user, userProfile, updateUserProfile } = useAuth();
  const [editing, setEditing] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    town: '',
    address: '',
    postcode: '',
    phone: ''
  });

  useEffect(() => {
    setFormData({
      fullName: (userProfile?.fullName ?? user?.displayName ?? ''),
      email: (userProfile?.email ?? user?.email ?? ''),
      town: (userProfile?.town ?? ''),
      address: (userProfile?.address ?? ''),
      postcode: (userProfile?.postcode ?? ''),
      phone: (userProfile?.phone ?? '')
    });
  }, [userProfile, user]);

  const handleInputChange = (field) => (event) => {
    setFormData(prev => ({
      ...prev,
      [field]: event.target.value
    }));
    setError(null);
    setSuccess(false);
  };

  const handleSave = async () => {
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      // Validate required fields
      const missingFields = [];
      if (!formData.email?.trim()) missingFields.push('Email');
      if (!formData.fullName?.trim()) missingFields.push('Full Name');
      if (!formData.address?.trim()) missingFields.push('Address');
      
      if (missingFields.length > 0) {
        setError(`Please fill in all required fields: ${missingFields.join(', ')}`);
        setLoading(false);
        return;
      }
      
      const result = await updateUserProfile(formData);
      
      if (result.success) {
        setSuccess(true);
        setEditing(false);
        setTimeout(() => setSuccess(false), 3000);
      } else {
        setError(result.error || 'Failed to update profile');
      }
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    // Reset form data to original values
    if (userProfile) {
      setFormData({
        fullName: userProfile.fullName || user?.displayName || '',
        email: userProfile.email || user?.email || '',
        town: userProfile.town || '',
        address: userProfile.address || '',
        postcode: userProfile.postcode || '',
        phone: userProfile.phone || ''
      });
    }
    setEditing(false);
    setError(null);
    setSuccess(false);
  };

  return (
    <ProfileCard elevation={0}>
      <CardContent sx={{ p: 4 }}>
        <ProfileHeader>
          <Avatar 
            src={user?.photoURL} 
            sx={{ 
              width: 100, 
              height: 100,
              border: '3px solid #48CEDB',
              boxShadow: '0 4px 20px rgba(72, 206, 219, 0.3)'
            }}
          >
            {!user?.photoURL && <PersonIcon sx={{ fontSize: 50 }} />}
          </Avatar>
          <Box sx={{ flex: 1 }}>
            <Typography variant="h4" gutterBottom sx={{ fontWeight: 700, color: '#48CEDB' }}>
              Profile Settings
            </Typography>
            <Typography variant="body1" sx={{ color: 'rgba(255,255,255,0.7)' }}>
              Manage your personal information and account preferences
            </Typography>
          </Box>
          <IconButton 
            onClick={() => editing ? handleCancel() : setEditing(true)}
            disabled={loading}
            sx={{
              bgcolor: editing ? 'rgba(244, 67, 54, 0.1)' : 'rgba(72, 206, 219, 0.1)',
              color: editing ? '#f44336' : '#48CEDB',
              border: editing ? '1px solid rgba(244, 67, 54, 0.3)' : '1px solid rgba(72, 206, 219, 0.3)',
              '&:hover': {
                bgcolor: editing ? 'rgba(244, 67, 54, 0.2)' : 'rgba(72, 206, 219, 0.2)'
              }
            }}
          >
            {editing ? <CancelIcon /> : <EditIcon />}
          </IconButton>
        </ProfileHeader>

        <Divider sx={{ mb: 4, borderColor: 'rgba(255,255,255,0.1)' }} />

        {error && (
          <Alert 
            severity="error" 
            sx={{ 
              mb: 3, 
              bgcolor: 'rgba(244, 67, 54, 0.1)', 
              color: 'white',
              border: '1px solid rgba(244, 67, 54, 0.3)'
            }}
          >
            {error}
          </Alert>
        )}

        {success && (
          <Alert 
            severity="success" 
            sx={{ 
              mb: 3, 
              bgcolor: 'rgba(76, 175, 80, 0.1)', 
              color: 'white',
              border: '1px solid rgba(76, 175, 80, 0.3)'
            }}
          >
            Profile updated successfully!
          </Alert>
        )}

        {/* Personal Information Section */}
        <SectionCard elevation={0}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
            <PersonIcon sx={{ color: '#48CEDB' }} />
            <Typography variant="h6" sx={{ fontWeight: 600, color: 'white' }}>
              Personal Information
            </Typography>
          </Box>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Full Name *"
                value={formData.fullName}
                onChange={handleInputChange('fullName')}
                disabled={!editing || loading}
                variant="outlined"
                required
                sx={{
                  '& .MuiOutlinedInput-root': {
                    color: 'white',
                    '& fieldset': { borderColor: 'rgba(255,255,255,0.2)' },
                    '&:hover fieldset': { borderColor: 'rgba(72, 206, 219, 0.5)' },
                    '&.Mui-focused fieldset': { borderColor: '#48CEDB' },
                    '&.Mui-disabled': { opacity: 0.6 }
                  },
                  '& .MuiInputLabel-root': { color: 'rgba(255,255,255,0.7)' },
                  '& .MuiInputLabel-root.Mui-focused': { color: '#48CEDB' }
                }}
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Email Address *"
                value={formData.email}
                onChange={handleInputChange('email')}
                disabled={true}
                variant="outlined"
                required
                helperText="Email cannot be changed"
                InputProps={{
                  startAdornment: <EmailIcon sx={{ mr: 1, color: 'rgba(255,255,255,0.5)' }} />
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    color: 'white',
                    '& fieldset': { borderColor: 'rgba(255,255,255,0.2)' },
                    '&.Mui-disabled': { opacity: 0.6 }
                  },
                  '& .MuiInputLabel-root': { color: 'rgba(255,255,255,0.7)' },
                  '& .MuiFormHelperText-root': { color: 'rgba(255,255,255,0.5)' }
                }}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Phone Number"
                value={formData.phone}
                onChange={handleInputChange('phone')}
                disabled={!editing || loading}
                variant="outlined"
                placeholder="e.g., +265 999 123 456"
                helperText="Include country code (e.g., +265 for Malawi, +44 for UK)"
                InputProps={{
                  startAdornment: <PhoneIcon sx={{ mr: 1, color: 'rgba(255,255,255,0.5)' }} />
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    color: 'white',
                    '& fieldset': { borderColor: 'rgba(255,255,255,0.2)' },
                    '&:hover fieldset': { borderColor: 'rgba(72, 206, 219, 0.5)' },
                    '&.Mui-focused fieldset': { borderColor: '#48CEDB' },
                    '&.Mui-disabled': { opacity: 0.6 }
                  },
                  '& .MuiInputLabel-root': { color: 'rgba(255,255,255,0.7)' },
                  '& .MuiInputLabel-root.Mui-focused': { color: '#48CEDB' },
                  '& .MuiFormHelperText-root': { color: 'rgba(255,255,255,0.5)' }
                }}
              />
            </Grid>
          </Grid>
        </SectionCard>

        {/* Address Section */}
        <SectionCard elevation={0}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
            <LocationOnIcon sx={{ color: '#48CEDB' }} />
            <Typography variant="h6" sx={{ fontWeight: 600, color: 'white' }}>
              Address Information
            </Typography>
          </Box>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Street Address *"
                value={formData.address}
                onChange={handleInputChange('address')}
                disabled={!editing || loading}
                variant="outlined"
                required
                multiline
                rows={2}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    color: 'white',
                    '& fieldset': { borderColor: 'rgba(255,255,255,0.2)' },
                    '&:hover fieldset': { borderColor: 'rgba(72, 206, 219, 0.5)' },
                    '&.Mui-focused fieldset': { borderColor: '#48CEDB' },
                    '&.Mui-disabled': { opacity: 0.6 }
                  },
                  '& .MuiInputLabel-root': { color: 'rgba(255,255,255,0.7)' },
                  '& .MuiInputLabel-root.Mui-focused': { color: '#48CEDB' }
                }}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Town/City"
                value={formData.town}
                onChange={handleInputChange('town')}
                disabled={!editing || loading}
                variant="outlined"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    color: 'white',
                    '& fieldset': { borderColor: 'rgba(255,255,255,0.2)' },
                    '&:hover fieldset': { borderColor: 'rgba(72, 206, 219, 0.5)' },
                    '&.Mui-focused fieldset': { borderColor: '#48CEDB' },
                    '&.Mui-disabled': { opacity: 0.6 }
                  },
                  '& .MuiInputLabel-root': { color: 'rgba(255,255,255,0.7)' },
                  '& .MuiInputLabel-root.Mui-focused': { color: '#48CEDB' }
                }}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Postcode"
                value={formData.postcode}
                onChange={handleInputChange('postcode')}
                disabled={!editing || loading}
                variant="outlined"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    color: 'white',
                    '& fieldset': { borderColor: 'rgba(255,255,255,0.2)' },
                    '&:hover fieldset': { borderColor: 'rgba(72, 206, 219, 0.5)' },
                    '&.Mui-focused fieldset': { borderColor: '#48CEDB' },
                    '&.Mui-disabled': { opacity: 0.6 }
                  },
                  '& .MuiInputLabel-root': { color: 'rgba(255,255,255,0.7)' },
                  '& .MuiInputLabel-root.Mui-focused': { color: '#48CEDB' }
                }}
              />
            </Grid>
          </Grid>
        </SectionCard>

        {editing && (
          <Box sx={{ display: 'flex', gap: 2, mt: 4, justifyContent: 'flex-end' }}>
            <Button
              onClick={handleCancel}
              disabled={loading}
              variant="outlined"
              sx={{
                color: 'rgba(255,255,255,0.8)',
                borderColor: 'rgba(255,255,255,0.3)',
                '&:hover': {
                  borderColor: 'rgba(255,255,255,0.5)',
                  bgcolor: 'rgba(255,255,255,0.05)'
                }
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={loading}
              variant="contained"
              startIcon={loading ? <CircularProgress size={20} /> : <SaveIcon />}
              sx={{
                bgcolor: '#48CEDB',
                color: '#0f172a',
                fontWeight: 600,
                px: 4,
                '&:hover': {
                  bgcolor: '#3ab9c7'
                },
                '&:disabled': {
                  bgcolor: 'rgba(72, 206, 219, 0.3)'
                }
              }}
            >
              {loading ? 'Saving...' : 'Save Changes'}
            </Button>
          </Box>
        )}
      </CardContent>
    </ProfileCard>
  );
};

export default UserProfile;