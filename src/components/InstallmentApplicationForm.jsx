import React, { useState, useRef } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  Stepper,
  Step,
  StepLabel,
  Paper,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Alert,
  CircularProgress,
  Divider,
  IconButton,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction,
  LinearProgress,
  Card,
  CardContent
} from '@mui/material';
import { styled } from '@mui/material/styles';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import DeleteIcon from '@mui/icons-material/Delete';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import PersonIcon from '@mui/icons-material/Person';
import WorkIcon from '@mui/icons-material/Work';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';
import DescriptionIcon from '@mui/icons-material/Description';
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera';
import BadgeIcon from '@mui/icons-material/Badge';
import HomeIcon from '@mui/icons-material/Home';
import { installmentsAPI } from '../services/api';

const VisuallyHiddenInput = styled('input')({
  clip: 'rect(0 0 0 0)',
  clipPath: 'inset(50%)',
  height: 1,
  overflow: 'hidden',
  position: 'absolute',
  bottom: 0,
  left: 0,
  whiteSpace: 'nowrap',
  width: 1,
});

const GlassCard = styled(Paper)(({ theme }) => ({
  background: 'rgba(255, 255, 255, 0.05)',
  backdropFilter: 'blur(10px)',
  borderRadius: 16,
  border: '1px solid rgba(255, 255, 255, 0.1)',
  padding: theme.spacing(3),
}));

const InstallmentApplicationForm = ({ 
  gadget, 
  variant, 
  installmentPlan, 
  user, 
  onSubmit, 
  onCancel,
  formatPrice 
}) => {
  const [activeStep, setActiveStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [applicationRef, setApplicationRef] = useState('');
  const fileInputRef = useRef(null);

  // Personal Information
  const [personalInfo, setPersonalInfo] = useState({
    fullName: user?.displayName || user?.fullName || '',
    email: user?.email || '',
    phone: user?.phone || '',
    dateOfBirth: '',
    nationalId: '',
    address: user?.address || '',
    town: user?.town || '',
    postcode: user?.postcode || '',
    country: 'Malawi'
  });

  // Employment Information
  const [employmentInfo, setEmploymentInfo] = useState({
    employmentStatus: '',
    employerName: '',
    jobTitle: '',
    monthlyIncome: '',
    employmentDuration: '',
    employerPhone: '',
    employerAddress: ''
  });

  // Documents
  const [documents, setDocuments] = useState({
    nationalIdFront: null,
    nationalIdBack: null,
    proofOfAddress: null,
    proofOfIncome: null,
    selfie: null
  });

  const [uploadProgress, setUploadProgress] = useState({});

  const steps = [
    { label: 'Personal Info', icon: <PersonIcon /> },
    { label: 'Employment', icon: <WorkIcon /> },
    { label: 'Documents', icon: <AttachFileIcon /> },
    { label: 'Review', icon: <VerifiedUserIcon /> }
  ];

  const employmentOptions = [
    'Full-time Employed',
    'Part-time Employed',
    'Self-employed',
    'Business Owner',
    'Contract Worker',
    'Government Employee',
    'Retired',
    'Student',
    'Other'
  ];

  const incomeRanges = [
    'Below MWK 100,000',
    'MWK 100,000 - 250,000',
    'MWK 250,000 - 500,000',
    'MWK 500,000 - 1,000,000',
    'MWK 1,000,000 - 2,000,000',
    'Above MWK 2,000,000'
  ];

  const requiredDocuments = [
    { key: 'nationalIdFront', label: 'National ID (Front)', icon: <BadgeIcon />, required: true },
    { key: 'nationalIdBack', label: 'National ID (Back)', icon: <BadgeIcon />, required: true },
    { key: 'proofOfAddress', label: 'Proof of Address', icon: <HomeIcon />, required: true, hint: 'Utility bill, bank statement, or lease agreement' },
    { key: 'proofOfIncome', label: 'Proof of Income', icon: <DescriptionIcon />, required: true, hint: 'Pay slip, bank statement, or business registration' },
    { key: 'selfie', label: 'Selfie with ID', icon: <PhotoCameraIcon />, required: true, hint: 'Clear photo of you holding your ID' }
  ];

  const handleFileUpload = (key, event) => {
    const file = event.target.files[0];
    if (file) {
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setSubmitError('File size must be less than 5MB');
        return;
      }
      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
      if (!allowedTypes.includes(file.type)) {
        setSubmitError('Only JPG, PNG, WebP, and PDF files are allowed');
        return;
      }
      
      // Simulate upload progress
      setUploadProgress(prev => ({ ...prev, [key]: 0 }));
      const interval = setInterval(() => {
        setUploadProgress(prev => {
          const newProgress = (prev[key] || 0) + 20;
          if (newProgress >= 100) {
            clearInterval(interval);
            return { ...prev, [key]: 100 };
          }
          return { ...prev, [key]: newProgress };
        });
      }, 200);

      // Store file
      setDocuments(prev => ({ ...prev, [key]: file }));
      setSubmitError('');
    }
  };

  const handleRemoveFile = (key) => {
    setDocuments(prev => ({ ...prev, [key]: null }));
    setUploadProgress(prev => ({ ...prev, [key]: 0 }));
  };

  const validateStep = (step) => {
    switch (step) {
      case 0: // Personal Info
        return personalInfo.fullName && personalInfo.email && personalInfo.phone && 
               personalInfo.dateOfBirth && personalInfo.nationalId && personalInfo.address;
      case 1: // Employment
        return employmentInfo.employmentStatus && employmentInfo.monthlyIncome;
      case 2: // Documents
        return documents.nationalIdFront && documents.nationalIdBack && 
               documents.proofOfAddress && documents.proofOfIncome && documents.selfie;
      case 3: // Review
        return true;
      default:
        return false;
    }
  };

  const handleNext = () => {
    if (validateStep(activeStep)) {
      setActiveStep(prev => prev + 1);
      setSubmitError('');
    } else {
      setSubmitError('Please fill in all required fields');
    }
  };

  const handleBack = () => {
    setActiveStep(prev => prev - 1);
    setSubmitError('');
  };

  const handleSubmitApplication = async () => {
    setIsSubmitting(true);
    setSubmitError('');

    try {
      // Create FormData for file uploads
      const formData = new FormData();
      
      // Add application data
      const applicationData = {
        gadgetId: gadget?.id,
        gadgetName: gadget?.name,
        variantId: variant?.id,
        variantDetails: {
          storage: variant?.storage,
          color: variant?.color,
          condition: variant?.condition
        },
        installmentPlan: {
          type: installmentPlan?.type,
          weeks: installmentPlan?.weeks,
          depositAmount: installmentPlan?.depositAmount,
          weeklyAmount: installmentPlan?.weeklyAmount,
          totalAmount: installmentPlan?.totalAmount
        },
        personalInfo,
        employmentInfo,
        userUid: user?.uid
      };

      formData.append('applicationData', JSON.stringify(applicationData));

      // Add documents
      Object.entries(documents).forEach(([key, file]) => {
        if (file) {
          formData.append(key, file);
        }
      });

      const response = await installmentsAPI.submitApplication(formData);

      if (response.success) {
        setSubmitSuccess(true);
        setApplicationRef(response.reference || 'APP-' + Date.now());
        if (onSubmit) {
          onSubmit(response);
        }
      } else {
        setSubmitError(response.error || 'Failed to submit application');
      }
    } catch (error) {
      console.error('Application submission error:', error);
      setSubmitError(error.message || 'An error occurred while submitting your application');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitSuccess) {
    return (
      <Box sx={{ 
        textAlign: 'center', 
        py: 6, 
        px: 3,
        background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.98) 0%, rgba(30, 41, 59, 0.98) 100%)',
        borderRadius: 4,
        minHeight: '60vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <CheckCircleIcon sx={{ fontSize: 100, color: '#4CAF50', mb: 3 }} />
        <Typography variant="h4" sx={{ color: '#4CAF50', fontWeight: 700, mb: 2 }}>
          Application Submitted!
        </Typography>
        <Typography variant="h6" sx={{ color: 'white', mb: 3 }}>
          Reference: <strong>{applicationRef}</strong>
        </Typography>
        
        <GlassCard sx={{ maxWidth: 500, mb: 4 }}>
          <Typography variant="body1" sx={{ color: 'rgba(255,255,255,0.9)', mb: 2 }}>
            Your installment application has been received and is now under review.
          </Typography>
          <Divider sx={{ my: 2, borderColor: 'rgba(255,255,255,0.1)' }} />
          <Box sx={{ textAlign: 'left' }}>
            <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)', mb: 1 }}>
              📧 Confirmation email sent to <strong style={{ color: '#48CEDB' }}>{personalInfo.email}</strong>
            </Typography>
            <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)', mb: 1 }}>
              ⏱️ Expected review time: <strong style={{ color: '#48CEDB' }}>24-48 hours</strong>
            </Typography>
            <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)' }}>
              📱 You'll receive SMS updates at <strong style={{ color: '#48CEDB' }}>{personalInfo.phone}</strong>
            </Typography>
          </Box>
        </GlassCard>

        <Alert severity="info" sx={{ maxWidth: 500, mb: 3 }}>
          You can track your application status in your Dashboard under "My Applications"
        </Alert>

        <Button
          variant="contained"
          onClick={onCancel}
          sx={{ 
            bgcolor: '#48CEDB', 
            color: '#0f172a',
            px: 4,
            py: 1.5,
            fontWeight: 600,
            '&:hover': { bgcolor: '#3ab9c7' }
          }}
        >
          Go to Dashboard
        </Button>
      </Box>
    );
  }

  const renderPersonalInfoStep = () => (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <Typography variant="h6" sx={{ color: '#48CEDB', mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
          <PersonIcon /> Personal Information
        </Typography>
      </Grid>
      <Grid item xs={12} md={6}>
        <TextField
          fullWidth
          label="Full Name (as on ID)"
          value={personalInfo.fullName}
          onChange={(e) => setPersonalInfo(prev => ({ ...prev, fullName: e.target.value }))}
          required
          variant="outlined"
          sx={{ '& .MuiOutlinedInput-root': { color: 'white', '& fieldset': { borderColor: 'rgba(255,255,255,0.3)' } } }}
          InputLabelProps={{ sx: { color: 'rgba(255,255,255,0.7)' } }}
        />
      </Grid>
      <Grid item xs={12} md={6}>
        <TextField
          fullWidth
          label="Email Address"
          type="email"
          value={personalInfo.email}
          onChange={(e) => setPersonalInfo(prev => ({ ...prev, email: e.target.value }))}
          required
          variant="outlined"
          sx={{ '& .MuiOutlinedInput-root': { color: 'white', '& fieldset': { borderColor: 'rgba(255,255,255,0.3)' } } }}
          InputLabelProps={{ sx: { color: 'rgba(255,255,255,0.7)' } }}
        />
      </Grid>
      <Grid item xs={12} md={6}>
        <TextField
          fullWidth
          label="Phone Number"
          value={personalInfo.phone}
          onChange={(e) => setPersonalInfo(prev => ({ ...prev, phone: e.target.value }))}
          required
          placeholder="+265..."
          variant="outlined"
          sx={{ '& .MuiOutlinedInput-root': { color: 'white', '& fieldset': { borderColor: 'rgba(255,255,255,0.3)' } } }}
          InputLabelProps={{ sx: { color: 'rgba(255,255,255,0.7)' } }}
        />
      </Grid>
      <Grid item xs={12} md={6}>
        <TextField
          fullWidth
          label="Date of Birth"
          type="date"
          value={personalInfo.dateOfBirth}
          onChange={(e) => setPersonalInfo(prev => ({ ...prev, dateOfBirth: e.target.value }))}
          required
          InputLabelProps={{ shrink: true, sx: { color: 'rgba(255,255,255,0.7)' } }}
          sx={{ '& .MuiOutlinedInput-root': { color: 'white', '& fieldset': { borderColor: 'rgba(255,255,255,0.3)' } } }}
        />
      </Grid>
      <Grid item xs={12} md={6}>
        <TextField
          fullWidth
          label="National ID Number"
          value={personalInfo.nationalId}
          onChange={(e) => setPersonalInfo(prev => ({ ...prev, nationalId: e.target.value }))}
          required
          variant="outlined"
          sx={{ '& .MuiOutlinedInput-root': { color: 'white', '& fieldset': { borderColor: 'rgba(255,255,255,0.3)' } } }}
          InputLabelProps={{ sx: { color: 'rgba(255,255,255,0.7)' } }}
        />
      </Grid>
      <Grid item xs={12} md={6}>
        <FormControl fullWidth>
          <InputLabel sx={{ color: 'rgba(255,255,255,0.7)' }}>Country</InputLabel>
          <Select
            value={personalInfo.country}
            onChange={(e) => setPersonalInfo(prev => ({ ...prev, country: e.target.value }))}
            label="Country"
            sx={{ color: 'white', '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.3)' } }}
          >
            <MenuItem value="Malawi">Malawi</MenuItem>
            <MenuItem value="United Kingdom">United Kingdom</MenuItem>
            <MenuItem value="Other">Other</MenuItem>
          </Select>
        </FormControl>
      </Grid>
      <Grid item xs={12}>
        <TextField
          fullWidth
          label="Residential Address"
          value={personalInfo.address}
          onChange={(e) => setPersonalInfo(prev => ({ ...prev, address: e.target.value }))}
          required
          multiline
          rows={2}
          variant="outlined"
          sx={{ '& .MuiOutlinedInput-root': { color: 'white', '& fieldset': { borderColor: 'rgba(255,255,255,0.3)' } } }}
          InputLabelProps={{ sx: { color: 'rgba(255,255,255,0.7)' } }}
        />
      </Grid>
      <Grid item xs={12} md={6}>
        <TextField
          fullWidth
          label="Town/City"
          value={personalInfo.town}
          onChange={(e) => setPersonalInfo(prev => ({ ...prev, town: e.target.value }))}
          variant="outlined"
          sx={{ '& .MuiOutlinedInput-root': { color: 'white', '& fieldset': { borderColor: 'rgba(255,255,255,0.3)' } } }}
          InputLabelProps={{ sx: { color: 'rgba(255,255,255,0.7)' } }}
        />
      </Grid>
      <Grid item xs={12} md={6}>
        <TextField
          fullWidth
          label="Postcode"
          value={personalInfo.postcode}
          onChange={(e) => setPersonalInfo(prev => ({ ...prev, postcode: e.target.value }))}
          variant="outlined"
          sx={{ '& .MuiOutlinedInput-root': { color: 'white', '& fieldset': { borderColor: 'rgba(255,255,255,0.3)' } } }}
          InputLabelProps={{ sx: { color: 'rgba(255,255,255,0.7)' } }}
        />
      </Grid>
    </Grid>
  );

  const renderEmploymentStep = () => (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <Typography variant="h6" sx={{ color: '#48CEDB', mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
          <WorkIcon /> Employment & Income
        </Typography>
      </Grid>
      <Grid item xs={12} md={6}>
        <FormControl fullWidth required>
          <InputLabel sx={{ color: 'rgba(255,255,255,0.7)' }}>Employment Status</InputLabel>
          <Select
            value={employmentInfo.employmentStatus}
            onChange={(e) => setEmploymentInfo(prev => ({ ...prev, employmentStatus: e.target.value }))}
            label="Employment Status"
            sx={{ color: 'white', '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.3)' } }}
          >
            {employmentOptions.map(option => (
              <MenuItem key={option} value={option}>{option}</MenuItem>
            ))}
          </Select>
        </FormControl>
      </Grid>
      <Grid item xs={12} md={6}>
        <FormControl fullWidth required>
          <InputLabel sx={{ color: 'rgba(255,255,255,0.7)' }}>Monthly Income Range</InputLabel>
          <Select
            value={employmentInfo.monthlyIncome}
            onChange={(e) => setEmploymentInfo(prev => ({ ...prev, monthlyIncome: e.target.value }))}
            label="Monthly Income Range"
            sx={{ color: 'white', '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.3)' } }}
          >
            {incomeRanges.map(range => (
              <MenuItem key={range} value={range}>{range}</MenuItem>
            ))}
          </Select>
        </FormControl>
      </Grid>
      
      {['Full-time Employed', 'Part-time Employed', 'Government Employee', 'Contract Worker'].includes(employmentInfo.employmentStatus) && (
        <>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Employer Name"
              value={employmentInfo.employerName}
              onChange={(e) => setEmploymentInfo(prev => ({ ...prev, employerName: e.target.value }))}
              variant="outlined"
              sx={{ '& .MuiOutlinedInput-root': { color: 'white', '& fieldset': { borderColor: 'rgba(255,255,255,0.3)' } } }}
              InputLabelProps={{ sx: { color: 'rgba(255,255,255,0.7)' } }}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Job Title"
              value={employmentInfo.jobTitle}
              onChange={(e) => setEmploymentInfo(prev => ({ ...prev, jobTitle: e.target.value }))}
              variant="outlined"
              sx={{ '& .MuiOutlinedInput-root': { color: 'white', '& fieldset': { borderColor: 'rgba(255,255,255,0.3)' } } }}
              InputLabelProps={{ sx: { color: 'rgba(255,255,255,0.7)' } }}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Employment Duration"
              placeholder="e.g., 2 years"
              value={employmentInfo.employmentDuration}
              onChange={(e) => setEmploymentInfo(prev => ({ ...prev, employmentDuration: e.target.value }))}
              variant="outlined"
              sx={{ '& .MuiOutlinedInput-root': { color: 'white', '& fieldset': { borderColor: 'rgba(255,255,255,0.3)' } } }}
              InputLabelProps={{ sx: { color: 'rgba(255,255,255,0.7)' } }}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Employer Phone"
              value={employmentInfo.employerPhone}
              onChange={(e) => setEmploymentInfo(prev => ({ ...prev, employerPhone: e.target.value }))}
              variant="outlined"
              sx={{ '& .MuiOutlinedInput-root': { color: 'white', '& fieldset': { borderColor: 'rgba(255,255,255,0.3)' } } }}
              InputLabelProps={{ sx: { color: 'rgba(255,255,255,0.7)' } }}
            />
          </Grid>
        </>
      )}

      {['Self-employed', 'Business Owner'].includes(employmentInfo.employmentStatus) && (
        <Grid item xs={12}>
          <Alert severity="info" sx={{ bgcolor: 'rgba(72, 206, 219, 0.1)', color: 'white' }}>
            As a self-employed individual or business owner, please provide your business registration documents in the next step.
          </Alert>
        </Grid>
      )}
    </Grid>
  );

  const renderDocumentsStep = () => (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <Typography variant="h6" sx={{ color: '#48CEDB', mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
          <AttachFileIcon /> Required Documents
        </Typography>
        <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)', mb: 3 }}>
          Upload clear photos or scans of the following documents. Max file size: 5MB per document.
        </Typography>
      </Grid>

      {requiredDocuments.map(doc => (
        <Grid item xs={12} md={6} key={doc.key}>
          <Card sx={{ 
            bgcolor: documents[doc.key] ? 'rgba(76, 175, 80, 0.1)' : 'rgba(255,255,255,0.05)',
            border: documents[doc.key] ? '1px solid rgba(76, 175, 80, 0.3)' : '1px solid rgba(255,255,255,0.1)',
            borderRadius: 2
          }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                <Box sx={{ color: documents[doc.key] ? '#4CAF50' : '#48CEDB' }}>
                  {doc.icon}
                </Box>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="subtitle2" sx={{ color: 'white', fontWeight: 600 }}>
                    {doc.label} {doc.required && <span style={{ color: '#f44336' }}>*</span>}
                  </Typography>
                  {doc.hint && (
                    <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)' }}>
                      {doc.hint}
                    </Typography>
                  )}
                </Box>
                {documents[doc.key] && (
                  <CheckCircleIcon sx={{ color: '#4CAF50' }} />
                )}
              </Box>

              {documents[doc.key] ? (
                <Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2" sx={{ color: '#4CAF50', fontSize: '0.8rem' }}>
                      ✓ {documents[doc.key].name}
                    </Typography>
                    <IconButton size="small" onClick={() => handleRemoveFile(doc.key)} sx={{ color: '#f44336' }}>
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Box>
                  {uploadProgress[doc.key] < 100 && (
                    <LinearProgress 
                      variant="determinate" 
                      value={uploadProgress[doc.key] || 0} 
                      sx={{ height: 4, borderRadius: 2 }}
                    />
                  )}
                </Box>
              ) : (
                <Button
                  component="label"
                  variant="outlined"
                  fullWidth
                  startIcon={<CloudUploadIcon />}
                  sx={{ 
                    borderColor: 'rgba(255,255,255,0.3)', 
                    color: 'rgba(255,255,255,0.7)',
                    '&:hover': { borderColor: '#48CEDB', color: '#48CEDB' }
                  }}
                >
                  Upload
                  <VisuallyHiddenInput 
                    type="file" 
                    accept="image/*,.pdf"
                    onChange={(e) => handleFileUpload(doc.key, e)} 
                  />
                </Button>
              )}
            </CardContent>
          </Card>
        </Grid>
      ))}

      <Grid item xs={12}>
        <Alert severity="warning" sx={{ bgcolor: 'rgba(255, 152, 0, 0.1)', color: 'white' }}>
          <strong>Important:</strong> All documents must be clear and legible. Blurry or incomplete documents may delay your application.
        </Alert>
      </Grid>
    </Grid>
  );

  const renderReviewStep = () => (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <Typography variant="h6" sx={{ color: '#48CEDB', mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
          <VerifiedUserIcon /> Review Your Application
        </Typography>
      </Grid>

      {/* Gadget Summary */}
      <Grid item xs={12}>
        <GlassCard>
          <Typography variant="subtitle1" sx={{ color: '#48CEDB', fontWeight: 600, mb: 2 }}>
            📱 Product Details
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={6}>
              <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)' }}>Product</Typography>
              <Typography variant="body1" sx={{ color: 'white', fontWeight: 500 }}>{gadget?.name}</Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)' }}>Variant</Typography>
              <Typography variant="body1" sx={{ color: 'white', fontWeight: 500 }}>
                {variant?.storage} {variant?.color && `• ${variant.color}`} {variant?.condition && `• ${variant.condition}`}
              </Typography>
            </Grid>
          </Grid>
        </GlassCard>
      </Grid>

      {/* Installment Plan Summary */}
      <Grid item xs={12}>
        <GlassCard>
          <Typography variant="subtitle1" sx={{ color: '#48CEDB', fontWeight: 600, mb: 2 }}>
            💰 Payment Plan
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={4}>
              <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)' }}>Duration</Typography>
              <Typography variant="body1" sx={{ color: 'white', fontWeight: 500 }}>{installmentPlan?.weeks} weeks</Typography>
            </Grid>
            <Grid item xs={4}>
              <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)' }}>Deposit</Typography>
              <Typography variant="body1" sx={{ color: '#4CAF50', fontWeight: 600 }}>
                {formatPrice ? formatPrice(installmentPlan?.depositAmount) : `£${installmentPlan?.depositAmount}`}
              </Typography>
            </Grid>
            <Grid item xs={4}>
              <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)' }}>Weekly</Typography>
              <Typography variant="body1" sx={{ color: '#48CEDB', fontWeight: 600 }}>
                {formatPrice ? formatPrice(installmentPlan?.weeklyAmount) : `£${installmentPlan?.weeklyAmount}`}
              </Typography>
            </Grid>
          </Grid>
        </GlassCard>
      </Grid>

      {/* Personal Info Summary */}
      <Grid item xs={12} md={6}>
        <GlassCard>
          <Typography variant="subtitle1" sx={{ color: '#48CEDB', fontWeight: 600, mb: 2 }}>
            👤 Personal Information
          </Typography>
          <List dense>
            <ListItem sx={{ px: 0 }}>
              <ListItemText 
                primary={personalInfo.fullName} 
                secondary="Full Name"
                primaryTypographyProps={{ color: 'white' }}
                secondaryTypographyProps={{ color: 'rgba(255,255,255,0.5)' }}
              />
            </ListItem>
            <ListItem sx={{ px: 0 }}>
              <ListItemText 
                primary={personalInfo.email} 
                secondary="Email"
                primaryTypographyProps={{ color: 'white' }}
                secondaryTypographyProps={{ color: 'rgba(255,255,255,0.5)' }}
              />
            </ListItem>
            <ListItem sx={{ px: 0 }}>
              <ListItemText 
                primary={personalInfo.phone} 
                secondary="Phone"
                primaryTypographyProps={{ color: 'white' }}
                secondaryTypographyProps={{ color: 'rgba(255,255,255,0.5)' }}
              />
            </ListItem>
            <ListItem sx={{ px: 0 }}>
              <ListItemText 
                primary={`${personalInfo.address}, ${personalInfo.town}`} 
                secondary="Address"
                primaryTypographyProps={{ color: 'white' }}
                secondaryTypographyProps={{ color: 'rgba(255,255,255,0.5)' }}
              />
            </ListItem>
          </List>
        </GlassCard>
      </Grid>

      {/* Employment Summary */}
      <Grid item xs={12} md={6}>
        <GlassCard>
          <Typography variant="subtitle1" sx={{ color: '#48CEDB', fontWeight: 600, mb: 2 }}>
            💼 Employment Details
          </Typography>
          <List dense>
            <ListItem sx={{ px: 0 }}>
              <ListItemText 
                primary={employmentInfo.employmentStatus} 
                secondary="Employment Status"
                primaryTypographyProps={{ color: 'white' }}
                secondaryTypographyProps={{ color: 'rgba(255,255,255,0.5)' }}
              />
            </ListItem>
            <ListItem sx={{ px: 0 }}>
              <ListItemText 
                primary={employmentInfo.monthlyIncome} 
                secondary="Monthly Income"
                primaryTypographyProps={{ color: 'white' }}
                secondaryTypographyProps={{ color: 'rgba(255,255,255,0.5)' }}
              />
            </ListItem>
            {employmentInfo.employerName && (
              <ListItem sx={{ px: 0 }}>
                <ListItemText 
                  primary={employmentInfo.employerName} 
                  secondary="Employer"
                  primaryTypographyProps={{ color: 'white' }}
                  secondaryTypographyProps={{ color: 'rgba(255,255,255,0.5)' }}
                />
              </ListItem>
            )}
          </List>
        </GlassCard>
      </Grid>

      {/* Documents Summary */}
      <Grid item xs={12}>
        <GlassCard>
          <Typography variant="subtitle1" sx={{ color: '#48CEDB', fontWeight: 600, mb: 2 }}>
            📎 Uploaded Documents
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {Object.entries(documents).map(([key, file]) => file && (
              <Chip
                key={key}
                icon={<CheckCircleIcon sx={{ color: '#4CAF50 !important' }} />}
                label={requiredDocuments.find(d => d.key === key)?.label}
                sx={{ bgcolor: 'rgba(76, 175, 80, 0.1)', color: 'white', border: '1px solid rgba(76, 175, 80, 0.3)' }}
              />
            ))}
          </Box>
        </GlassCard>
      </Grid>

      <Grid item xs={12}>
        <Alert severity="info" sx={{ bgcolor: 'rgba(72, 206, 219, 0.1)', color: 'white' }}>
          By submitting this application, you agree to our Terms & Conditions and authorize us to verify the information provided.
        </Alert>
      </Grid>
    </Grid>
  );

  const renderStepContent = (step) => {
    switch (step) {
      case 0: return renderPersonalInfoStep();
      case 1: return renderEmploymentStep();
      case 2: return renderDocumentsStep();
      case 3: return renderReviewStep();
      default: return null;
    }
  };

  return (
    <Box sx={{ 
      bgcolor: 'rgba(15, 23, 42, 0.98)', 
      minHeight: '100vh', 
      p: { xs: 2, md: 4 },
      color: 'white'
    }}>
      <Box sx={{ maxWidth: 900, mx: 'auto' }}>
        {/* Header */}
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <Typography variant="h4" sx={{ color: '#48CEDB', fontWeight: 700, mb: 1 }}>
            Installment Application
          </Typography>
          <Typography variant="body1" sx={{ color: 'rgba(255,255,255,0.7)' }}>
            Complete your application for {gadget?.name}
          </Typography>
        </Box>

        {/* Verification Info */}
        <Alert 
          severity="info" 
          icon={<VerifiedUserIcon />}
          sx={{ 
            mb: 4, 
            bgcolor: 'rgba(72, 206, 219, 0.1)', 
            color: 'white',
            border: '1px solid rgba(72, 206, 219, 0.3)',
            '& .MuiAlert-icon': { color: '#48CEDB' }
          }}
        >
          <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
            📋 Application Verification Process
          </Typography>
          <Typography variant="body2" sx={{ mb: 1 }}>
            • Your application will be reviewed within <strong>24-48 hours</strong>
          </Typography>
          <Typography variant="body2" sx={{ mb: 1 }}>
            • You'll receive email and SMS updates at each stage
          </Typography>
          <Typography variant="body2" sx={{ mb: 1 }}>
            • Required documents: National ID (both sides), Proof of Address, Proof of Income, Selfie with ID
          </Typography>
          <Typography variant="body2">
            • Track your application status anytime from your Dashboard
          </Typography>
        </Alert>

        {/* Stepper */}
        <Stepper activeStep={activeStep} alternativeLabel sx={{ mb: 4 }}>
          {steps.map((step, index) => (
            <Step key={step.label}>
              <StepLabel 
                StepIconProps={{
                  sx: { 
                    color: index <= activeStep ? '#48CEDB' : 'rgba(255,255,255,0.3)',
                    '&.Mui-completed': { color: '#4CAF50' },
                    '&.Mui-active': { color: '#48CEDB' }
                  }
                }}
              >
                <Typography sx={{ color: index <= activeStep ? 'white' : 'rgba(255,255,255,0.5)' }}>
                  {step.label}
                </Typography>
              </StepLabel>
            </Step>
          ))}
        </Stepper>

        {/* Error Alert */}
        {submitError && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setSubmitError('')}>
            {submitError}
          </Alert>
        )}

        {/* Step Content */}
        <GlassCard sx={{ mb: 4 }}>
          {renderStepContent(activeStep)}
        </GlassCard>

        {/* Navigation Buttons */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2 }}>
          <Button
            variant="outlined"
            onClick={activeStep === 0 ? onCancel : handleBack}
            sx={{ 
              color: 'rgba(255,255,255,0.7)', 
              borderColor: 'rgba(255,255,255,0.3)',
              '&:hover': { borderColor: '#48CEDB', color: '#48CEDB' }
            }}
          >
            {activeStep === 0 ? 'Cancel' : 'Back'}
          </Button>

          {activeStep === steps.length - 1 ? (
            <Button
              variant="contained"
              onClick={handleSubmitApplication}
              disabled={isSubmitting}
              sx={{ 
                bgcolor: '#4CAF50', 
                px: 4,
                '&:hover': { bgcolor: '#43A047' },
                '&:disabled': { bgcolor: 'rgba(76, 175, 80, 0.3)' }
              }}
            >
              {isSubmitting ? (
                <>
                  <CircularProgress size={20} sx={{ mr: 1, color: 'white' }} />
                  Submitting...
                </>
              ) : (
                'Submit Application'
              )}
            </Button>
          ) : (
            <Button
              variant="contained"
              onClick={handleNext}
              sx={{ 
                bgcolor: '#48CEDB', 
                color: '#0f172a',
                px: 4,
                '&:hover': { bgcolor: '#3ab9c7' }
              }}
            >
              Continue
            </Button>
          )}
        </Box>
      </Box>
    </Box>
  );
};

export default InstallmentApplicationForm;
