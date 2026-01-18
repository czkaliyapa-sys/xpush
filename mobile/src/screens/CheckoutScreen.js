import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';
import { formatPrice, spacing, borderRadius, fontSize } from '../lib/theme';

const paymentMethods = [
  { id: 'square', name: 'Card Payment', icon: 'card', description: 'Visa, Mastercard, Apple Pay' },
  { id: 'paychangu', name: 'PayChangu', icon: 'phone-portrait', description: 'Mobile Money (MWK)' },
];

export default function CheckoutScreen({ navigation }) {
  const { colors } = useTheme();
  const { items, currency, subtotal, clearCart } = useCart();
  const { user, isAuthenticated } = useAuth();
  
  const [loading, setLoading] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState('square');
  const [formData, setFormData] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    email: user?.email || '',
    phone: user?.phone || '',
    address: '',
    city: '',
    postalCode: '',
    country: currency === 'GBP' ? 'United Kingdom' : 'Malawi',
  });

  const deliveryFee = subtotal > (currency === 'GBP' ? 50 : 90000) ? 0 : (currency === 'GBP' ? 5 : 9000);
  const total = subtotal + deliveryFee;

  const updateField = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const validateForm = () => {
    const required = ['firstName', 'lastName', 'email', 'phone', 'address', 'city'];
    for (const field of required) {
      if (!formData[field].trim()) {
        Alert.alert('Missing Information', `Please enter your ${field.replace(/([A-Z])/g, ' $1').toLowerCase()}`);
        return false;
      }
    }
    if (!/\S+@\S+\.\S+/.test(formData.email)) {
      Alert.alert('Invalid Email', 'Please enter a valid email address');
      return false;
    }
    return true;
  };

  const handleCheckout = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      const orderItems = items.map(item => ({
        gadget_id: item.id,
        quantity: item.quantity,
        price: currency === 'GBP' ? (item.price_gbp || item.price) : item.price,
        variant: item.variantId ? {
          color: item.color,
          storage: item.storage,
        } : null,
      }));

      const checkoutData = {
        items: orderItems,
        total,
        currency,
        payment_method: selectedPayment,
        customer: {
          first_name: formData.firstName,
          last_name: formData.lastName,
          email: formData.email,
          phone: formData.phone,
        },
        shipping: {
          address: formData.address,
          city: formData.city,
          postal_code: formData.postalCode,
          country: formData.country,
        },
        user_uid: user?.uid,
      };

      const response = await api.createCheckout(checkoutData);
      
      if (response.data.checkout_url) {
        // Open payment page
        await Linking.openURL(response.data.checkout_url);
        clearCart();
        navigation.navigate('HomeTab');
        Alert.alert('Order Placed', 'Complete your payment in the browser to confirm your order.');
      } else {
        throw new Error('No checkout URL received');
      }
    } catch (error) {
      console.error('Checkout error:', error);
      Alert.alert(
        'Checkout Failed',
        'Unable to process your order. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setLoading(false);
    }
  };

  const styles = createStyles(colors);

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Shipping Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Shipping Information</Text>
          
          <View style={styles.row}>
            <View style={styles.halfInput}>
              <Text style={styles.label}>First Name *</Text>
              <TextInput
                style={styles.input}
                value={formData.firstName}
                onChangeText={(v) => updateField('firstName', v)}
                placeholder="John"
                placeholderTextColor={colors.textMuted}
              />
            </View>
            <View style={styles.halfInput}>
              <Text style={styles.label}>Last Name *</Text>
              <TextInput
                style={styles.input}
                value={formData.lastName}
                onChangeText={(v) => updateField('lastName', v)}
                placeholder="Doe"
                placeholderTextColor={colors.textMuted}
              />
            </View>
          </View>

          <Text style={styles.label}>Email *</Text>
          <TextInput
            style={styles.input}
            value={formData.email}
            onChangeText={(v) => updateField('email', v)}
            placeholder="john@example.com"
            placeholderTextColor={colors.textMuted}
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <Text style={styles.label}>Phone *</Text>
          <TextInput
            style={styles.input}
            value={formData.phone}
            onChangeText={(v) => updateField('phone', v)}
            placeholder="+44 7123 456789"
            placeholderTextColor={colors.textMuted}
            keyboardType="phone-pad"
          />

          <Text style={styles.label}>Address *</Text>
          <TextInput
            style={styles.input}
            value={formData.address}
            onChangeText={(v) => updateField('address', v)}
            placeholder="123 Main Street"
            placeholderTextColor={colors.textMuted}
          />

          <View style={styles.row}>
            <View style={styles.halfInput}>
              <Text style={styles.label}>City *</Text>
              <TextInput
                style={styles.input}
                value={formData.city}
                onChangeText={(v) => updateField('city', v)}
                placeholder="London"
                placeholderTextColor={colors.textMuted}
              />
            </View>
            <View style={styles.halfInput}>
              <Text style={styles.label}>Postal Code</Text>
              <TextInput
                style={styles.input}
                value={formData.postalCode}
                onChangeText={(v) => updateField('postalCode', v)}
                placeholder="SW1A 1AA"
                placeholderTextColor={colors.textMuted}
              />
            </View>
          </View>
        </View>

        {/* Payment Method */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Payment Method</Text>
          
          {paymentMethods.map((method) => (
            <TouchableOpacity
              key={method.id}
              style={[
                styles.paymentOption,
                selectedPayment === method.id && styles.paymentOptionSelected,
              ]}
              onPress={() => setSelectedPayment(method.id)}
            >
              <View style={styles.paymentIcon}>
                <Ionicons name={method.icon} size={24} color={colors.primary} />
              </View>
              <View style={styles.paymentInfo}>
                <Text style={styles.paymentName}>{method.name}</Text>
                <Text style={styles.paymentDesc}>{method.description}</Text>
              </View>
              <View style={[
                styles.radioOuter,
                selectedPayment === method.id && styles.radioOuterSelected,
              ]}>
                {selectedPayment === method.id && <View style={styles.radioInner} />}
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Order Summary */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Order Summary</Text>
          
          {items.map((item) => {
            const price = currency === 'GBP' ? (item.price_gbp || item.price) : item.price;
            return (
              <View key={`${item.id}-${item.variantId || ''}`} style={styles.summaryItem}>
                <Text style={styles.summaryItemName} numberOfLines={1}>
                  {item.name} x {item.quantity}
                </Text>
                <Text style={styles.summaryItemPrice}>
                  {formatPrice(price * item.quantity, currency)}
                </Text>
              </View>
            );
          })}
          
          <View style={styles.divider} />
          
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Subtotal</Text>
            <Text style={styles.summaryValue}>{formatPrice(subtotal, currency)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Delivery</Text>
            <Text style={[styles.summaryValue, deliveryFee === 0 && styles.freeText]}>
              {deliveryFee === 0 ? 'FREE' : formatPrice(deliveryFee, currency)}
            </Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.summaryRow}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>{formatPrice(total, currency)}</Text>
          </View>
        </View>

        <View style={{ height: spacing.xxl }} />
      </ScrollView>

      {/* Place Order Button */}
      <View style={styles.bottomSection}>
        <TouchableOpacity
          style={[styles.placeOrderButton, loading && styles.disabledButton]}
          onPress={handleCheckout}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Text style={styles.placeOrderText}>Place Order</Text>
              <Text style={styles.placeOrderPrice}>{formatPrice(total, currency)}</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const createStyles = (colors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    section: {
      backgroundColor: colors.card,
      marginHorizontal: spacing.md,
      marginTop: spacing.md,
      padding: spacing.md,
      borderRadius: borderRadius.lg,
    },
    sectionTitle: {
      fontSize: fontSize.lg,
      fontWeight: 'bold',
      color: colors.text,
      marginBottom: spacing.md,
    },
    row: {
      flexDirection: 'row',
      gap: spacing.sm,
    },
    halfInput: {
      flex: 1,
    },
    label: {
      fontSize: fontSize.sm,
      color: colors.textSecondary,
      marginBottom: spacing.xs,
      marginTop: spacing.sm,
    },
    input: {
      backgroundColor: colors.surface,
      borderRadius: borderRadius.md,
      padding: spacing.md,
      fontSize: fontSize.md,
      color: colors.text,
      borderWidth: 1,
      borderColor: colors.border,
    },
    paymentOption: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: spacing.md,
      borderRadius: borderRadius.md,
      borderWidth: 1,
      borderColor: colors.border,
      marginBottom: spacing.sm,
    },
    paymentOptionSelected: {
      borderColor: colors.primary,
      backgroundColor: colors.primary + '10',
    },
    paymentIcon: {
      width: 48,
      height: 48,
      borderRadius: borderRadius.md,
      backgroundColor: colors.surface,
      justifyContent: 'center',
      alignItems: 'center',
    },
    paymentInfo: {
      flex: 1,
      marginLeft: spacing.md,
    },
    paymentName: {
      fontSize: fontSize.md,
      fontWeight: '600',
      color: colors.text,
    },
    paymentDesc: {
      fontSize: fontSize.sm,
      color: colors.textMuted,
    },
    radioOuter: {
      width: 22,
      height: 22,
      borderRadius: 11,
      borderWidth: 2,
      borderColor: colors.border,
      justifyContent: 'center',
      alignItems: 'center',
    },
    radioOuterSelected: {
      borderColor: colors.primary,
    },
    radioInner: {
      width: 12,
      height: 12,
      borderRadius: 6,
      backgroundColor: colors.primary,
    },
    summaryItem: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: spacing.sm,
    },
    summaryItemName: {
      flex: 1,
      fontSize: fontSize.md,
      color: colors.textSecondary,
    },
    summaryItemPrice: {
      fontSize: fontSize.md,
      color: colors.text,
      fontWeight: '500',
    },
    divider: {
      height: 1,
      backgroundColor: colors.border,
      marginVertical: spacing.md,
    },
    summaryRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: spacing.xs,
    },
    summaryLabel: {
      fontSize: fontSize.md,
      color: colors.textSecondary,
    },
    summaryValue: {
      fontSize: fontSize.md,
      color: colors.text,
      fontWeight: '500',
    },
    freeText: {
      color: '#22c55e',
    },
    totalLabel: {
      fontSize: fontSize.lg,
      fontWeight: 'bold',
      color: colors.text,
    },
    totalValue: {
      fontSize: fontSize.xl,
      fontWeight: 'bold',
      color: colors.primary,
    },
    bottomSection: {
      padding: spacing.md,
      borderTopWidth: 1,
      borderTopColor: colors.border,
      backgroundColor: colors.card,
    },
    placeOrderButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: colors.primary,
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.lg,
      borderRadius: borderRadius.lg,
    },
    placeOrderText: {
      color: '#fff',
      fontSize: fontSize.lg,
      fontWeight: '600',
    },
    placeOrderPrice: {
      color: '#fff',
      fontSize: fontSize.lg,
      fontWeight: 'bold',
    },
    disabledButton: {
      opacity: 0.7,
    },
  });
