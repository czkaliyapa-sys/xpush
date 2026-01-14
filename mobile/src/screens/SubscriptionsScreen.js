import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { formatPrice, spacing, borderRadius, fontSize } from '../lib/theme';

const plans = [
  {
    id: 'free',
    name: 'Free',
    price: { GBP: 0, MWK: 0 },
    features: [
      'Browse all products',
      'Standard delivery fees',
      'Basic support',
    ],
    notIncluded: [
      'Free delivery',
      'Gadget insurance',
      'Member discounts',
      'Priority support',
    ],
  },
  {
    id: 'plus',
    name: 'Plus',
    price: { GBP: 5.99, MWK: 6000 },
    popular: true,
    features: [
      'Free delivery on orders over £25',
      '5% member discount',
      'Priority support',
      'Early access to sales',
    ],
    notIncluded: [
      'Unlimited free delivery',
      'Gadget insurance',
    ],
  },
  {
    id: 'premium',
    name: 'Premium',
    price: { GBP: 14.99, MWK: 15000 },
    features: [
      'Unlimited free delivery',
      '1 year gadget insurance',
      '10% member discount',
      'Priority support 24/7',
      'Early access to new products',
      'Free returns',
      'Exclusive deals',
    ],
    notIncluded: [],
  },
];

export default function SubscriptionsScreen({ navigation }) {
  const { colors } = useTheme();
  const { user, isAuthenticated, updateUser } = useAuth();
  const { currency } = useCart();
  const [selectedPlan, setSelectedPlan] = useState(user?.subscription_tier || 'free');

  const handleSubscribe = (plan) => {
    if (!isAuthenticated) {
      Alert.alert(
        'Sign In Required',
        'Please sign in to subscribe to a plan.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Sign In', onPress: () => navigation.navigate('Login') },
        ]
      );
      return;
    }

    if (plan.id === 'free') {
      updateUser({ subscription_tier: 'free' });
      Alert.alert('Success', 'You are now on the Free plan.');
      return;
    }

    Alert.alert(
      'Subscribe to ' + plan.name,
      `You will be charged ${formatPrice(plan.price[currency], currency)}/month. Continue?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Subscribe',
          onPress: () => {
            // In production, this would open payment flow
            updateUser({ subscription_tier: plan.id });
            Alert.alert('Subscribed!', `Welcome to Xtrapush ${plan.name}!`);
          },
        },
      ]
    );
  };

  const styles = createStyles(colors);

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Choose Your Plan</Text>
        <Text style={styles.headerSubtitle}>
          Unlock exclusive benefits with our subscription plans
        </Text>
      </View>

      {/* Current Plan */}
      {isAuthenticated && user?.subscription_tier && user.subscription_tier !== 'free' && (
        <View style={styles.currentPlan}>
          <Ionicons name="diamond" size={24} color={colors.primary} />
          <View style={styles.currentPlanInfo}>
            <Text style={styles.currentPlanLabel}>Current Plan</Text>
            <Text style={styles.currentPlanName}>
              {plans.find(p => p.id === user.subscription_tier)?.name || 'Free'}
            </Text>
          </View>
        </View>
      )}

      {/* Plans */}
      <View style={styles.plansContainer}>
        {plans.map((plan) => {
          const isCurrentPlan = user?.subscription_tier === plan.id;
          const isSelected = selectedPlan === plan.id;
          
          return (
            <TouchableOpacity
              key={plan.id}
              style={[
                styles.planCard,
                isSelected && styles.planCardSelected,
                plan.popular && styles.planCardPopular,
              ]}
              onPress={() => setSelectedPlan(plan.id)}
              activeOpacity={0.8}
            >
              {plan.popular && (
                <View style={styles.popularBadge}>
                  <Text style={styles.popularBadgeText}>Most Popular</Text>
                </View>
              )}

              <View style={styles.planHeader}>
                <Text style={styles.planName}>{plan.name}</Text>
                <View style={styles.priceRow}>
                  <Text style={styles.planPrice}>
                    {plan.price[currency] === 0 ? 'Free' : formatPrice(plan.price[currency], currency)}
                  </Text>
                  {plan.price[currency] > 0 && (
                    <Text style={styles.priceInterval}>/month</Text>
                  )}
                </View>
              </View>

              <View style={styles.featuresContainer}>
                {plan.features.map((feature, index) => (
                  <View key={index} style={styles.featureRow}>
                    <Ionicons name="checkmark-circle" size={18} color="#22c55e" />
                    <Text style={styles.featureText}>{feature}</Text>
                  </View>
                ))}
                {plan.notIncluded.map((feature, index) => (
                  <View key={index} style={styles.featureRow}>
                    <Ionicons name="close-circle" size={18} color={colors.textMuted} />
                    <Text style={[styles.featureText, styles.featureTextDisabled]}>
                      {feature}
                    </Text>
                  </View>
                ))}
              </View>

              <TouchableOpacity
                style={[
                  styles.subscribeButton,
                  isCurrentPlan && styles.subscribeButtonDisabled,
                  plan.popular && styles.subscribeButtonPopular,
                ]}
                onPress={() => handleSubscribe(plan)}
                disabled={isCurrentPlan}
              >
                <Text
                  style={[
                    styles.subscribeButtonText,
                    plan.popular && styles.subscribeButtonTextPopular,
                  ]}
                >
                  {isCurrentPlan ? 'Current Plan' : plan.price[currency] === 0 ? 'Downgrade' : 'Subscribe'}
                </Text>
              </TouchableOpacity>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Benefits */}
      <View style={styles.benefitsSection}>
        <Text style={styles.benefitsTitle}>Why Subscribe?</Text>
        <View style={styles.benefitsList}>
          <View style={styles.benefitItem}>
            <View style={[styles.benefitIcon, { backgroundColor: '#22c55e20' }]}>
              <Ionicons name="car" size={24} color="#22c55e" />
            </View>
            <View style={styles.benefitContent}>
              <Text style={styles.benefitTitle}>Free Delivery</Text>
              <Text style={styles.benefitDesc}>Save on shipping costs</Text>
            </View>
          </View>
          <View style={styles.benefitItem}>
            <View style={[styles.benefitIcon, { backgroundColor: '#3b82f620' }]}>
              <Ionicons name="shield-checkmark" size={24} color="#3b82f6" />
            </View>
            <View style={styles.benefitContent}>
              <Text style={styles.benefitTitle}>Gadget Insurance</Text>
              <Text style={styles.benefitDesc}>Protection for 1 year</Text>
            </View>
          </View>
          <View style={styles.benefitItem}>
            <View style={[styles.benefitIcon, { backgroundColor: '#f59e0b20' }]}>
              <Ionicons name="pricetag" size={24} color="#f59e0b" />
            </View>
            <View style={styles.benefitContent}>
              <Text style={styles.benefitTitle}>Member Discounts</Text>
              <Text style={styles.benefitDesc}>Up to 10% off</Text>
            </View>
          </View>
        </View>
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
      padding: spacing.lg,
      alignItems: 'center',
    },
    headerTitle: {
      fontSize: fontSize.xxl,
      fontWeight: 'bold',
      color: colors.text,
    },
    headerSubtitle: {
      fontSize: fontSize.md,
      color: colors.textMuted,
      textAlign: 'center',
      marginTop: spacing.xs,
    },
    currentPlan: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.primary + '15',
      marginHorizontal: spacing.md,
      padding: spacing.md,
      borderRadius: borderRadius.lg,
      marginBottom: spacing.md,
    },
    currentPlanInfo: {
      marginLeft: spacing.md,
    },
    currentPlanLabel: {
      fontSize: fontSize.sm,
      color: colors.textMuted,
    },
    currentPlanName: {
      fontSize: fontSize.lg,
      fontWeight: 'bold',
      color: colors.primary,
    },
    plansContainer: {
      paddingHorizontal: spacing.md,
    },
    planCard: {
      backgroundColor: colors.card,
      borderRadius: borderRadius.xl,
      padding: spacing.lg,
      marginBottom: spacing.md,
      borderWidth: 2,
      borderColor: colors.border,
    },
    planCardSelected: {
      borderColor: colors.primary,
    },
    planCardPopular: {
      borderColor: colors.primary,
    },
    popularBadge: {
      position: 'absolute',
      top: -12,
      right: spacing.md,
      backgroundColor: colors.primary,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.xs,
      borderRadius: borderRadius.full,
    },
    popularBadgeText: {
      color: '#fff',
      fontSize: fontSize.xs,
      fontWeight: '600',
    },
    planHeader: {
      marginBottom: spacing.md,
    },
    planName: {
      fontSize: fontSize.xl,
      fontWeight: 'bold',
      color: colors.text,
    },
    priceRow: {
      flexDirection: 'row',
      alignItems: 'baseline',
      marginTop: spacing.xs,
    },
    planPrice: {
      fontSize: fontSize.xxxl,
      fontWeight: 'bold',
      color: colors.primary,
    },
    priceInterval: {
      fontSize: fontSize.md,
      color: colors.textMuted,
      marginLeft: spacing.xs,
    },
    featuresContainer: {
      marginBottom: spacing.md,
    },
    featureRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      marginBottom: spacing.sm,
    },
    featureText: {
      fontSize: fontSize.md,
      color: colors.text,
      flex: 1,
    },
    featureTextDisabled: {
      color: colors.textMuted,
      textDecorationLine: 'line-through',
    },
    subscribeButton: {
      paddingVertical: spacing.md,
      borderRadius: borderRadius.lg,
      alignItems: 'center',
      borderWidth: 2,
      borderColor: colors.primary,
    },
    subscribeButtonPopular: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    subscribeButtonDisabled: {
      opacity: 0.5,
    },
    subscribeButtonText: {
      fontSize: fontSize.md,
      fontWeight: '600',
      color: colors.primary,
    },
    subscribeButtonTextPopular: {
      color: '#fff',
    },
    benefitsSection: {
      padding: spacing.lg,
    },
    benefitsTitle: {
      fontSize: fontSize.xl,
      fontWeight: 'bold',
      color: colors.text,
      marginBottom: spacing.md,
    },
    benefitsList: {
      gap: spacing.md,
    },
    benefitItem: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    benefitIcon: {
      width: 48,
      height: 48,
      borderRadius: borderRadius.md,
      justifyContent: 'center',
      alignItems: 'center',
    },
    benefitContent: {
      marginLeft: spacing.md,
    },
    benefitTitle: {
      fontSize: fontSize.md,
      fontWeight: '600',
      color: colors.text,
    },
    benefitDesc: {
      fontSize: fontSize.sm,
      color: colors.textMuted,
    },
  });
