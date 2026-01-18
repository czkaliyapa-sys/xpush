import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Switch,
  Image,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { spacing, borderRadius, fontSize } from '../lib/theme';

const menuItems = [
  { id: 'orders', icon: 'receipt-outline', title: 'My Orders', screen: 'Orders' },
  { id: 'subscriptions', icon: 'diamond-outline', title: 'Subscriptions', screen: 'Subscriptions' },
  { id: 'tradein', icon: 'swap-horizontal-outline', title: 'Trade-In', screen: 'TradeIn' },
  { id: 'addresses', icon: 'location-outline', title: 'Addresses', screen: null },
  { id: 'payments', icon: 'card-outline', title: 'Payment Methods', screen: null },
  { id: 'notifications', icon: 'notifications-outline', title: 'Notifications', screen: null },
  { id: 'help', icon: 'help-circle-outline', title: 'Help & Support', screen: null },
  { id: 'about', icon: 'information-circle-outline', title: 'About', screen: null },
];

export default function ProfileScreen({ navigation }) {
  const { colors, toggleTheme, isDark } = useTheme();
  const { user, isAuthenticated, logout } = useAuth();
  const { currency, setCurrency } = useCart();

  const handleLogout = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Sign Out', style: 'destructive', onPress: logout },
      ]
    );
  };

  const handleMenuPress = (item) => {
    if (item.screen) {
      if (!isAuthenticated && ['orders', 'subscriptions', 'tradein'].includes(item.id)) {
        navigation.navigate('Login');
      } else {
        navigation.navigate(item.screen);
      }
    } else {
      Alert.alert('Coming Soon', 'This feature will be available soon.');
    }
  };

  const styles = createStyles(colors);

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Profile Header */}
      <View style={styles.header}>
        {isAuthenticated ? (
          <>
            <View style={styles.avatarContainer}>
              {user?.photoURL ? (
                <Image source={{ uri: user.photoURL }} style={styles.avatar} />
              ) : (
                <View style={[styles.avatar, styles.avatarPlaceholder]}>
                  <Text style={styles.avatarText}>
                    {user?.firstName?.[0] || user?.email?.[0]?.toUpperCase() || 'U'}
                  </Text>
                </View>
              )}
            </View>
            <Text style={styles.userName}>
              {user?.firstName ? `${user.firstName} ${user.lastName || ''}` : 'User'}
            </Text>
            <Text style={styles.userEmail}>{user?.email}</Text>
            {user?.subscription_tier && user.subscription_tier !== 'free' && (
              <View style={styles.subscriptionBadge}>
                <Ionicons name="diamond" size={14} color="#fff" />
                <Text style={styles.subscriptionText}>
                  {user.subscription_tier === 'premium' ? 'Premium' : 'Plus'} Member
                </Text>
              </View>
            )}
          </>
        ) : (
          <>
            <View style={[styles.avatar, styles.avatarPlaceholder]}>
              <Ionicons name="person-outline" size={40} color={colors.textMuted} />
            </View>
            <Text style={styles.userName}>Welcome to Xtrapush</Text>
            <Text style={styles.userEmail}>Sign in to access your account</Text>
            <TouchableOpacity
              style={styles.signInButton}
              onPress={() => navigation.navigate('Login')}
            >
              <Text style={styles.signInButtonText}>Sign In</Text>
            </TouchableOpacity>
          </>
        )}
      </View>

      {/* Settings */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Settings</Text>
        
        {/* Theme Toggle */}
        <View style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <Ionicons name={isDark ? 'moon' : 'sunny'} size={22} color={colors.text} />
            <Text style={styles.settingTitle}>Dark Mode</Text>
          </View>
          <Switch
            value={isDark}
            onValueChange={toggleTheme}
            trackColor={{ false: colors.border, true: colors.primary }}
            thumbColor="#fff"
          />
        </View>

        {/* Currency Toggle */}
        <TouchableOpacity
          style={styles.settingRow}
          onPress={() => setCurrency(currency === 'GBP' ? 'MWK' : 'GBP')}
        >
          <View style={styles.settingInfo}>
            <Ionicons name="cash-outline" size={22} color={colors.text} />
            <Text style={styles.settingTitle}>Currency</Text>
          </View>
          <View style={styles.currencyBadge}>
            <Text style={styles.currencyText}>
              {currency === 'GBP' ? '🇬🇧 GBP' : '🇲🇼 MWK'}
            </Text>
            <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
          </View>
        </TouchableOpacity>
      </View>

      {/* Menu Items */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Account</Text>
        
        {menuItems.map((item) => (
          <TouchableOpacity
            key={item.id}
            style={styles.menuItem}
            onPress={() => handleMenuPress(item)}
          >
            <View style={styles.menuItemLeft}>
              <Ionicons name={item.icon} size={22} color={colors.text} />
              <Text style={styles.menuItemTitle}>{item.title}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
          </TouchableOpacity>
        ))}
      </View>

      {/* Sign Out */}
      {isAuthenticated && (
        <TouchableOpacity style={styles.signOutButton} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={22} color="#ef4444" />
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>
      )}

      {/* App Version */}
      <View style={styles.footer}>
        <Text style={styles.versionText}>Xtrapush v1.0.0</Text>
        <Text style={styles.copyrightText}>© 2025 Xtrapush Gadgets</Text>
      </View>

      <View style={{ height: spacing.xxl }} />
    </ScrollView>
  );
}

const createStyles = (colors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      alignItems: 'center',
      paddingVertical: spacing.xl,
      paddingHorizontal: spacing.md,
      backgroundColor: colors.card,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    avatarContainer: {
      marginBottom: spacing.md,
    },
    avatar: {
      width: 80,
      height: 80,
      borderRadius: 40,
    },
    avatarPlaceholder: {
      backgroundColor: colors.surface,
      justifyContent: 'center',
      alignItems: 'center',
    },
    avatarText: {
      fontSize: fontSize.xxxl,
      fontWeight: 'bold',
      color: colors.primary,
    },
    userName: {
      fontSize: fontSize.xl,
      fontWeight: 'bold',
      color: colors.text,
    },
    userEmail: {
      fontSize: fontSize.md,
      color: colors.textMuted,
      marginTop: spacing.xs,
    },
    subscriptionBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
      backgroundColor: colors.primary,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.xs,
      borderRadius: borderRadius.full,
      marginTop: spacing.md,
    },
    subscriptionText: {
      color: '#fff',
      fontSize: fontSize.sm,
      fontWeight: '600',
    },
    signInButton: {
      backgroundColor: colors.primary,
      paddingHorizontal: spacing.xl,
      paddingVertical: spacing.sm,
      borderRadius: borderRadius.lg,
      marginTop: spacing.md,
    },
    signInButtonText: {
      color: '#fff',
      fontSize: fontSize.md,
      fontWeight: '600',
    },
    section: {
      paddingTop: spacing.lg,
    },
    sectionTitle: {
      fontSize: fontSize.sm,
      fontWeight: '600',
      color: colors.textMuted,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
      paddingHorizontal: spacing.md,
      marginBottom: spacing.sm,
    },
    settingRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: colors.card,
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    settingInfo: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
    },
    settingTitle: {
      fontSize: fontSize.md,
      color: colors.text,
    },
    currencyBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
    },
    currencyText: {
      fontSize: fontSize.md,
      color: colors.textMuted,
    },
    menuItem: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: colors.card,
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    menuItemLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
    },
    menuItemTitle: {
      fontSize: fontSize.md,
      color: colors.text,
    },
    signOutButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing.sm,
      marginHorizontal: spacing.md,
      marginTop: spacing.lg,
      paddingVertical: spacing.md,
      backgroundColor: colors.card,
      borderRadius: borderRadius.lg,
      borderWidth: 1,
      borderColor: '#ef444433',
    },
    signOutText: {
      fontSize: fontSize.md,
      color: '#ef4444',
      fontWeight: '500',
    },
    footer: {
      alignItems: 'center',
      paddingTop: spacing.xl,
    },
    versionText: {
      fontSize: fontSize.sm,
      color: colors.textMuted,
    },
    copyrightText: {
      fontSize: fontSize.xs,
      color: colors.textMuted,
      marginTop: spacing.xs,
    },
  });
