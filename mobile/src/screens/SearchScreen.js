import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useCart } from '../context/CartContext';
import { api } from '../lib/api';
import { formatPrice, spacing, borderRadius, fontSize } from '../lib/theme';
import ProductCard from '../components/ProductCard';

const popularSearches = [
  'iPhone 16',
  'MacBook Pro',
  'Samsung S25',
  'AirPods',
  'Gaming Laptop',
  'Apple Watch',
];

export default function SearchScreen({ navigation }) {
  const { colors } = useTheme();
  const { currency } = useCart();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const handleSearch = async (searchQuery = query) => {
    if (!searchQuery.trim()) return;

    setLoading(true);
    setSearched(true);
    try {
      const response = await api.searchGadgets(searchQuery);
      setResults(response.data.data || []);
    } catch (error) {
      console.error('Search error:', error);
      // Mock results for demo
      const mockProducts = [
        { id: 1, name: 'MacBook Pro M4', brand: 'Apple', price: 3500000, price_gbp: 1944.44, category: 'laptop', image_url: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=300', stock_quantity: 10 },
        { id: 2, name: 'Samsung S25 Ultra', brand: 'Samsung', price: 2250000, price_gbp: 1250, category: 'smartphone', image_url: 'https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?w=300', stock_quantity: 15 },
        { id: 3, name: 'iPhone 16 Pro Max', brand: 'Apple', price: 5000000, price_gbp: 2777.78, category: 'smartphone', image_url: 'https://images.unsplash.com/photo-1592899677977-9c10ca588bbd?w=300', stock_quantity: 8 },
      ].filter(p => 
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.brand.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setResults(mockProducts);
    } finally {
      setLoading(false);
    }
  };

  const clearSearch = () => {
    setQuery('');
    setResults([]);
    setSearched(false);
  };

  const styles = createStyles(colors);

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
      {/* Search Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={20} color={colors.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search products..."
            placeholderTextColor={colors.textMuted}
            value={query}
            onChangeText={setQuery}
            onSubmitEditing={() => handleSearch()}
            returnKeyType="search"
            autoFocus
          />
          {query ? (
            <TouchableOpacity onPress={clearSearch}>
              <Ionicons name="close-circle" size={20} color={colors.textMuted} />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      {/* Content */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : searched ? (
        <FlatList
          data={results}
          renderItem={renderProduct}
          keyExtractor={(item) => item.id.toString()}
          numColumns={2}
          contentContainerStyle={styles.resultsContent}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            <Text style={styles.resultsCount}>
              {results.length} results for "{query}"
            </Text>
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="search-outline" size={64} color={colors.textMuted} />
              <Text style={styles.emptyTitle}>No results found</Text>
              <Text style={styles.emptyText}>Try a different search term</Text>
            </View>
          }
        />
      ) : (
        <View style={styles.suggestionsContainer}>
          <Text style={styles.suggestionsTitle}>Popular Searches</Text>
          <View style={styles.suggestionsList}>
            {popularSearches.map((term, index) => (
              <TouchableOpacity
                key={index}
                style={styles.suggestionChip}
                onPress={() => {
                  setQuery(term);
                  handleSearch(term);
                }}
              >
                <Ionicons name="trending-up" size={16} color={colors.textMuted} />
                <Text style={styles.suggestionText}>{term}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}
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
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    backButton: {
      padding: spacing.xs,
      marginRight: spacing.sm,
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
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    resultsContent: {
      padding: spacing.md,
    },
    resultsCount: {
      fontSize: fontSize.md,
      color: colors.textMuted,
      marginBottom: spacing.md,
    },
    productWrapper: {
      flex: 1,
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
    suggestionsContainer: {
      padding: spacing.md,
    },
    suggestionsTitle: {
      fontSize: fontSize.lg,
      fontWeight: 'bold',
      color: colors.text,
      marginBottom: spacing.md,
    },
    suggestionsList: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.sm,
    },
    suggestionChip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
      backgroundColor: colors.surface,
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.md,
      borderRadius: borderRadius.full,
    },
    suggestionText: {
      fontSize: fontSize.md,
      color: colors.text,
    },
  });
