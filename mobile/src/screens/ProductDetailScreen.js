import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Image,
  Dimensions,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { api } from '../lib/api';
import { formatPrice, spacing, borderRadius, fontSize } from '../lib/theme';

const { width } = Dimensions.get('window');

const colorOptions = [
  { id: 'black', name: 'Black', hex: '#1f2937' },
  { id: 'white', name: 'White', hex: '#f9fafb' },
  { id: 'blue', name: 'Blue', hex: '#3b82f6' },
  { id: 'gold', name: 'Gold', hex: '#fbbf24' },
];

const storageOptions = ['128GB', '256GB', '512GB', '1TB'];

export default function ProductDetailScreen({ navigation, route }) {
  const { productId, product: initialProduct } = route.params;
  const { colors } = useTheme();
  const { addItem, currency } = useCart();
  const { toggleItem, isInWishlist } = useWishlist();
  
  const [product, setProduct] = useState(initialProduct || null);
  const [loading, setLoading] = useState(!initialProduct);
  const [selectedColor, setSelectedColor] = useState(colorOptions[0]);
  const [selectedStorage, setSelectedStorage] = useState(storageOptions[1]);
  const [quantity, setQuantity] = useState(1);
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  useEffect(() => {
    if (!initialProduct) {
      fetchProduct();
    }
  }, [productId]);

  const fetchProduct = async () => {
    try {
      const response = await api.getGadget(productId);
      setProduct(response.data.data);
    } catch (error) {
      console.error('Failed to fetch product:', error);
      Alert.alert('Error', 'Failed to load product details');
    } finally {
      setLoading(false);
    }
  };

  const price = currency === 'GBP' ? (product?.price_gbp || product?.price) : product?.price;
  const inStock = product?.effective_in_stock !== false && product?.stock_quantity > 0;
  const wishlisted = product ? isInWishlist(product.id) : false;

  const handleAddToCart = () => {
    addItem({
      id: product.id,
      variantId: `${product.id}-${selectedColor.id}-${selectedStorage}`,
      name: product.name,
      price: product.price,
      price_gbp: product.price_gbp,
      image: product.image_url,
      brand: product.brand,
      category: product.category,
      color: selectedColor.name,
      storage: selectedStorage,
      quantity,
    });
    Alert.alert('Added to Cart', `${product.name} has been added to your cart.`);
  };

  const handleBuyNow = () => {
    handleAddToCart();
    navigation.navigate('CartTab');
  };

  const handleToggleWishlist = () => {
    toggleItem({
      id: product.id,
      name: product.name,
      price: product.price,
      price_gbp: product.price_gbp,
      image: product.image_url,
      brand: product.brand,
    });
  };

  const styles = createStyles(colors);

  if (loading) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!product) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <Text style={styles.errorText}>Product not found</Text>
      </View>
    );
  }

  const images = [product.image_url, product.image_url, product.image_url]; // In real app, would have multiple images

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Image Gallery */}
        <View style={styles.imageGallery}>
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={(e) => {
              const index = Math.round(e.nativeEvent.contentOffset.x / width);
              setActiveImageIndex(index);
            }}
          >
            {images.map((img, index) => (
              <Image
                key={index}
                source={{ uri: img || 'https://via.placeholder.com/400' }}
                style={styles.mainImage}
                resizeMode="contain"
              />
            ))}
          </ScrollView>
          
          {/* Image Indicators */}
          <View style={styles.imageIndicators}>
            {images.map((_, index) => (
              <View
                key={index}
                style={[
                  styles.indicator,
                  activeImageIndex === index && styles.indicatorActive,
                ]}
              />
            ))}
          </View>

          {/* Wishlist Button */}
          <TouchableOpacity
            style={styles.wishlistButton}
            onPress={handleToggleWishlist}
          >
            <Ionicons
              name={wishlisted ? 'heart' : 'heart-outline'}
              size={24}
              color={wishlisted ? '#ef4444' : colors.text}
            />
          </TouchableOpacity>

          {/* Share Button */}
          <TouchableOpacity style={styles.shareButton}>
            <Ionicons name="share-outline" size={24} color={colors.text} />
          </TouchableOpacity>
        </View>

        {/* Product Info */}
        <View style={styles.productInfo}>
          {/* Brand & Name */}
          <Text style={styles.brand}>{product.brand}</Text>
          <Text style={styles.name}>{product.name}</Text>

          {/* Rating */}
          <View style={styles.ratingRow}>
            <View style={styles.stars}>
              {[1, 2, 3, 4, 5].map((star) => (
                <Ionicons
                  key={star}
                  name={star <= 4 ? 'star' : 'star-outline'}
                  size={16}
                  color="#fbbf24"
                />
              ))}
            </View>
            <Text style={styles.ratingText}>4.0 (128 reviews)</Text>
          </View>

          {/* Price */}
          <View style={styles.priceRow}>
            <Text style={styles.price}>{formatPrice(price * quantity, currency)}</Text>
            {product.monthly_price_gbp && (
              <Text style={styles.monthlyPrice}>
                or {formatPrice(currency === 'GBP' ? product.monthly_price_gbp : product.monthly_price, currency)}/mo
              </Text>
            )}
          </View>

          {/* Stock Status */}
          <View style={styles.stockRow}>
            <View style={[styles.stockDot, { backgroundColor: inStock ? '#22c55e' : '#ef4444' }]} />
            <Text style={[styles.stockText, { color: inStock ? '#22c55e' : '#ef4444' }]}>
              {inStock ? 'In Stock' : 'Out of Stock'}
            </Text>
          </View>

          {/* Color Selection */}
          <View style={styles.optionSection}>
            <Text style={styles.optionLabel}>Color: {selectedColor.name}</Text>
            <View style={styles.colorOptions}>
              {colorOptions.map((color) => (
                <TouchableOpacity
                  key={color.id}
                  style={[
                    styles.colorOption,
                    { backgroundColor: color.hex },
                    selectedColor.id === color.id && styles.colorOptionSelected,
                  ]}
                  onPress={() => setSelectedColor(color)}
                >
                  {selectedColor.id === color.id && (
                    <Ionicons
                      name="checkmark"
                      size={16}
                      color={color.id === 'white' ? '#000' : '#fff'}
                    />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Storage Selection */}
          {(product.category === 'smartphone' || product.category === 'laptop') && (
            <View style={styles.optionSection}>
              <Text style={styles.optionLabel}>Storage</Text>
              <View style={styles.storageOptions}>
                {storageOptions.map((storage) => (
                  <TouchableOpacity
                    key={storage}
                    style={[
                      styles.storageOption,
                      selectedStorage === storage && styles.storageOptionSelected,
                    ]}
                    onPress={() => setSelectedStorage(storage)}
                  >
                    <Text
                      style={[
                        styles.storageText,
                        selectedStorage === storage && styles.storageTextSelected,
                      ]}
                    >
                      {storage}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {/* Quantity */}
          <View style={styles.optionSection}>
            <Text style={styles.optionLabel}>Quantity</Text>
            <View style={styles.quantitySelector}>
              <TouchableOpacity
                style={styles.quantityButton}
                onPress={() => setQuantity(Math.max(1, quantity - 1))}
              >
                <Ionicons name="remove" size={20} color={colors.text} />
              </TouchableOpacity>
              <Text style={styles.quantityValue}>{quantity}</Text>
              <TouchableOpacity
                style={styles.quantityButton}
                onPress={() => setQuantity(quantity + 1)}
              >
                <Ionicons name="add" size={20} color={colors.text} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Description */}
          <View style={styles.descriptionSection}>
            <Text style={styles.sectionTitle}>Description</Text>
            <Text style={styles.description}>
              {product.description || `Experience the ${product.name} - a premium ${product.category} from ${product.brand}. Featuring cutting-edge technology and sleek design, this device delivers exceptional performance for all your needs.`}
            </Text>
          </View>

          {/* Features */}
          <View style={styles.featuresSection}>
            <Text style={styles.sectionTitle}>Key Features</Text>
            <View style={styles.featuresList}>
              <View style={styles.featureItem}>
                <Ionicons name="shield-checkmark" size={20} color={colors.primary} />
                <Text style={styles.featureText}>1 Year Warranty</Text>
              </View>
              <View style={styles.featureItem}>
                <Ionicons name="car" size={20} color={colors.primary} />
                <Text style={styles.featureText}>Free Delivery</Text>
              </View>
              <View style={styles.featureItem}>
                <Ionicons name="swap-horizontal" size={20} color={colors.primary} />
                <Text style={styles.featureText}>30-Day Returns</Text>
              </View>
              <View style={styles.featureItem}>
                <Ionicons name="card" size={20} color={colors.primary} />
                <Text style={styles.featureText}>Pay in Installments</Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Bottom Actions */}
      <View style={styles.bottomActions}>
        <TouchableOpacity
          style={[styles.addToCartButton, !inStock && styles.disabledButton]}
          onPress={handleAddToCart}
          disabled={!inStock}
        >
          <Ionicons name="cart-outline" size={20} color={colors.primary} />
          <Text style={styles.addToCartText}>Add to Cart</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.buyNowButton, !inStock && styles.disabledButton]}
          onPress={handleBuyNow}
          disabled={!inStock}
        >
          <Text style={styles.buyNowText}>{inStock ? 'Buy Now' : 'Out of Stock'}</Text>
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
    loadingContainer: {
      justifyContent: 'center',
      alignItems: 'center',
    },
    errorText: {
      fontSize: fontSize.lg,
      color: colors.textMuted,
    },
    imageGallery: {
      position: 'relative',
      backgroundColor: colors.surface,
    },
    mainImage: {
      width: width,
      height: width,
    },
    imageIndicators: {
      position: 'absolute',
      bottom: spacing.md,
      left: 0,
      right: 0,
      flexDirection: 'row',
      justifyContent: 'center',
      gap: spacing.xs,
    },
    indicator: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: colors.border,
    },
    indicatorActive: {
      backgroundColor: colors.primary,
      width: 24,
    },
    wishlistButton: {
      position: 'absolute',
      top: spacing.md,
      right: spacing.md,
      backgroundColor: colors.card,
      padding: spacing.sm,
      borderRadius: borderRadius.full,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    shareButton: {
      position: 'absolute',
      top: spacing.md,
      right: spacing.md + 48,
      backgroundColor: colors.card,
      padding: spacing.sm,
      borderRadius: borderRadius.full,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    productInfo: {
      padding: spacing.md,
    },
    brand: {
      fontSize: fontSize.sm,
      color: colors.textMuted,
      textTransform: 'uppercase',
      letterSpacing: 1,
    },
    name: {
      fontSize: fontSize.xxl,
      fontWeight: 'bold',
      color: colors.text,
      marginTop: spacing.xs,
    },
    ratingRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: spacing.sm,
      gap: spacing.sm,
    },
    stars: {
      flexDirection: 'row',
    },
    ratingText: {
      fontSize: fontSize.sm,
      color: colors.textMuted,
    },
    priceRow: {
      marginTop: spacing.md,
    },
    price: {
      fontSize: fontSize.xxxl,
      fontWeight: 'bold',
      color: colors.primary,
    },
    monthlyPrice: {
      fontSize: fontSize.sm,
      color: colors.textMuted,
      marginTop: spacing.xs,
    },
    stockRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: spacing.md,
      gap: spacing.xs,
    },
    stockDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
    },
    stockText: {
      fontSize: fontSize.sm,
      fontWeight: '500',
    },
    optionSection: {
      marginTop: spacing.lg,
    },
    optionLabel: {
      fontSize: fontSize.md,
      fontWeight: '600',
      color: colors.text,
      marginBottom: spacing.sm,
    },
    colorOptions: {
      flexDirection: 'row',
      gap: spacing.sm,
    },
    colorOption: {
      width: 40,
      height: 40,
      borderRadius: borderRadius.full,
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 2,
      borderColor: 'transparent',
    },
    colorOptionSelected: {
      borderColor: colors.primary,
    },
    storageOptions: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.sm,
    },
    storageOption: {
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      borderRadius: borderRadius.md,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
    },
    storageOptionSelected: {
      borderColor: colors.primary,
      backgroundColor: colors.primary + '15',
    },
    storageText: {
      fontSize: fontSize.sm,
      color: colors.text,
      fontWeight: '500',
    },
    storageTextSelected: {
      color: colors.primary,
    },
    quantitySelector: {
      flexDirection: 'row',
      alignItems: 'center',
      alignSelf: 'flex-start',
      backgroundColor: colors.surface,
      borderRadius: borderRadius.lg,
      overflow: 'hidden',
    },
    quantityButton: {
      padding: spacing.sm,
    },
    quantityValue: {
      fontSize: fontSize.lg,
      fontWeight: '600',
      color: colors.text,
      paddingHorizontal: spacing.lg,
    },
    descriptionSection: {
      marginTop: spacing.xl,
    },
    sectionTitle: {
      fontSize: fontSize.lg,
      fontWeight: 'bold',
      color: colors.text,
      marginBottom: spacing.sm,
    },
    description: {
      fontSize: fontSize.md,
      color: colors.textSecondary,
      lineHeight: 22,
    },
    featuresSection: {
      marginTop: spacing.xl,
      marginBottom: spacing.xxl,
    },
    featuresList: {
      gap: spacing.sm,
    },
    featureItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
    },
    featureText: {
      fontSize: fontSize.md,
      color: colors.text,
    },
    bottomActions: {
      flexDirection: 'row',
      padding: spacing.md,
      gap: spacing.sm,
      borderTopWidth: 1,
      borderTopColor: colors.border,
      backgroundColor: colors.card,
    },
    addToCartButton: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing.xs,
      paddingVertical: spacing.md,
      borderRadius: borderRadius.lg,
      borderWidth: 2,
      borderColor: colors.primary,
    },
    addToCartText: {
      fontSize: fontSize.md,
      fontWeight: '600',
      color: colors.primary,
    },
    buyNowButton: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: spacing.md,
      borderRadius: borderRadius.lg,
      backgroundColor: colors.primary,
    },
    buyNowText: {
      fontSize: fontSize.md,
      fontWeight: '600',
      color: '#fff',
    },
    disabledButton: {
      opacity: 0.5,
    },
  });
