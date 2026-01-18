import React, { useState } from 'react';
import { Box } from '@mui/material';
import SubscriptionPlansDemo from './SubscriptionPlansDemo';

const SubscriptionTestPage = () => {
  const [selectedPlan, setSelectedPlan] = useState('none');

  const handlePlanSelect = (planId) => {
    console.log('Selected plan:', planId);
    setSelectedPlan(planId);
  };

  return (
    <Box sx={{ 
      p: 3, 
      bgcolor: '#0f172a', 
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center'
    }}>
      <Box sx={{ width: '100%', maxWidth: 600 }}>
        <SubscriptionPlansDemo 
          selectedSubscription={selectedPlan}
          onSelect={handlePlanSelect}
          isMalawi={false}
        />
        
        <Box sx={{ 
          mt: 3, 
          p: 2, 
          bgcolor: 'rgba(255,255,255,0.1)', 
          borderRadius: 1,
          textAlign: 'center'
        }}>
          <div style={{ color: 'white', marginBottom: '10px' }}>
            <strong>Current Selection:</strong> {selectedPlan}
          </div>
          <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: '14px' }}>
            Test switching between options to verify consistent radio circle sizing
          </div>
        </Box>
      </Box>
    </Box>
  );
};

export default SubscriptionTestPage;