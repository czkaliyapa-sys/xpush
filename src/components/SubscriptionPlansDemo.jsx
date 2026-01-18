import React from 'react';
import { Box, Typography, Chip } from '@mui/material';
import StarIcon from '@mui/icons-material/Star';
import SecurityIcon from '@mui/icons-material/Security';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import DiamondIcon from '@mui/icons-material/Diamond';
import BoltIcon from '@mui/icons-material/Bolt';
import WhatshotIcon from '@mui/icons-material/Whatshot';
import DeliveryIcon from '@mui/icons-material/LocalShipping';

const SubscriptionPlansDemo = ({ selectedSubscription, onSelect, isMalawi = false }) => {
  const plans = [
    {
      id: 'plus',
      title: 'Xtrapush Plus',
      price: isMalawi ? '+6k' : '+£6',
      period: '/month',
      icon: <StarIcon sx={{ color: '#48CEDB', fontSize: 18 }} />,
      benefits: [
        'Free unlimited delivery',
        'Single gadget insurance (1 year)',
        'Member-only discounts'
      ],
      description: 'Perfect for protecting your favorite device',
      popular: false,
      color: '#48CEDB'
    },
    {
      id: 'premium',
      title: 'Xtrapush Premium',
      price: isMalawi ? '+10k' : '+£9.99',
      period: '/month',
      icon: <DiamondIcon sx={{ color: '#48CEDB', fontSize: 18 }} />,
      benefits: [
        'Free unlimited delivery',
        'Multiple gadget insurance (1 year each)',
        'Exclusive member discounts',
        'Priority support • Early access'
      ],
      description: 'Best value — protect all your devices!',
      popular: true,
      color: '#48CEDB'
    },
    {
      id: 'none',
      title: isMalawi ? 'Standard Delivery' : 'Standard Postage',
      price: isMalawi ? 'MWK 2,000' : '£4.99',
      period: '',
      icon: <DeliveryIcon sx={{ color: 'rgba(255,255,255,0.7)', fontSize: 18 }} />,
      benefits: [
        isMalawi 
          ? 'One-time delivery fee (Same day Lilongwe, next day Blantyre/Mzuzu)'
          : 'One-time delivery fee (UK delivery 1-3 business days)'
      ],
      description: '',
      popular: false,
      color: '#48CEDB'
    }
  ];

  return (
    <Box sx={{ mt: 3 }}>
      <Typography variant="h6" gutterBottom>🚚 Delivery & Protection Plans</Typography>
      <Typography variant="body2" sx={{ mb: 2, color: 'rgba(255, 255, 255, 0.8)' }}>
        Choose the right plan for your needs
      </Typography>
      
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
        {plans.map((plan) => (
          <Box
            key={plan.id}
            onClick={(e) => {
              e.stopPropagation();
              onSelect(plan.id);
            }}
            sx={{
              p: 2,
              borderRadius: 2,
              border: selectedSubscription === plan.id ? `2px solid ${plan.color}` : '1px solid rgba(255,255,255,0.15)',
              bgcolor: selectedSubscription === plan.id ? `rgba(72, 206, 219, 0.12)` : 'rgba(255,255,255,0.02)',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              position: 'relative',
              boxShadow: plan.popular && selectedSubscription === plan.id 
                ? '0 4px 16px rgba(72, 206, 219, 0.3)' 
                : 'none',
              '&:hover': {
                borderColor: plan.color,
                bgcolor: 'rgba(72, 206, 219, 0.08)',
                transform: plan.popular ? 'translateY(-2px)' : 'none',
                boxShadow: plan.popular ? '0 6px 20px rgba(72, 206, 219, 0.35)' : '0 2px 8px rgba(72, 206, 219, 0.1)'
              }
            }}
          >
            {plan.popular && (
              <Chip 
                label={<Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}><WhatshotIcon sx={{ fontSize: 14 }} /> Most Popular</Box>}
                size="small" 
                sx={{ 
                  position: 'absolute',
                  top: 12,
                  right: 12,
                  bgcolor: plan.color, 
                  color: '#0f172a', 
                  fontWeight: 700,
                  fontSize: '0.65rem'
                }} 
              />
            )}
            
            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
              {/* Simple Radio Circle */}
              <Box sx={{
                width: 18,
                height: 18,
                borderRadius: '50%',
                border: '1px solid rgba(255,255,255,0.3)',
                bgcolor: selectedSubscription === plan.id ? plan.color : 'transparent',
                flexShrink: 0,
                mt: 0.5,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.2s ease'
              }}>
                {selectedSubscription === plan.id && (
                  <Box sx={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    bgcolor: '#0d2137'
                  }} />
                )}
              </Box>
              
              {/* Content */}
              <Box sx={{ flex: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {plan.icon}
                    <Typography variant="body1" sx={{ fontWeight: 700, color: 'white' }}>
                      {plan.title}
                    </Typography>
                  </Box>
                  <Typography variant="h6" sx={{ fontWeight: 800, color: plan.color }}>
                    {plan.price}
                    {plan.period && (
                      <Typography component="span" variant="caption" sx={{ fontSize: '0.7rem', opacity: 0.8 }}>
                        {plan.period}
                      </Typography>
                    )}
                  </Typography>
                </Box>
                
                <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.9)', display: 'block', mb: 1, lineHeight: 1.4 }}>
                  {plan.benefits.join(' • ')}
                </Typography>
                
                {plan.description && (
                  <Typography variant="caption" sx={{ 
                    color: plan.popular ? 'rgba(72, 206, 219, 1)' : 'rgba(72, 206, 219, 0.9)', 
                    display: 'block', 
                    fontWeight: plan.popular ? 600 : 'normal',
                    fontStyle: plan.popular ? 'normal' : 'italic'
                  }}>
                    {plan.description}
                  </Typography>
                )}
              </Box>
            </Box>
          </Box>
        ))}
      </Box>
    </Box>
  );
};

export default SubscriptionPlansDemo;