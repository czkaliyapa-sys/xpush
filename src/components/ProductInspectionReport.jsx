import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Grid,
  Chip,
  Stack,
  LinearProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Avatar,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  ImageList,
  ImageListItem,
  Rating
} from '@mui/material';
import { styled } from '@mui/material/styles';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import WarningIcon from '@mui/icons-material/Warning';
import ErrorIcon from '@mui/icons-material/Error';
import BatteryFullIcon from '@mui/icons-material/BatteryFull';
import ScreenshotMonitorIcon from '@mui/icons-material/ScreenshotMonitor';
import CameraAltIcon from '@mui/icons-material/CameraAlt';
import VolumeUpIcon from '@mui/icons-material/VolumeUp';
import WifiIcon from '@mui/icons-material/Wifi';
import BluetoothIcon from '@mui/icons-material/Bluetooth';
import FingerprintIcon from '@mui/icons-material/Fingerprint';
import VerifiedIcon from '@mui/icons-material/Verified';
import PersonIcon from '@mui/icons-material/Person';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import ZoomInIcon from '@mui/icons-material/ZoomIn';

const InspectionCard = styled(Card)(({ theme }) => ({
  marginBottom: theme.spacing(2),
  borderRadius: theme.spacing(2),
  boxShadow: theme.shadows[2]
}));

const ScoreCircle = styled(Box)(({ theme, score }) => ({
  width: 80,
  height: 80,
  borderRadius: '50%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  backgroundColor: 
    score >= 90 ? theme.palette.success.main :
    score >= 75 ? theme.palette.warning.main :
    score >= 60 ? theme.palette.orange?.main || '#ff9800' :
    theme.palette.error.main,
  color: 'white',
  fontWeight: 'bold',
  fontSize: '1.5rem'
}));

const ProductInspectionReport = ({ productId, onClose }) => {
  const [selectedImage, setSelectedImage] = useState(null);
  const [imageDialogOpen, setImageDialogOpen] = useState(false);

  // Mock inspection data - in real app, this would come from API
  const inspectionData = {
    productId: productId || 'IP14PM-256-BLK-001',
    productName: 'iPhone 14 Pro Max 256GB - Space Black',
    inspectionDate: '2024-01-15',
    inspector: {
      name: 'Sarah Johnson',
      id: 'TECH-001',
      certification: 'Apple Certified Technician'
    },
    overallScore: 87,
    condition: 'Very Good',
    images: [
      'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=300&h=300&fit=crop',
      'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=300&h=300&fit=crop',
      'https://images.unsplash.com/photo-1580910051074-3eb694886505?w=300&h=300&fit=crop',
      'https://images.unsplash.com/photo-1556656793-08538906a9f8?w=300&h=300&fit=crop'
    ],
    categories: [
      {
        name: 'Physical Condition',
        score: 85,
        items: [
          { name: 'Screen', status: 'excellent', note: 'No scratches or cracks visible' },
          { name: 'Back Panel', status: 'good', note: 'Minor micro-scratches, not visible during normal use' },
          { name: 'Frame/Edges', status: 'excellent', note: 'No dents or damage' },
          { name: 'Buttons', status: 'excellent', note: 'All buttons responsive and tactile' },
          { name: 'Ports', status: 'excellent', note: 'Lightning port clean, no debris' }
        ]
      },
      {
        name: 'Functionality',
        score: 92,
        items: [
          { name: 'Display', status: 'excellent', note: 'Full brightness, no dead pixels, touch responsive' },
          { name: 'Camera System', status: 'excellent', note: 'All cameras working, autofocus functional' },
          { name: 'Face ID', status: 'excellent', note: 'Fast and accurate recognition' },
          { name: 'Speakers', status: 'excellent', note: 'Clear audio, no distortion' },
          { name: 'Microphone', status: 'excellent', note: 'Clear recording quality' }
        ]
      },
      {
        name: 'Battery Health',
        score: 84,
        items: [
          { name: 'Battery Capacity', status: 'good', note: '84% of original capacity remaining' },
          { name: 'Charging Speed', status: 'excellent', note: 'Fast charging working normally' },
          { name: 'Wireless Charging', status: 'excellent', note: 'MagSafe and Qi charging functional' }
        ]
      },
      {
        name: 'Connectivity',
        score: 95,
        items: [
          { name: 'WiFi', status: 'excellent', note: 'Strong signal reception' },
          { name: 'Bluetooth', status: 'excellent', note: 'Pairs quickly with devices' },
          { name: 'Cellular', status: 'excellent', note: 'All bands tested, strong signal' },
          { name: 'GPS', status: 'excellent', note: 'Quick location lock, accurate positioning' }
        ]
      }
    ],
    additionalNotes: [
      'Device has been factory reset and is ready for new owner',
      'Original packaging not included',
      'Device is unlocked and compatible with all carriers',
      'No liquid damage detected',
      'All original features and functions working as intended'
    ],
    warranty: {
      duration: '12 months',
      coverage: 'Full hardware warranty including battery replacement if capacity drops below 80%'
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'excellent':
        return <CheckCircleIcon color="success" />;
      case 'good':
        return <CheckCircleIcon color="warning" />;
      case 'fair':
        return <WarningIcon color="warning" />;
      case 'poor':
        return <ErrorIcon color="error" />;
      default:
        return <CheckCircleIcon color="success" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'excellent': return 'success';
      case 'good': return 'warning';
      case 'fair': return 'warning';
      case 'poor': return 'error';
      default: return 'success';
    }
  };

  const handleImageClick = (image) => {
    setSelectedImage(image);
    setImageDialogOpen(true);
  };

  return (
    <Box>
      {/* Header */}
      <Paper sx={{ p: 3, mb: 3, borderRadius: 2 }}>
        <Grid container spacing={3} alignItems="center">
          <Grid item xs={12} md={8}>
            <Typography variant="h4" gutterBottom fontWeight="bold">
              📋 Inspection Report
            </Typography>
            <Typography variant="h6" color="text.secondary" gutterBottom>
              {inspectionData.productName}
            </Typography>
            <Stack direction="row" spacing={2} alignItems="center">
              <Chip 
                icon={<CalendarTodayIcon />}
                label={`Inspected: ${inspectionData.inspectionDate}`}
                variant="outlined"
              />
              <Chip 
                icon={<PersonIcon />}
                label={inspectionData.inspector.name}
                variant="outlined"
              />
              <Chip 
                icon={<VerifiedIcon />}
                label={inspectionData.inspector.certification}
                color="primary"
                variant="outlined"
              />
            </Stack>
          </Grid>
          <Grid item xs={12} md={4} textAlign="center">
            <ScoreCircle score={inspectionData.overallScore}>
              {inspectionData.overallScore}/100
            </ScoreCircle>
            <Typography variant="h6" sx={{ mt: 1 }} fontWeight="bold">
              Overall Score
            </Typography>
            <Chip 
              label={inspectionData.condition}
              color={getStatusColor('good')}
              size="large"
              sx={{ mt: 1 }}
            />
          </Grid>
        </Grid>
      </Paper>

      {/* Inspection Images */}
      <InspectionCard>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            📸 Inspection Photos
          </Typography>
          <ImageList cols={4} gap={8}>
            {inspectionData.images.map((image, index) => (
              <ImageListItem key={index}>
                <img
                  src={image}
                  alt={`Inspection photo ${index + 1}`}
                  loading="lazy"
                  style={{ 
                    cursor: 'pointer',
                    borderRadius: 8,
                    transition: 'transform 0.2s'
                  }}
                  onClick={() => handleImageClick(image)}
                  onMouseOver={(e) => e.target.style.transform = 'scale(1.05)'}
                  onMouseOut={(e) => e.target.style.transform = 'scale(1)'}
                />
              </ImageListItem>
            ))}
          </ImageList>
        </CardContent>
      </InspectionCard>

      {/* Detailed Inspection Categories */}
      {inspectionData.categories.map((category, index) => (
        <Accordion key={index} defaultExpanded={index === 0}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Stack direction="row" spacing={2} alignItems="center" width="100%">
              <Typography variant="h6" fontWeight="bold">
                {category.name}
              </Typography>
              <Box sx={{ flexGrow: 1 }} />
              <Chip 
                label={`${category.score}/100`}
                color={getStatusColor(category.score >= 90 ? 'excellent' : category.score >= 75 ? 'good' : 'fair')}
                size="small"
              />
            </Stack>
          </AccordionSummary>
          <AccordionDetails>
            <Box sx={{ mb: 2 }}>
              <LinearProgress 
                variant="determinate" 
                value={category.score} 
                sx={{ height: 8, borderRadius: 4 }}
                color={category.score >= 90 ? 'success' : category.score >= 75 ? 'warning' : 'error'}
              />
            </Box>
            <List>
              {category.items.map((item, itemIndex) => (
                <ListItem key={itemIndex} divider={itemIndex < category.items.length - 1}>
                  <ListItemIcon>
                    {getStatusIcon(item.status)}
                  </ListItemIcon>
                  <ListItemText
                    primary={item.name}
                    secondary={item.note}
                    primaryTypographyProps={{ fontWeight: 'medium' }}
                  />
                  <Chip 
                    label={item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                    color={getStatusColor(item.status)}
                    size="small"
                    variant="outlined"
                  />
                </ListItem>
              ))}
            </List>
          </AccordionDetails>
        </Accordion>
      ))}

      {/* Additional Notes */}
      <InspectionCard>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            📝 Additional Notes
          </Typography>
          <List>
            {inspectionData.additionalNotes.map((note, index) => (
              <ListItem key={index}>
                <ListItemIcon>
                  <CheckCircleIcon color="primary" />
                </ListItemIcon>
                <ListItemText primary={note} />
              </ListItem>
            ))}
          </List>
        </CardContent>
      </InspectionCard>

      {/* Warranty Information */}
      <InspectionCard>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            🛡️ Warranty Coverage
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <Typography variant="body1" fontWeight="bold">
                Duration: {inspectionData.warranty.duration}
              </Typography>
            </Grid>
            <Grid item xs={12}>
              <Typography variant="body2" color="text.secondary">
                {inspectionData.warranty.coverage}
              </Typography>
            </Grid>
          </Grid>
        </CardContent>
      </InspectionCard>

      {/* Image Dialog */}
      <Dialog 
        open={imageDialogOpen} 
        onClose={() => setImageDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Stack direction="row" alignItems="center" spacing={1}>
            <ZoomInIcon />
            <Typography variant="h6">Inspection Photo</Typography>
          </Stack>
        </DialogTitle>
        <DialogContent>
          {selectedImage && (
            <img 
              src={selectedImage} 
              alt="Inspection detail" 
              style={{ width: '100%', height: 'auto', borderRadius: 8 }}
            />
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setImageDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Action Buttons */}
      <Box sx={{ mt: 3, textAlign: 'center' }}>
        <Stack direction="row" spacing={2} justifyContent="center">
          <Button 
            variant="outlined" 
            onClick={() => window.print()}
            size="large"
          >
            Print Report
          </Button>
          <Button 
            variant="contained" 
            onClick={onClose}
            size="large"
          >
            Close Report
          </Button>
        </Stack>
      </Box>
    </Box>
  );
};

export default ProductInspectionReport;