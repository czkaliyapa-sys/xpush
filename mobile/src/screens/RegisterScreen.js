import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';
import { spacing, borderRadius, fontSize } from '../lib/theme';

export default function RegisterScreen({ navigation }) {
  const { colors } = useTheme();
  const { login } = useAuth();
  
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [agreed, setAgreed] = useState(false);

  const updateField = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleRegister = async () => {
    if (!formData.firstName.trim() || !formData.email.trim() || !formData.password.trim()) {
      Alert.alert('Missing Information', 'Please fill in all required fields');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      Alert.alert('Password Mismatch', 'Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      Alert.alert('Weak Password', 'Password must be at least 6 characters');
      return;
    }

    if (!agreed) {
      Alert.alert('Terms Required', 'Please agree to the terms and conditions');
      return;
    }

    setLoading(true);
    try {
      const userData = {
        uid: 'user_' + Date.now(),
        email: formData.email.trim().toLowerCase(),
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        subscription_tier: 'free',
      };
      
      // Sync with backend
      try {
        await api.syncUser({
          firebaseUid: userData.uid,
          email: userData.email,
          displayName: `${userData.firstName} ${userData.lastName}`.trim(),
        });
      } catch (e) {
        console.log('User sync failed, continuing...', e);
      }
      
      login(userData);
      navigation.goBack();
      Alert.alert('Welcome!', 'Your account has been created successfully.');
    } catch (error) {
      console.error('Registration error:', error);
      Alert.alert('Registration Failed', 'Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const styles = createStyles(colors);

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Create Account</Text>
          <Text style={styles.subtitle}>Sign up to start shopping</Text>
        </View>

        {/* Form */}
        <View style={styles.form}>
          <View style={styles.row}>
            <View style={[styles.inputContainer, styles.halfInput]}>
              <TextInput
                style={styles.input}
                placeholder="First Name *"
                placeholderTextColor={colors.textMuted}
                value={formData.firstName}
                onChangeText={(v) => updateField('firstName', v)}
              />
            </View>
            <View style={[styles.inputContainer, styles.halfInput]}>
              <TextInput
                style={styles.input}
                placeholder="Last Name"
                placeholderTextColor={colors.textMuted}
                value={formData.lastName}
                onChangeText={(v) => updateField('lastName', v)}
              />
            </View>
          </View>

          <View style={styles.inputContainer}>
            <Ionicons name="mail-outline" size={20} color={colors.textMuted} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Email address *"
              placeholderTextColor={colors.textMuted}
              value={formData.email}
              onChangeText={(v) => updateField('email', v)}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          <View style={styles.inputContainer}>
            <Ionicons name="lock-closed-outline" size={20} color={colors.textMuted} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Password *"
              placeholderTextColor={colors.textMuted}
              value={formData.password}
              onChangeText={(v) => updateField('password', v)}
              secureTextEntry={!showPassword}
            />
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
              <Ionicons
                name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                size={20}
                color={colors.textMuted}
              />
            </TouchableOpacity>
          </View>

          <View style={styles.inputContainer}>
            <Ionicons name="lock-closed-outline" size={20} color={colors.textMuted} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Confirm Password *"
              placeholderTextColor={colors.textMuted}
              value={formData.confirmPassword}
              onChangeText={(v) => updateField('confirmPassword', v)}
              secureTextEntry={!showPassword}
            />
          </View>

          {/* Terms Checkbox */}
          <TouchableOpacity
            style={styles.checkboxRow}
            onPress={() => setAgreed(!agreed)}
          >
            <View style={[styles.checkbox, agreed && styles.checkboxChecked]}>
              {agreed && <Ionicons name="checkmark" size={14} color="#fff" />}
            </View>
            <Text style={styles.checkboxText}>
              I agree to the <Text style={styles.link}>Terms of Service</Text> and{' '}
              <Text style={styles.link}>Privacy Policy</Text>
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.signUpButton, loading && styles.disabledButton]}
            onPress={handleRegister}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.signUpButtonText}>Create Account</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Sign In Link */}
        <View style={styles.signInContainer}>
          <Text style={styles.signInText}>Already have an account? </Text>
          <TouchableOpacity onPress={() => navigation.navigate('Login')}>
            <Text style={styles.signInLink}>Sign In</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const createStyles = (colors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    content: {
      flexGrow: 1,
      padding: spacing.lg,
    },
    header: {
      marginBottom: spacing.xl,
    },
    title: {
      fontSize: fontSize.xxl,
      fontWeight: 'bold',
      color: colors.text,
    },
    subtitle: {
      fontSize: fontSize.md,
      color: colors.textMuted,
      marginTop: spacing.xs,
    },
    form: {
      marginBottom: spacing.xl,
    },
    row: {
      flexDirection: 'row',
      gap: spacing.sm,
    },
    halfInput: {
      flex: 1,
    },
    inputContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.surface,
      borderRadius: borderRadius.lg,
      paddingHorizontal: spacing.md,
      marginBottom: spacing.md,
      borderWidth: 1,
      borderColor: colors.border,
    },
    inputIcon: {
      marginRight: spacing.sm,
    },
    input: {
      flex: 1,
      paddingVertical: spacing.md,
      fontSize: fontSize.md,
      color: colors.text,
    },
    checkboxRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      marginBottom: spacing.lg,
    },
    checkbox: {
      width: 22,
      height: 22,
      borderRadius: borderRadius.sm,
      borderWidth: 2,
      borderColor: colors.border,
      marginRight: spacing.sm,
      marginTop: 2,
      justifyContent: 'center',
      alignItems: 'center',
    },
    checkboxChecked: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    checkboxText: {
      flex: 1,
      fontSize: fontSize.sm,
      color: colors.textSecondary,
      lineHeight: 20,
    },
    link: {
      color: colors.primary,
    },
    signUpButton: {
      backgroundColor: colors.primary,
      paddingVertical: spacing.md,
      borderRadius: borderRadius.lg,
      alignItems: 'center',
    },
    signUpButtonText: {
      color: '#fff',
      fontSize: fontSize.md,
      fontWeight: '600',
    },
    disabledButton: {
      opacity: 0.7,
    },
    signInContainer: {
      flexDirection: 'row',
      justifyContent: 'center',
    },
    signInText: {
      fontSize: fontSize.md,
      color: colors.textMuted,
    },
    signInLink: {
      fontSize: fontSize.md,
      color: colors.primary,
      fontWeight: '600',
    },
  });
