import React from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useWishlist } from '../context/WishlistContext';
import { useCart } from '../context/CartContext';
import { formatPrice, spacing, borderRadius, fontSize } from '../lib/theme';

export default function WishlistScreen({ navigation }) {
  const { colors } = useTheme();
  const { items, removeItem, clearWishlist } = useWishlist();
  const { addItem, currency } = useCart();

  const handleAddToCart = (item) => {
    addItem({
      id: item.id,
      name: item.name,
      price: item.price,
      price_gbp: item.price_gbp,
      image: item.image,
      brand: item.brand,
    });
    removeItem(item.id);
  };

  const styles = createStyles(colors);

  const renderItem = ({ item }) => {
    const price = currency === 'GBP' ? (item.price_gbp || item.price) : item.price;
    
    return (
      <View style={styles.wishlistItem}>
        <TouchableOpacity
          style={styles.itemContent}
          onPress={() => navigation.navigate('ProductDetail', { productId: item.id, product: item })}
        >
          <Image
            source={{ uri: item.image || 'https://via.placeholder.com/100' }}
            style={styles.itemImage}
            resizeMode="contain"
          />
          <View style={styles.itemDetails}>
            <Text style={styles.itemBrand}>{item.brand}</Text>
            <Text style={styles.itemName} numberOfLines={2}>{item.name}</Text>
            <Text style={styles.itemPrice}>{formatPrice(price, currency)}</Text>
          </View>
        </TouchableOpacity>
        <View style={styles.itemActions}>
          <TouchableOpacity
            style={styles.removeButton}
            onPress={() => removeItem(item.id)}
          >
            <Ionicons name="close" size={20} color={colors.textMuted} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.addToCartButton}
            onPress={() => handleAddToCart(item)}
          >
            <Ionicons name="cart-outline" size={18} color="#fff" />
            <Text style={styles.addToCartText}>Add</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  if (items.length === 0) {
    return (
      <View style={[styles.container, styles.emptyContainer]}>
        <View style={styles.emptyIcon}>
          <Ionicons name="heart-outline" size={80} color={colors.textMuted} />
        </View>
        <Text style={styles.emptyTitle}>Your wishlist is empty</Text>
        <Text style={styles.emptyText}>Save items you love to buy later</Text>
        <TouchableOpacity
          style={styles.shopButton}
          onPress={() => navigation.navigate('ProductsTab')}
        >
          <Text style={styles.shopButtonText}>Discover Products</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={items}
        renderItem={renderItem}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View style={styles.header}>
            <Text style={styles.headerTitle}>{items.length} saved items</Text>
            <TouchableOpacity onPress={clearWishlist}>
              <Text style={styles.clearText}>Clear All</Text>
            </TouchableOpacity>
          </View>
        }
      />
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
      paddingBottom: spacing.xl,
    },
    wishlistItem: {
      flexDirection: 'row',
      backgroundColor: colors.card,
      marginHorizontal: spacing.md,
      marginBottom: spacing.sm,
      padding: spacing.md,
      borderRadius: borderRadius.lg,
    },
    itemContent: {
      flexDirection: 'row',
      flex: 1,
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
      justifyContent: 'center',
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
    itemPrice: {
      fontSize: fontSize.md,
      fontWeight: 'bold',
      color: colors.primary,
      marginTop: spacing.xs,
    },
    itemActions: {
      justifyContent: 'space-between',
      alignItems: 'flex-end',
    },
    removeButton: {
      padding: spacing.xs,
    },
    addToCartButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
      backgroundColor: colors.primary,
      paddingVertical: spacing.xs,
      paddingHorizontal: spacing.sm,
      borderRadius: borderRadius.md,
    },
    addToCartText: {
      color: '#fff',
      fontSize: fontSize.sm,
      fontWeight: '500',
    },
  });
