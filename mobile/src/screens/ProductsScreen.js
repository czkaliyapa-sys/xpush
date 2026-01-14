import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Modal,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useCart } from '../context/CartContext';
import { api } from '../lib/api';
import { formatPrice, spacing, borderRadius, fontSize } from '../lib/theme';
import ProductCard from '../components/ProductCard';

const categories = [
  { id: 'all', name: 'All' },
  { id: 'smartphone', name: 'Phones' },
  { id: 'laptop', name: 'Laptops' },
  { id: 'gaming', name: 'Gaming' },
  { id: 'accessory', name: 'Audio' },
  { id: 'wearable', name: 'Wearables' },
];

const sortOptions = [
  { id: 'newest', name: 'Newest First' },
  { id: 'price-low', name: 'Price: Low to High' },
  { id: 'price-high', name: 'Price: High to Low' },
  { id: 'popular', name: 'Most Popular' },
];

export default function ProductsScreen({ navigation, route }) {
  const { colors } = useTheme();
  const { currency } = useCart();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(route.params?.category || 'all');
  const [sortBy, setSortBy] = useState('newest');
  const [showFilters, setShowFilters] = useState(false);

  const fetchProducts = async () => {
    try {
      const params = { currency };
      if (selectedCategory !== 'all') {
        params.category = selectedCategory;
      }
      if (searchQuery) {
        params.q = searchQuery;
      }
      const response = await api.getGadgets(params);
      let data = response.data.data || [];

      // Client-side sorting
      if (sortBy === 'price-low') {
        data.sort((a, b) => {
          const priceA = currency === 'GBP' ? (a.price_gbp || a.price) : a.price;
          const priceB = currency === 'GBP' ? (b.price_gbp || b.price) : b.price;
          return priceA - priceB;
        });
      } else if (sortBy === 'price-high') {
        data.sort((a, b) => {
          const priceA = currency === 'GBP' ? (a.price_gbp || a.price) : a.price;
          const priceB = currency === 'GBP' ? (b.price_gbp || b.price) : b.price;
          return priceB - priceA;
        });
      }

      setProducts(data);
    } catch (error) {
      console.error('Failed to fetch products:', error);
      // Mock data
      setProducts([
        { id: 1, name: 'MacBook Pro M4', brand: 'Apple', price: 3500000, price_gbp: 1944.44, category: 'laptop', image_url: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=300', stock_quantity: 10 },
        { id: 2, name: 'Samsung S25 Ultra', brand: 'Samsung', price: 2250000, price_gbp: 1250, category: 'smartphone', image_url: 'https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?w=300', stock_quantity: 15 },
        { id: 3, name: 'iPhone 16 Pro Max', brand: 'Apple', price: 5000000, price_gbp: 2777.78, category: 'smartphone', image_url: 'https://images.unsplash.com/photo-1592899677977-9c10ca588bbd?w=300', stock_quantity: 8 },
        { id: 4, name: 'ASUS ROG Strix', brand: 'ASUS', price: 4500000, price_gbp: 2500, category: 'gaming', image_url: 'https://images.unsplash.com/photo-1593642702821-c8da6771f0c6?w=300', stock_quantity: 5 },
        { id: 5, name: 'iPhone 16', brand: 'Apple', price: 3500000, price_gbp: 1944.44, category: 'smartphone', image_url: 'https://images.unsplash.com/photo-1592899677977-9c10ca588bbd?w=300', stock_quantity: 12 },
        { id: 6, name: 'Dell XPS 15', brand: 'Dell', price: 2800000, price_gbp: 1555.56, category: 'laptop', image_url: 'https://images.unsplash.com/photo-1593642702821-c8da6771f0c6?w=300', stock_quantity: 7 },
      ]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [selectedCategory, sortBy, currency]);

  useEffect(() => {
    if (route.params?.category) {
      setSelectedCategory(route.params.category);
    }
  }, [route.params?.category]);

  const handleSearch = () => {
    setLoading(true);
    fetchProducts();
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchProducts();
  };

  const styles = createStyles(colors);

  const renderHeader = () => (
    <View>
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={20} color={colors.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search products..."
            placeholderTextColor={colors.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={handleSearch}
            returnKeyType="search"
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color={colors.textMuted} />
            </TouchableOpacity>
          ) : null}
        </View>
        <TouchableOpacity
          style={styles.filterButton}
          onPress={() => setShowFilters(true)}
        >
          <Ionicons name="options" size={20} color={colors.text} />
        </TouchableOpacity>
      </View>

      {/* Categories */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.categoriesContainer}
      >
        {categories.map((category) => (
          <TouchableOpacity
            key={category.id}
            style={[
              styles.categoryChip,
              selectedCategory === category.id && styles.categoryChipActive,
            ]}
            onPress={() => setSelectedCategory(category.id)}
          >
            <Text
              style={[
                styles.categoryChipText,
                selectedCategory === category.id && styles.categoryChipTextActive,
              ]}
            >
              {category.name}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Results count */}
      <View style={styles.resultsBar}>
        <Text style={styles.resultsText}>{products.length} products</Text>
        <TouchableOpacity
          style={styles.sortButton}
          onPress={() => setShowFilters(true)}
        >
          <Text style={styles.sortText}>Sort: {sortOptions.find(s => s.id === sortBy)?.name}</Text>
          <Ionicons name="chevron-down" size={16} color={colors.textMuted} />
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderProduct = ({ item, index }) => (
    <View style={[styles.productWrapper, index % 2 === 0 ? { paddingRight: spacing.xs } : { paddingLeft: spacing.xs }]}>
      <ProductCard
        product={item}
        onPress={() => navigation.navigate('ProductDetail', { productId: item.id, product: item })}
      />
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Shop</Text>
      </View>

      {loading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={products}
          renderItem={renderProduct}
          keyExtractor={(item) => item.id.toString()}
          numColumns={2}
          ListHeaderComponent={renderHeader}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshing={refreshing}
          onRefresh={onRefresh}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="cube-outline" size={64} color={colors.textMuted} />
              <Text style={styles.emptyTitle}>No products found</Text>
              <Text style={styles.emptyText}>Try adjusting your filters</Text>
            </View>
          }
        />
      )}

      {/* Filters Modal */}
      <Modal
        visible={showFilters}
        animationType="slide"
        transparent
        onRequestClose={() => setShowFilters(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Sort & Filter</Text>
              <TouchableOpacity onPress={() => setShowFilters(false)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <Text style={styles.filterLabel}>Sort By</Text>
            {sortOptions.map((option) => (
              <TouchableOpacity
                key={option.id}
                style={styles.filterOption}
                onPress={() => {
                  setSortBy(option.id);
                  setShowFilters(false);
                }}
              >
                <Text style={styles.filterOptionText}>{option.name}</Text>
                {sortBy === option.id && (
                  <Ionicons name="checkmark" size={20} color={colors.primary} />
                )}
              </TouchableOpacity>
            ))}

            <TouchableOpacity
              style={[styles.applyButton, { backgroundColor: colors.primary }]}
              onPress={() => setShowFilters(false)}
            >
              <Text style={styles.applyButtonText}>Apply</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const createStyles = (colors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.md,
    },
    headerTitle: {
      fontSize: fontSize.xxl,
      fontWeight: 'bold',
      color: colors.text,
    },
    searchContainer: {
      flexDirection: 'row',
      paddingHorizontal: spacing.md,
      marginBottom: spacing.md,
      gap: spacing.sm,
    },
    searchBar: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.surface,
      borderRadius: borderRadius.lg,
      paddingHorizontal: spacing.md,
      height: 44,
    },
    searchInput: {
      flex: 1,
      marginLeft: spacing.sm,
      fontSize: fontSize.md,
      color: colors.text,
    },
    filterButton: {
      width: 44,
      height: 44,
      backgroundColor: colors.surface,
      borderRadius: borderRadius.lg,
      justifyContent: 'center',
      alignItems: 'center',
    },
    categoriesContainer: {
      paddingHorizontal: spacing.md,
      paddingBottom: spacing.md,
      gap: spacing.sm,
    },
    categoryChip: {
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      borderRadius: borderRadius.full,
      backgroundColor: colors.surface,
    },
    categoryChipActive: {
      backgroundColor: colors.primary,
    },
    categoryChipText: {
      fontSize: fontSize.sm,
      color: colors.text,
      fontWeight: '500',
    },
    categoryChipTextActive: {
      color: '#fff',
    },
    resultsBar: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: spacing.md,
      paddingBottom: spacing.md,
    },
    resultsText: {
      fontSize: fontSize.sm,
      color: colors.textMuted,
    },
    sortButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
    },
    sortText: {
      fontSize: fontSize.sm,
      color: colors.textMuted,
    },
    listContent: {
      paddingHorizontal: spacing.md,
      paddingBottom: spacing.xl,
    },
    productWrapper: {
      flex: 1,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    emptyContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingTop: 100,
    },
    emptyTitle: {
      fontSize: fontSize.lg,
      fontWeight: '600',
      color: colors.text,
      marginTop: spacing.md,
    },
    emptyText: {
      fontSize: fontSize.md,
      color: colors.textMuted,
      marginTop: spacing.xs,
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.5)',
      justifyContent: 'flex-end',
    },
    modalContent: {
      borderTopLeftRadius: borderRadius.xl,
      borderTopRightRadius: borderRadius.xl,
      padding: spacing.lg,
      maxHeight: '70%',
    },
    modalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: spacing.lg,
    },
    modalTitle: {
      fontSize: fontSize.xl,
      fontWeight: 'bold',
      color: colors.text,
    },
    filterLabel: {
      fontSize: fontSize.sm,
      fontWeight: '600',
      color: colors.textMuted,
      marginBottom: spacing.sm,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    filterOption: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    filterOptionText: {
      fontSize: fontSize.md,
      color: colors.text,
    },
    applyButton: {
      marginTop: spacing.lg,
      paddingVertical: spacing.md,
      borderRadius: borderRadius.lg,
      alignItems: 'center',
    },
    applyButtonText: {
      color: '#fff',
      fontSize: fontSize.md,
      fontWeight: '600',
    },
  });
