import React, { useState, useEffect } from 'react';
import { Box, Typography, LinearProgress, CircularProgress, Button } from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

const VerificationEligibilityScreen = ({ onComplete, onCancel, userAuthenticated = false }) => {
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [showCompletion, setShowCompletion] = useState(false);
  const [competitiveFeatures] = useState([
    { icon: '🔒', title: 'Bank-Level Security', desc: 'Military-grade encryption protecting your data' },
    { icon: '⚡', title: 'Lightning Fast', desc: 'Instant verification in under 60 seconds' },
    { icon: '🏆', title: 'Industry Leading', desc: 'Top-rated verification system trusted by millions' },
    { icon: '🛡️', title: 'Zero Risk Guarantee', desc: 'Full protection on all transactions' }
  ]);

  const steps = [
    { name: 'Identity Verification', description: 'Verifying your identity' },
    { name: 'Financial Eligibility', description: 'Checking your eligibility' },
    { name: 'Credit Assessment', description: 'Assessing creditworthiness' },
    { name: 'Risk Analysis', description: 'Advanced fraud detection' },
    { name: 'Final Review', description: 'Final review and approval' }
  ];

  // Move useEffect before any early returns to comply with React hooks rules
  useEffect(() => {
    // Only run the verification progress when user is authenticated
    if (!userAuthenticated) return;

    const interval = setInterval(() => {
      setProgress(prev => {
        const newProgress = prev + 1;
        if (newProgress >= 100) {
          clearInterval(interval);
          setIsComplete(true);
          setTimeout(() => {
            setShowCompletion(true);
          }, 800);
          return 100;
        }
        return newProgress;
      });

      // Update current step based on progress (20% per step for 5 steps)
      const stepIndex = Math.min(Math.floor((progress + 5) / 20), steps.length - 1);
      if (stepIndex !== currentStep) {
        setCurrentStep(stepIndex);
      }
    }, 60);

    return () => clearInterval(interval);
  }, [userAuthenticated, progress, currentStep, steps.length]);

  // Check if user is authenticated - early return after hooks
  if (!userAuthenticated) {
    return (
      <Box 
        sx={{ 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center', 
          justifyContent: 'center', 
          minHeight: '100vh', 
          width: '100%',
          p: 3,
          textAlign: 'center',
          bgcolor: 'rgba(15, 23, 42, 0.95)'
        }}
      >
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" sx={{ color: '#48CEDB', mb: 2, fontWeight: 700, fontSize: { xs: '1.8rem', sm: '2.5rem' } }}>
            🔐 Secure Verification Required
          </Typography>
          <Typography variant="h6" sx={{ color: 'white', mb: 1, fontWeight: 600 }}>
            Authentication Needed
          </Typography>
        </Box>
        
        <Typography variant="body1" sx={{ color: 'rgba(255,255,255,0.85)', mb: 4, maxWidth: '600px', lineHeight: 1.6 }}>
          To protect your account and ensure the highest level of security, we require you to sign in before proceeding with your installment application.
        </Typography>
        
        <Box sx={{ 
          display: 'grid', 
          gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)' }, 
          gap: 2, 
          mb: 4,
          width: '100%',
          maxWidth: '600px'
        }}>
          {competitiveFeatures.slice(0, 2).map((feature, index) => (
            <Box 
              key={index}
              sx={{ 
                p: 2, 
                bgcolor: 'rgba(72, 206, 219, 0.1)', 
                borderRadius: 2, 
                border: '1px solid rgba(72, 206, 219, 0.2)' 
              }}
            >
              <Typography variant="h5" sx={{ mb: 1 }}>{feature.icon}</Typography>
              <Typography variant="subtitle2" sx={{ color: '#48CEDB', fontWeight: 600, mb: 0.5 }}>
                {feature.title}
              </Typography>
              <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)' }}>
                {feature.desc}
              </Typography>
            </Box>
          ))}
        </Box>
        
        <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
          <Button
            variant="outlined"
            onClick={onCancel}
            sx={{ 
              color: '#48CEDB', 
              borderColor: '#48CEDB',
              '&:hover': { bgcolor: 'rgba(72, 206, 219, 0.1)', borderColor: '#48CEDB' }
            }}
          >
            Back to Shopping
          </Button>
          <Button
            variant="contained"
            onClick={onCancel}
            sx={{ 
              bgcolor: '#48CEDB', 
              color: '#0f172a',
              '&:hover': { bgcolor: '#3ab9c7' }
            }}
          >
            Sign In Now
          </Button>
        </Box>
      </Box>
    );
  }

  if (showCompletion) {
    return (
      <Box 
        sx={{ 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center', 
          justifyContent: 'center', 
          minHeight: '100vh', 
          width: '100%',
          p: { xs: 2, sm: 4 },
          textAlign: 'center',
          bgcolor: 'rgba(15, 23, 42, 0.98)',
          position: 'relative'
        }}
      >
        {/* Success Animation */}
        <Box sx={{ 
          mb: 4,
          animation: 'scaleIn 0.8s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards'
        }}>
          <CheckCircleIcon 
            sx={{ 
              fontSize: { xs: 100, sm: 120 }, 
              color: '#4CAF50', 
              mb: 2,
              filter: 'drop-shadow(0 0 20px rgba(76, 175, 80, 0.5))',
              animation: 'pulse 1s ease-in-out infinite'
            }} 
          />
        </Box>
        
        <Box sx={{ mb: 4, maxWidth: '800px' }}>
          <Typography 
            variant="h2" 
            sx={{ 
              color: '#4CAF50', 
              mb: 2, 
              fontWeight: 800, 
              fontSize: { xs: '2.2rem', sm: '3rem' },
              textShadow: '0 0 25px rgba(76, 175, 80, 0.4)'
            }}
          >
            🎉 Success!
          </Typography>
          
          <Typography variant="h4" sx={{ color: 'white', mb: 3, fontWeight: 700 }}>
            Application Received Successfully!
          </Typography>
          
          <Typography variant="h6" sx={{ color: 'rgba(255,255,255,0.9)', mb: 4, lineHeight: 1.6, maxWidth: '700px' }}>
            Congratulations! Your installment application has been successfully processed and is now under review by our expert team.
          </Typography>
        </Box>
        
        {/* Competitive Advantages */}
        <Box sx={{ 
          display: 'grid', 
          gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)' }, 
          gap: 3, 
          mb: 4,
          width: '100%',
          maxWidth: '900px'
        }}>
          {['⏱️ Lightning Fast Response', '🏆 Industry Best Rates', '🔒 Bank-Grade Security'].map((advantage, index) => (
            <Box 
              key={index}
              sx={{ 
                p: 3, 
                bgcolor: 'rgba(76, 175, 80, 0.1)', 
                borderRadius: 3, 
                border: '1px solid rgba(76, 175, 80, 0.3)',
                backdropFilter: 'blur(10px)',
                transform: 'translateY(0)',
                transition: 'transform 0.3s ease',
                '&:hover': {
                  transform: 'translateY(-5px)',
                  boxShadow: '0 10px 25px rgba(76, 175, 80, 0.2)'
                }
              }}
            >
              <Typography variant="h5" sx={{ mb: 1 }}>{advantage.split(' ')[0]}</Typography>
              <Typography variant="subtitle1" sx={{ color: '#4CAF50', fontWeight: 700, mb: 1 }}>
                {advantage.split(' ').slice(1).join(' ')}
              </Typography>
              <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)' }}>
                Why we stand out from the competition
              </Typography>
            </Box>
          ))}
        </Box>
        
        {/* Application Details */}
        <Box sx={{ 
          mt: 2, 
          p: 4, 
          bgcolor: 'rgba(76, 175, 80, 0.15)', 
          borderRadius: 3, 
          border: '2px solid rgba(76, 175, 80, 0.4)',
          width: '100%', 
          maxWidth: '600px',
          backdropFilter: 'blur(15px)',
          boxShadow: '0 0 30px rgba(76, 175, 80, 0.2)'
        }}>
          <Typography variant="h6" sx={{ color: '#4CAF50', fontWeight: 700, mb: 2 }}>
            ✅ Application Confirmed
          </Typography>
          
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, mb: 2 }}>
            <Box>
              <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)', mb: 0.5 }}>
                Reference ID:
              </Typography>
              <Typography variant="subtitle2" sx={{ color: 'white', fontWeight: 700 }}>
                XP-{Date.now().toString().slice(-6)}
              </Typography>
            </Box>
            <Box>
              <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)', mb: 0.5 }}>
                Status:
              </Typography>
              <Typography variant="subtitle2" sx={{ color: '#4CAF50', fontWeight: 700 }}>
                Under Review
              </Typography>
            </Box>
          </Box>
          
          <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.9)', mt: 2 }}>
            📧 You will receive an email confirmation shortly
          </Typography>
          <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.9)' }}>
            🕐 Expected response: Within 24-48 business hours
          </Typography>
        </Box>
        
        <Box sx={{ display: 'flex', gap: 3, mt: 4 }}>
          <Button
            variant="outlined"
            onClick={onCancel}
            sx={{ 
              color: 'rgba(255,255,255,0.7)', 
              borderColor: 'rgba(255,255,255,0.3)',
              px: 4,
              py: 1.5,
              '&:hover': { 
                bgcolor: 'rgba(255,255,255,0.1)', 
                borderColor: 'rgba(255,255,255,0.5)' 
              }
            }}
          >
            Continue Shopping
          </Button>
          <Button
            variant="contained"
            onClick={onComplete}
            sx={{ 
              bgcolor: '#4CAF50',
              color: 'white',
              px: 4,
              py: 1.5,
              fontWeight: 700,
              '&:hover': { 
                bgcolor: '#43A047',
                transform: 'translateY(-2px)',
                boxShadow: '0 5px 15px rgba(76, 175, 80, 0.4)'
              },
              transition: 'all 0.3s ease'
            }}
          >
            Close & Explore More
          </Button>
        </Box>
        
        <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.6)', mt: 3, display: 'block' }}>
          Thank you for choosing Xtrapush - Your trusted partner in premium gadgets
        </Typography>
      </Box>
    );
  }

  return (
    <Box 
      sx={{ 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        justifyContent: 'center', 
        minHeight: '100vh', 
        width: '100%',
        p: { xs: 2, sm: 4 },
        textAlign: 'center',
        bgcolor: 'rgba(15, 23, 42, 0.98)',
        position: 'relative'
      }}
    >
      {/* Competitive Features Header */}
      <Box sx={{ 
        display: 'grid', 
        gridTemplateColumns: { xs: '1fr', sm: 'repeat(4, 1fr)' }, 
        gap: 2, 
        mb: 4,
        width: '100%',
        maxWidth: '1200px'
      }}>
        {competitiveFeatures.map((feature, index) => (
          <Box 
            key={index}
            sx={{ 
              p: 2, 
              bgcolor: 'rgba(72, 206, 219, 0.08)', 
              borderRadius: 2, 
              border: '1px solid rgba(72, 206, 219, 0.15)',
              backdropFilter: 'blur(10px)'
            }}
          >
            <Typography variant="h4" sx={{ mb: 1 }}>{feature.icon}</Typography>
            <Typography variant="subtitle2" sx={{ color: '#48CEDB', fontWeight: 600, mb: 0.5 }}>
              {feature.title}
            </Typography>
            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.7rem' }}>
              {feature.desc}
            </Typography>
          </Box>
        ))}
      </Box>
      
      <Box sx={{ mb: 4, maxWidth: '800px' }}>
        <Typography 
          variant="h3" 
          sx={{ 
            color: '#48CEDB', 
            mb: 2, 
            fontWeight: 800, 
            fontSize: { xs: '2rem', sm: '2.8rem' },
            textShadow: '0 0 20px rgba(72, 206, 219, 0.3)'
          }}
        >
          🛡️ Advanced Verification System
        </Typography>
        
        <Typography variant="h5" sx={{ color: 'white', mb: 1, fontWeight: 600 }}>
          Verifying Your Eligibility
        </Typography>
        
        <Typography variant="body1" sx={{ color: 'rgba(255,255,255,0.85)', mb: 3, lineHeight: 1.6 }}>
          Our industry-leading verification system is processing your application with military-grade security protocols.
        </Typography>
      </Box>
      
      <Box sx={{ width: '100%', maxWidth: '600px', mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
          <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.9)', fontWeight: 600 }}>
            Verification Progress
          </Typography>
          <Typography variant="body2" sx={{ color: '#48CEDB', fontWeight: 700 }}>
            {progress}%
          </Typography>
        </Box>
        
        <LinearProgress 
          variant="determinate" 
          value={progress} 
          sx={{ 
            height: 12, 
            borderRadius: 6,
            backgroundColor: 'rgba(255,255,255,0.1)',
            mb: 2,
            boxShadow: '0 0 15px rgba(72, 206, 219, 0.2)',
            '& .MuiLinearProgress-bar': {
              backgroundColor: '#48CEDB',
              backgroundImage: 'linear-gradient(90deg, #48CEDB 0%, #3ab9c7 100%)',
              borderRadius: 6
            }
          }} 
        />
        
        <Box sx={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(5, 1fr)', 
          gap: 1,
          mt: 2
        }}>
          {steps.map((step, index) => (
            <Box 
              key={index}
              sx={{ 
                p: 1, 
                borderRadius: 1,
                bgcolor: index <= currentStep ? 'rgba(72, 206, 219, 0.2)' : 'rgba(255,255,255,0.05)',
                border: `1px solid ${index <= currentStep ? '#48CEDB' : 'rgba(255,255,255,0.1)'}`
              }}
            >
              <Typography 
                variant="caption" 
                sx={{ 
                  color: index <= currentStep ? '#48CEDB' : 'rgba(255,255,255,0.5)',
                  fontWeight: index <= currentStep ? 600 : 400,
                  fontSize: '0.65rem'
                }}
              >
                {step.name.split(' ')[0]}
              </Typography>
            </Box>
          ))}
        </Box>
      </Box>
      
      <Box sx={{ 
        mt: 2, 
        p: 3, 
        bgcolor: 'rgba(255,255,255,0.08)', 
        borderRadius: 3, 
        width: '100%', 
        maxWidth: '600px',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(72, 206, 219, 0.2)'
      }}>
        <CircularProgress 
          size={60} 
          thickness={3} 
          sx={{ 
            mb: 2,
            color: '#48CEDB',
            animationDuration: '1.5s'
          }} 
        />
        
        <Typography variant="h6" sx={{ color: '#48CEDB', mb: 1, fontWeight: 700 }}>
          {steps[currentStep]?.name}
        </Typography>
        <Typography variant="body2" sx={{ color: 'white', fontWeight: 500, mb: 1 }}>
          {steps[currentStep]?.description}
        </Typography>
        <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)', fontStyle: 'italic' }}>
          Powered by advanced AI algorithms • Real-time processing
        </Typography>
      </Box>
      
      <Box sx={{ display: 'flex', gap: 3, mt: 4 }}>
        <Button
          variant="outlined"
          onClick={onCancel}
          sx={{ 
            color: 'rgba(255,255,255,0.7)', 
            borderColor: 'rgba(255,255,255,0.3)',
            '&:hover': { 
              bgcolor: 'rgba(255,255,255,0.1)', 
              borderColor: 'rgba(255,255,255,0.5)' 
            }
          }}
        >
          Cancel Verification
        </Button>
        <Button
          variant="contained"
          disabled
          sx={{ 
            bgcolor: 'rgba(72, 206, 219, 0.3)', 
            color: 'rgba(255,255,255,0.5)',
            cursor: 'not-allowed'
          }}
        >
          Processing... {progress}%
        </Button>
      </Box>
    </Box>
  );
};

export default VerificationEligibilityScreen;