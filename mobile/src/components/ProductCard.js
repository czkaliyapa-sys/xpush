import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { formatPrice, spacing, borderRadius, fontSize } from '../lib/theme';

const { width } = Dimensions.get('window');

export default function ProductCard({ product, onPress, horizontal = false }) {
  const { colors } = useTheme();
  const { addItem, currency } = useCart();
  const { toggleItem, isInWishlist } = useWishlist();

  const price = currency === 'GBP' ? (product.price_gbp || product.price) : product.price;
  const inStock = product.effective_in_stock !== false && product.stock_quantity > 0;
  const wishlisted = isInWishlist(product.id);

  const handleAddToCart = (e) => {
    e.stopPropagation?.();
    addItem({
      id: product.id,
      name: product.name,
      price: product.price,
      price_gbp: product.price_gbp,
      image: product.image_url,
      brand: product.brand,
      category: product.category,
    });
  };

  const handleToggleWishlist = (e) => {
    e.stopPropagation?.();
    toggleItem({
      id: product.id,
      name: product.name,
      price: product.price,
      price_gbp: product.price_gbp,
      image: product.image_url,
      brand: product.brand,
    });
  };

  const styles = createStyles(colors, horizontal);

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View style={styles.imageContainer}>
        <Image
          source={{ uri: product.image_url || 'https://via.placeholder.com/200' }}
          style={styles.image}
          resizeMode="contain"
        />
        
        {/* Badges */}
        {!inStock && (
          <View style={styles.outOfStockBadge}>
            <Text style={styles.outOfStockText}>Out of Stock</Text>
          </View>
        )}
        
        {product.condition_status === 'refurbished' && (
          <View style={styles.conditionBadge}>
            <Text style={styles.conditionText}>Refurbished</Text>
          </View>
        )}

        {/* Wishlist Button */}
        <TouchableOpacity
          style={styles.wishlistButton}
          onPress={handleToggleWishlist}
        >
          <Ionicons
            name={wishlisted ? 'heart' : 'heart-outline'}
            size={20}
            color={wishlisted ? '#ef4444' : colors.textMuted}
          />
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <Text style={styles.brand}>{product.brand}</Text>
        <Text style={styles.name} numberOfLines={2}>{product.name}</Text>
        
        <View style={styles.ratingRow}>
          {[1, 2, 3, 4, 5].map((star) => (
            <Ionicons
              key={star}
              name={star <= 4 ? 'star' : 'star-outline'}
              size={12}
              color="#fbbf24"
            />
          ))}
          <Text style={styles.ratingText}>(4.0)</Text>
        </View>

        <View style={styles.priceRow}>
          <Text style={styles.price}>{formatPrice(price, currency)}</Text>
          {inStock && (
            <TouchableOpacity
              style={styles.addButton}
              onPress={handleAddToCart}
            >
              <Ionicons name="add" size={18} color="#fff" />
            </TouchableOpacity>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

const createStyles = (colors, horizontal) =>
  StyleSheet.create({
    container: {
      width: horizontal ? width * 0.4 : '48%',
      backgroundColor: colors.card,
      borderRadius: borderRadius.lg,
      overflow: 'hidden',
      marginBottom: horizontal ? 0 : spacing.md,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 8,
      elevation: 2,
    },
    imageContainer: {
      aspectRatio: 1,
      backgroundColor: colors.surface,
      position: 'relative',
    },
    image: {
      width: '100%',
      height: '100%',
    },
    outOfStockBadge: {
      position: 'absolute',
      top: spacing.sm,
      left: spacing.sm,
      backgroundColor: '#ef4444',
      paddingHorizontal: spacing.sm,
      paddingVertical: 2,
      borderRadius: borderRadius.sm,
    },
    outOfStockText: {
      color: '#fff',
      fontSize: fontSize.xs,
      fontWeight: '600',
    },
    conditionBadge: {
      position: 'absolute',
      top: spacing.sm,
      left: spacing.sm,
      backgroundColor: colors.secondary,
      paddingHorizontal: spacing.sm,
      paddingVertical: 2,
      borderRadius: borderRadius.sm,
    },
    conditionText: {
      color: '#fff',
      fontSize: fontSize.xs,
      fontWeight: '600',
    },
    wishlistButton: {
      position: 'absolute',
      top: spacing.sm,
      right: spacing.sm,
      backgroundColor: colors.card,
      padding: spacing.xs,
      borderRadius: borderRadius.full,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 2,
    },
    content: {
      padding: spacing.sm,
    },
    brand: {
      fontSize: fontSize.xs,
      color: colors.textMuted,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    name: {
      fontSize: fontSize.sm,
      fontWeight: '600',
      color: colors.text,
      marginVertical: spacing.xs,
    },
    ratingRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: spacing.xs,
    },
    ratingText: {
      fontSize: fontSize.xs,
      color: colors.textMuted,
      marginLeft: spacing.xs,
    },
    priceRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    price: {
      fontSize: fontSize.md,
      fontWeight: 'bold',
      color: colors.primary,
    },
    addButton: {
      backgroundColor: colors.primary,
      padding: spacing.xs,
      borderRadius: borderRadius.md,
    },
  });
