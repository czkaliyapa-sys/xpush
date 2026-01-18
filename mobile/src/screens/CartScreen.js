import React from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useCart } from '../context/CartContext';
import { formatPrice, spacing, borderRadius, fontSize } from '../lib/theme';

export default function CartScreen({ navigation }) {
  const { colors } = useTheme();
  const { items, currency, subtotal, itemCount, removeItem, updateQuantity, clearCart } = useCart();

  const deliveryFee = subtotal > (currency === 'GBP' ? 50 : 90000) ? 0 : (currency === 'GBP' ? 5 : 9000);
  const total = subtotal + deliveryFee;

  const handleRemoveItem = (id, variantId) => {
    Alert.alert(
      'Remove Item',
      'Are you sure you want to remove this item from your cart?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Remove', style: 'destructive', onPress: () => removeItem(id, variantId) },
      ]
    );
  };

  const handleCheckout = () => {
    navigation.navigate('Checkout');
  };

  const styles = createStyles(colors);

  const renderItem = ({ item }) => {
    const price = currency === 'GBP' ? (item.price_gbp || item.price) : item.price;
    
    return (
      <View style={styles.cartItem}>
        <Image
          source={{ uri: item.image || 'https://via.placeholder.com/100' }}
          style={styles.itemImage}
          resizeMode="contain"
        />
        <View style={styles.itemDetails}>
          <Text style={styles.itemBrand}>{item.brand}</Text>
          <Text style={styles.itemName} numberOfLines={2}>{item.name}</Text>
          {item.color && (
            <Text style={styles.itemVariant}>{item.color} • {item.storage}</Text>
          )}
          <Text style={styles.itemPrice}>{formatPrice(price, currency)}</Text>
        </View>
        <View style={styles.itemActions}>
          <TouchableOpacity
            style={styles.removeButton}
            onPress={() => handleRemoveItem(item.id, item.variantId)}
          >
            <Ionicons name="trash-outline" size={18} color="#ef4444" />
          </TouchableOpacity>
          <View style={styles.quantitySelector}>
            <TouchableOpacity
              style={styles.quantityButton}
              onPress={() => updateQuantity(item.id, item.variantId, item.quantity - 1)}
            >
              <Ionicons name="remove" size={16} color={colors.text} />
            </TouchableOpacity>
            <Text style={styles.quantityValue}>{item.quantity}</Text>
            <TouchableOpacity
              style={styles.quantityButton}
              onPress={() => updateQuantity(item.id, item.variantId, item.quantity + 1)}
            >
              <Ionicons name="add" size={16} color={colors.text} />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  if (items.length === 0) {
    return (
      <View style={[styles.container, styles.emptyContainer]}>
        <View style={styles.emptyIcon}>
          <Ionicons name="cart-outline" size={80} color={colors.textMuted} />
        </View>
        <Text style={styles.emptyTitle}>Your cart is empty</Text>
        <Text style={styles.emptyText}>Add some items to get started</Text>
        <TouchableOpacity
          style={styles.shopButton}
          onPress={() => navigation.navigate('ProductsTab')}
        >
          <Text style={styles.shopButtonText}>Start Shopping</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={items}
        renderItem={renderItem}
        keyExtractor={(item) => `${item.id}-${item.variantId || ''}`}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View style={styles.header}>
            <Text style={styles.headerTitle}>{itemCount} items in cart</Text>
            <TouchableOpacity onPress={clearCart}>
              <Text style={styles.clearText}>Clear All</Text>
            </TouchableOpacity>
          </View>
        }
      />

      {/* Summary */}
      <View style={styles.summary}>
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
        {deliveryFee > 0 && (
          <Text style={styles.freeDeliveryNote}>
            Add {formatPrice((currency === 'GBP' ? 50 : 90000) - subtotal, currency)} more for free delivery
          </Text>
        )}
        <View style={styles.divider} />
        <View style={styles.summaryRow}>
          <Text style={styles.totalLabel}>Total</Text>
          <Text style={styles.totalValue}>{formatPrice(total, currency)}</Text>
        </View>
        
        <TouchableOpacity style={styles.checkoutButton} onPress={handleCheckout}>
          <Text style={styles.checkoutButtonText}>Proceed to Checkout</Text>
          <Ionicons name="arrow-forward" size={20} color="#fff" />
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
    emptyContainer: {
      justifyContent: 'center',
      alignItems: 'center',
      padding: spacing.xl,
    },
    emptyIcon: {
      marginBottom: spacing.lg,
    },
    emptyTitle: {
      fontSize: fontSize.xl,
      fontWeight: 'bold',
      color: colors.text,
      marginBottom: spacing.xs,
    },
    emptyText: {
      fontSize: fontSize.md,
      color: colors.textMuted,
      marginBottom: spacing.lg,
    },
    shopButton: {
      backgroundColor: colors.primary,
      paddingHorizontal: spacing.xl,
      paddingVertical: spacing.md,
      borderRadius: borderRadius.lg,
    },
    shopButtonText: {
      color: '#fff',
      fontSize: fontSize.md,
      fontWeight: '600',
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
    },
    headerTitle: {
      fontSize: fontSize.md,
      fontWeight: '600',
      color: colors.text,
    },
    clearText: {
      fontSize: fontSize.sm,
      color: '#ef4444',
    },
    listContent: {
      paddingBottom: spacing.md,
    },
    cartItem: {
      flexDirection: 'row',
      backgroundColor: colors.card,
      marginHorizontal: spacing.md,
      marginBottom: spacing.sm,
      padding: spacing.md,
      borderRadius: borderRadius.lg,
    },
    itemImage: {
      width: 80,
      height: 80,
      borderRadius: borderRadius.md,
      backgroundColor: colors.surface,
    },
    itemDetails: {
      flex: 1,
      marginLeft: spacing.md,
    },
    itemBrand: {
      fontSize: fontSize.xs,
      color: colors.textMuted,
      textTransform: 'uppercase',
    },
    itemName: {
      fontSize: fontSize.md,
      fontWeight: '600',
      color: colors.text,
      marginVertical: 2,
    },
    itemVariant: {
      fontSize: fontSize.sm,
      color: colors.textMuted,
    },
    itemPrice: {
      fontSize: fontSize.md,
      fontWeight: 'bold',
      color: colors.primary,
      marginTop: spacing.xs,
    },
    itemActions: {
      alignItems: 'flex-end',
      justifyContent: 'space-between',
    },
    removeButton: {
      padding: spacing.xs,
    },
    quantitySelector: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.surface,
      borderRadius: borderRadius.md,
    },
    quantityButton: {
      padding: spacing.xs,
    },
    quantityValue: {
      fontSize: fontSize.md,
      fontWeight: '600',
      color: colors.text,
      paddingHorizontal: spacing.sm,
    },
    summary: {
      backgroundColor: colors.card,
      padding: spacing.md,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    summaryRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: spacing.sm,
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
    freeDeliveryNote: {
      fontSize: fontSize.sm,
      color: colors.primary,
      marginBottom: spacing.sm,
    },
    divider: {
      height: 1,
      backgroundColor: colors.border,
      marginVertical: spacing.sm,
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
    checkoutButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing.sm,
      backgroundColor: colors.primary,
      paddingVertical: spacing.md,
      borderRadius: borderRadius.lg,
      marginTop: spacing.md,
    },
    checkoutButtonText: {
      color: '#fff',
      fontSize: fontSize.md,
      fontWeight: '600',
    },
  });
