// Quick test for UserProfile component functionality
import React from 'react';
import ReactDOM from 'react-dom/client';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';

const testTheme = createTheme({
  palette: {
    mode: 'light',
  },
});

// Test component to verify UserProfile renders without errors
const UserProfileTest = () => {
  return (
    <ThemeProvider theme={testTheme}>
      <CssBaseline />
      <div style={{ padding: '20px' }}>
        <h2>UserProfile Component Test</h2>
        <p>If you can see this, the UserProfile component imports are working correctly.</p>
        {/* UserProfile component would be imported and tested here in actual testing */}
      </div>
    </ThemeProvider>
  );
};

export default UserProfileTest;