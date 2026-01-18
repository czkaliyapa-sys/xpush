import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  Dimensions,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useCart } from '../context/CartContext';
import { api } from '../lib/api';
import { formatPrice, spacing, borderRadius, fontSize } from '../lib/theme';
import ProductCard from '../components/ProductCard';

const { width } = Dimensions.get('window');

const categories = [
  { id: 'smartphone', name: 'Phones', icon: 'phone-portrait-outline', color: '#3b82f6' },
  { id: 'laptop', name: 'Laptops', icon: 'laptop-outline', color: '#8b5cf6' },
  { id: 'gaming', name: 'Gaming', icon: 'game-controller-outline', color: '#22c55e' },
  { id: 'accessory', name: 'Audio', icon: 'headset-outline', color: '#f97316' },
  { id: 'wearable', name: 'Wearables', icon: 'watch-outline', color: '#ec4899' },
];

const features = [
  { icon: 'car-outline', title: 'Free Delivery', desc: 'On orders over £50' },
  { icon: 'shield-checkmark-outline', title: '1 Year Warranty', desc: 'Full coverage' },
  { icon: 'card-outline', title: 'Flexible Pay', desc: 'Installments' },
  { icon: 'swap-horizontal-outline', title: 'Trade-In', desc: 'Get value' },
];

export default function HomeScreen({ navigation }) {
  const { colors } = useTheme();
  const { currency } = useCart();
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchProducts = async () => {
    try {
      const response = await api.getGadgets({ limit: 8, currency });
      setFeaturedProducts(response.data.data || []);
    } catch (error) {
      console.error('Failed to fetch products:', error);
      // Mock data for demo
      setFeaturedProducts([
        { id: 1, name: 'MacBook Pro M4', brand: 'Apple', price: 3500000, price_gbp: 1944.44, category: 'laptop', image_url: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=300', stock_quantity: 10 },
        { id: 2, name: 'Samsung S25 Ultra', brand: 'Samsung', price: 2250000, price_gbp: 1250, category: 'smartphone', image_url: 'https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?w=300', stock_quantity: 15 },
        { id: 3, name: 'iPhone 16 Pro Max', brand: 'Apple', price: 5000000, price_gbp: 2777.78, category: 'smartphone', image_url: 'https://images.unsplash.com/photo-1592899677977-9c10ca588bbd?w=300', stock_quantity: 8 },
        { id: 4, name: 'ASUS ROG Strix', brand: 'ASUS', price: 4500000, price_gbp: 2500, category: 'gaming', image_url: 'https://images.unsplash.com/photo-1593642702821-c8da6771f0c6?w=300', stock_quantity: 5 },
      ]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [currency]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchProducts();
  }, []);

  const styles = createStyles(colors);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.logo}>Xtrapush</Text>
            <Text style={styles.tagline}>A little push to get you there</Text>
          </View>
          <View style={styles.headerActions}>
            <TouchableOpacity
              style={styles.iconButton}
              onPress={() => navigation.navigate('Search')}
            >
              <Ionicons name="search" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Hero Banner */}
        <View style={styles.heroBanner}>
          <View style={styles.heroContent}>
            <Text style={styles.heroLabel}>🚀 New Arrivals</Text>
            <Text style={styles.heroTitle}>Premium Gadgets{"\n"}Up to 30% Off</Text>
            <Text style={styles.heroSubtitle}>Trade-in & save even more</Text>
            <TouchableOpacity
              style={styles.heroButton}
              onPress={() => navigation.navigate('ProductsTab')}
            >
              <Text style={styles.heroButtonText}>Shop Now</Text>
              <Ionicons name="arrow-forward" size={18} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Features */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.featuresContainer}
        >
          {features.map((feature, index) => (
            <View key={index} style={styles.featureCard}>
              <View style={[styles.featureIcon, { backgroundColor: colors.primary + '15' }]}>
                <Ionicons name={feature.icon} size={20} color={colors.primary} />
              </View>
              <Text style={styles.featureTitle}>{feature.title}</Text>
              <Text style={styles.featureDesc}>{feature.desc}</Text>
            </View>
          ))}
        </ScrollView>

        {/* Categories */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Categories</Text>
            <TouchableOpacity onPress={() => navigation.navigate('ProductsTab')}>
              <Text style={styles.seeAll}>See All</Text>
            </TouchableOpacity>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoriesContainer}
          >
            {categories.map((category) => (
              <TouchableOpacity
                key={category.id}
                style={styles.categoryCard}
                onPress={() => navigation.navigate('ProductsTab', { category: category.id })}
              >
                <View style={[styles.categoryIcon, { backgroundColor: category.color + '20' }]}>
                  <Ionicons name={category.icon} size={28} color={category.color} />
                </View>
                <Text style={styles.categoryName}>{category.name}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Featured Products */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Featured Products</Text>
            <TouchableOpacity onPress={() => navigation.navigate('ProductsTab')}>
              <Text style={styles.seeAll}>See All</Text>
            </TouchableOpacity>
          </View>
          {loading ? (
            <View style={styles.loadingContainer}>
              {[1, 2].map((i) => (
                <View key={i} style={styles.skeletonCard} />
              ))}
            </View>
          ) : (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.productsContainer}
            >
              {featuredProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onPress={() => navigation.navigate('ProductDetail', { productId: product.id })}
                  horizontal
                />
              ))}
            </ScrollView>
          )}
        </View>

        {/* Subscription CTA */}
        <View style={styles.ctaCard}>
          <View style={styles.ctaContent}>
            <Text style={styles.ctaLabel}>Xtrapush Plus & Premium</Text>
            <Text style={styles.ctaTitle}>Unlock Exclusive Benefits</Text>
            <View style={styles.ctaBenefits}>
              <View style={styles.ctaBenefit}>
                <Ionicons name="checkmark-circle" size={16} color="#fff" />
                <Text style={styles.ctaBenefitText}>Free unlimited delivery</Text>
              </View>
              <View style={styles.ctaBenefit}>
                <Ionicons name="checkmark-circle" size={16} color="#fff" />
                <Text style={styles.ctaBenefitText}>1 year gadget insurance</Text>
              </View>
              <View style={styles.ctaBenefit}>
                <Ionicons name="checkmark-circle" size={16} color="#fff" />
                <Text style={styles.ctaBenefitText}>Member discounts</Text>
              </View>
            </View>
            <TouchableOpacity
              style={styles.ctaButton}
              onPress={() => navigation.navigate('Subscriptions')}
            >
              <Text style={styles.ctaButtonText}>View Plans</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Quick Links */}
        <View style={styles.quickLinks}>
          <TouchableOpacity
            style={styles.quickLink}
            onPress={() => navigation.navigate('TradeIn')}
          >
            <View style={[styles.quickLinkIcon, { backgroundColor: '#22c55e20' }]}>
              <Ionicons name="swap-horizontal" size={24} color="#22c55e" />
            </View>
            <View style={styles.quickLinkContent}>
              <Text style={styles.quickLinkTitle}>Trade-In</Text>
              <Text style={styles.quickLinkDesc}>Get value for your old device</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.quickLink}
            onPress={() => navigation.navigate('Subscriptions')}
          >
            <View style={[styles.quickLinkIcon, { backgroundColor: '#8b5cf620' }]}>
              <Ionicons name="diamond" size={24} color="#8b5cf6" />
            </View>
            <View style={styles.quickLinkContent}>
              <Text style={styles.quickLinkTitle}>Subscriptions</Text>
              <Text style={styles.quickLinkDesc}>Unlock premium benefits</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
          </TouchableOpacity>
        </View>

        <View style={{ height: spacing.xl }} />
      </ScrollView>
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
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.md,
    },
    logo: {
      fontSize: fontSize.xxl,
      fontWeight: 'bold',
      color: colors.primary,
    },
    tagline: {
      fontSize: fontSize.sm,
      color: colors.textMuted,
    },
    headerActions: {
      flexDirection: 'row',
      gap: spacing.sm,
    },
    iconButton: {
      padding: spacing.sm,
      borderRadius: borderRadius.full,
      backgroundColor: colors.surface,
    },
    heroBanner: {
      marginHorizontal: spacing.md,
      borderRadius: borderRadius.xl,
      backgroundColor: colors.primary,
      overflow: 'hidden',
      marginBottom: spacing.lg,
    },
    heroContent: {
      padding: spacing.lg,
    },
    heroLabel: {
      color: '#fff',
      fontSize: fontSize.sm,
      opacity: 0.9,
      marginBottom: spacing.xs,
    },
    heroTitle: {
      color: '#fff',
      fontSize: fontSize.xxl,
      fontWeight: 'bold',
      marginBottom: spacing.xs,
    },
    heroSubtitle: {
      color: '#fff',
      fontSize: fontSize.md,
      opacity: 0.9,
      marginBottom: spacing.md,
    },
    heroButton: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: 'rgba(255,255,255,0.2)',
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.md,
      borderRadius: borderRadius.lg,
      alignSelf: 'flex-start',
      gap: spacing.xs,
    },
    heroButtonText: {
      color: '#fff',
      fontWeight: '600',
    },
    featuresContainer: {
      paddingHorizontal: spacing.md,
      gap: spacing.sm,
      marginBottom: spacing.lg,
    },
    featureCard: {
      backgroundColor: colors.surface,
      padding: spacing.md,
      borderRadius: borderRadius.lg,
      width: 100,
      alignItems: 'center',
    },
    featureIcon: {
      padding: spacing.sm,
      borderRadius: borderRadius.md,
      marginBottom: spacing.xs,
    },
    featureTitle: {
      fontSize: fontSize.xs,
      fontWeight: '600',
      color: colors.text,
      textAlign: 'center',
    },
    featureDesc: {
      fontSize: fontSize.xs,
      color: colors.textMuted,
      textAlign: 'center',
    },
    section: {
      marginBottom: spacing.lg,
    },
    sectionHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: spacing.md,
      marginBottom: spacing.md,
    },
    sectionTitle: {
      fontSize: fontSize.lg,
      fontWeight: 'bold',
      color: colors.text,
    },
    seeAll: {
      fontSize: fontSize.md,
      color: colors.primary,
      fontWeight: '500',
    },
    categoriesContainer: {
      paddingHorizontal: spacing.md,
      gap: spacing.md,
    },
    categoryCard: {
      alignItems: 'center',
      width: 80,
    },
    categoryIcon: {
      width: 64,
      height: 64,
      borderRadius: borderRadius.xl,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: spacing.xs,
    },
    categoryName: {
      fontSize: fontSize.sm,
      color: colors.text,
      fontWeight: '500',
    },
    productsContainer: {
      paddingHorizontal: spacing.md,
      gap: spacing.md,
    },
    loadingContainer: {
      flexDirection: 'row',
      paddingHorizontal: spacing.md,
      gap: spacing.md,
    },
    skeletonCard: {
      width: width * 0.4,
      height: 200,
      backgroundColor: colors.surface,
      borderRadius: borderRadius.lg,
    },
    ctaCard: {
      marginHorizontal: spacing.md,
      borderRadius: borderRadius.xl,
      overflow: 'hidden',
      marginBottom: spacing.lg,
      backgroundColor: '#0891b2',
    },
    ctaContent: {
      padding: spacing.lg,
    },
    ctaLabel: {
      color: 'rgba(255,255,255,0.8)',
      fontSize: fontSize.sm,
      marginBottom: spacing.xs,
    },
    ctaTitle: {
      color: '#fff',
      fontSize: fontSize.xl,
      fontWeight: 'bold',
      marginBottom: spacing.md,
    },
    ctaBenefits: {
      marginBottom: spacing.md,
    },
    ctaBenefit: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      marginBottom: spacing.xs,
    },
    ctaBenefitText: {
      color: '#fff',
      fontSize: fontSize.md,
    },
    ctaButton: {
      backgroundColor: '#fff',
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.lg,
      borderRadius: borderRadius.lg,
      alignSelf: 'flex-start',
    },
    ctaButtonText: {
      color: '#0891b2',
      fontWeight: '600',
    },
    quickLinks: {
      paddingHorizontal: spacing.md,
      gap: spacing.sm,
    },
    quickLink: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.surface,
      padding: spacing.md,
      borderRadius: borderRadius.lg,
    },
    quickLinkIcon: {
      width: 48,
      height: 48,
      borderRadius: borderRadius.md,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: spacing.md,
    },
    quickLinkContent: {
      flex: 1,
    },
    quickLinkTitle: {
      fontSize: fontSize.md,
      fontWeight: '600',
      color: colors.text,
    },
    quickLinkDesc: {
      fontSize: fontSize.sm,
      color: colors.textMuted,
    },
  });
