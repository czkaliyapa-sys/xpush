import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth } from '../firebase.jsx';
import { authAPI } from '../services/api.js';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [needsOnboarding, setNeedsOnboarding] = useState(false);
  const [userProfile, setUserProfile] = useState(null);
  const [userRole, setUserRole] = useState(null);

  const isProfileComplete = (profile) => {
    if (!profile) return false;
    // User exists in database = profile is considered complete
    // Don't force onboarding for existing users - they can update profile in settings
    // Only check if basic user data exists (uid or id)
    return !!(profile.uid || profile.id || profile.email);
  };

  useEffect(() => {
    let unsubscribe = () => {};
    const init = async () => {
      // Check backend session first
      const backendSession = localStorage.getItem('backendSession');
      const backendUserRaw = localStorage.getItem('backendUser');
      const adminSession = localStorage.getItem('adminSession');
      if (backendSession === 'true' && backendUserRaw) {
        try {
          const backendUser = JSON.parse(backendUserRaw);
          setUser(backendUser);
          // If admin session flag exists, set role immediately
          const isAdminSession = adminSession === 'true';
          if (isAdminSession) {
            setUserRole('admin');
          }
          // Attempt to fetch profile using backend user's uid or id
          const uid = backendUser?.uid || backendUser?.id;
          if (uid) {
            try {
              const response = await authAPI.getUserProfile(uid);
              if (response?.success && response?.user) {
                setUserProfile(response.user);
                setUserRole(response.user.userRole || (isAdminSession ? 'admin' : 'buyer'));
                setNeedsOnboarding(false);
              } else {
                // If admin login without profile, do not force onboarding
                if (isAdminSession) {
                  setUserRole('admin');
                  setNeedsOnboarding(false);
                } else {
                  setNeedsOnboarding(true);
                }
              }
            } catch (error) {
              if (error.response && error.response.status === 404) {
                // If admin login, skip onboarding
                if (isAdminSession) {
                  setUserRole('admin');
                  setNeedsOnboarding(false);
                } else {
                  setNeedsOnboarding(true);
                }
              } else {
                setNeedsOnboarding(false);
              }
            }
          } else if (isAdminSession) {
            // No uid/id but admin session, set admin role to avoid limited view
            setUserRole('admin');
            setNeedsOnboarding(false);
          }
          setLoading(false);
        } catch (e) {
          console.warn('Failed to parse backend session user:', e);
        }
      }

      unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
        // If backend or admin session exists, do not override with Firebase
        const hasBackendSession = localStorage.getItem('backendSession') === 'true';
        const hasAdminSession = localStorage.getItem('adminSession') === 'true';
        if (hasBackendSession || hasAdminSession) {
          setLoading(false);
          return;
        }
        if (firebaseUser) {
          setUser(firebaseUser);
          // Check if user needs onboarding
          await checkUserProfile(firebaseUser);
        } else {
          setUser(null);
          setUserProfile(null);
          setUserRole(null);
          setNeedsOnboarding(false);
        }
        setLoading(false);
      });
    };

    init();
    return () => unsubscribe();
  }, []);

  const checkUserProfile = async (firebaseUser) => {
    try {
      console.log('🔍 Checking user profile for:', firebaseUser.email);
      
      const response = await authAPI.getUserProfile(firebaseUser.uid);

      if (response?.success && response?.user) {
        console.log('✅ User profile found');
        setUserProfile(response.user);
        setUserRole(response.user.userRole || 'buyer');
        // User exists in database = no onboarding needed
        setNeedsOnboarding(false);
      } else {
        console.log('⚠️ User profile not found - needs onboarding');
        setNeedsOnboarding(true);
      }
    } catch (error) {
      console.warn('⚠️ Could not check user profile:', error);
      
      // Only trigger onboarding for 404 errors (user not found)
      // Don't trigger for network errors, server errors, etc.
      if (error.response && error.response.status === 404) {
        console.log('🆕 User not found in database - triggering onboarding');
        setNeedsOnboarding(true);
      } else {
        console.log('🔧 API error, assuming user exists to avoid false onboarding');
        setNeedsOnboarding(false);
      }
    }
  };

  const completeOnboarding = async (userData) => {
    try {
      console.log('✅ Onboarding completed for user:', userData.email);

      const uidForUpdate = userData?.uid || user?.uid || user?.id;
      const emailForRegister = userData?.email || user?.email;

      const profilePayload = {
        fullName: userData?.fullName,
        phone: userData?.phone,
        address: userData?.address,
        town: userData?.town,
        postcode: userData?.postcode,
        dob: userData?.dob || null,  // DOB is optional
        photoURL: userData?.photoURL || user?.photoURL || null
      };

      let persistedUser = null;

      try {
        const updateResp = await authAPI.updateUserProfile(uidForUpdate, profilePayload);
        if (updateResp?.success && updateResp?.user) {
          persistedUser = updateResp.user;
        }
      } catch (err) {
        // If the user does not exist yet, register minimally then retry update
        if (err.response && err.response.status === 404 && uidForUpdate && emailForRegister) {
          try {
            await authAPI.register({
              uid: uidForUpdate,
              email: emailForRegister,
              fullName: userData?.fullName || user?.displayName || '',
              signupMethod: 'google'
            });
            const retryResp = await authAPI.updateUserProfile(uidForUpdate, profilePayload);
            if (retryResp?.success && retryResp?.user) {
              persistedUser = retryResp.user;
            }
          } catch (regErr) {
            console.error('❌ Registration during onboarding failed:', regErr);
          }
        } else {
          console.error('❌ Error updating profile during onboarding:', err);
        }
      }

      // Fallback to provided userData if backend did not return user
      const finalUser = persistedUser || userData;
      setUserProfile(finalUser);
      setUserRole(finalUser.userRole || 'buyer');
      setNeedsOnboarding(false);
    } catch (error) {
      console.error('❌ Error completing onboarding:', error);
    }
  };

  const updateUserProfile = async (updatedData) => {
    try {
      const uidForUpdate = user?.uid || user?.id;
      const response = await authAPI.updateUserProfile(uidForUpdate, updatedData);

      if (response?.success) {
        setUserProfile(response.user);
        setUserRole(response.user.userRole || userRole);
        return { success: true };
      } else {
        throw new Error(response?.error || 'Failed to update profile');
      }
    } catch (error) {
      console.error('❌ Error updating user profile:', error);
      return { success: false, error: error.message };
    }
  };

  // Hydrate context from backend session/user immediately after login
  const hydrateBackendSession = async (backendUser) => {
    try {
      setUser(backendUser);
      const isAdminSession = localStorage.getItem('adminSession') === 'true';
      if (isAdminSession) {
        setUserRole('admin');
      }
      const uid = backendUser?.uid || backendUser?.id;
      if (uid) {
        try {
          const response = await authAPI.getUserProfile(uid);
          if (response?.success && response?.user) {
            setUserProfile(response.user);
            setUserRole(response.user.userRole || (isAdminSession ? 'admin' : 'buyer'));
            setNeedsOnboarding(isAdminSession ? false : !isProfileComplete(response.user));
          } else {
            if (isAdminSession) {
              setUserRole('admin');
              setNeedsOnboarding(false);
            } else {
              setNeedsOnboarding(true);
            }
          }
        } catch (error) {
          if (error.response && error.response.status === 404) {
            if (isAdminSession) {
              setUserRole('admin');
              setNeedsOnboarding(false);
            } else {
              setNeedsOnboarding(true);
            }
          } else {
            setNeedsOnboarding(false);
          }
        }
      } else if (isAdminSession) {
        setUserRole('admin');
        setNeedsOnboarding(false);
      }
    } catch (e) {
      console.warn('Failed to hydrate backend session:', e);
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      // Clear backend session too
      localStorage.removeItem('backendSession');
      localStorage.removeItem('backendUser');
      localStorage.removeItem('adminSession');
      localStorage.removeItem('adminUser');
      setUser(null);
      setUserProfile(null);
      setUserRole(null);
      setNeedsOnboarding(false);
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  // Role checking helper functions
  const isAdmin = () => userRole === 'admin';
  const isSeller = () => userRole === 'seller';
  const isBuyer = () => userRole === 'buyer';
  const hasRole = (role) => userRole === role;
  const hasAnyRole = (roles) => roles.includes(userRole);

  const value = {
    user,
    setUser,
    userProfile,
    userRole,
    loading,
    logout,
    isAuthenticated: !!user,
    needsOnboarding,
    completeOnboarding,
    updateUserProfile,
    hydrateBackendSession,
    // Role helper functions
    isAdmin,
    isSeller,
    isBuyer,
    hasRole,
    hasAnyRole
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};