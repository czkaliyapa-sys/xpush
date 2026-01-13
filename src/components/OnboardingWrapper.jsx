import React from 'react';
import { useAuth } from '../contexts/AuthContext.jsx';
import OnboardingFlow from '../components/OnboardingFlow.jsx';
import { useNavigate } from 'react-router-dom';

const OnboardingWrapper = ({ children }) => {
  const { user, needsOnboarding, completeOnboarding, loading } = useAuth();
  const navigate = useNavigate();

  const handleOnboardingComplete = async (userData) => {
    await completeOnboarding(userData);
    navigate('/dashboard');
  };

  // Show loading while checking auth state
  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        fontSize: '18px'
      }}>
        Loading...
      </div>
    );
  }

  // Show onboarding flow for new Google users
  if (user && needsOnboarding) {
    return (
      <OnboardingFlow 
        user={user} 
        onComplete={handleOnboardingComplete}
        disableCustomTheme={false}
      />
    );
  }

  // Render normal content
  return children;
};

export default OnboardingWrapper;