import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { api } from '../lib/api';
import { formatPrice, spacing, borderRadius, fontSize } from '../lib/theme';

const statusColors = {
  pending: '#f59e0b',
  processing: '#3b82f6',
  shipped: '#8b5cf6',
  delivered: '#22c55e',
  cancelled: '#ef4444',
};

const statusIcons = {
  pending: 'time-outline',
  processing: 'cog-outline',
  shipped: 'car-outline',
  delivered: 'checkmark-circle-outline',
  cancelled: 'close-circle-outline',
};

export default function OrdersScreen({ navigation }) {
  const { colors } = useTheme();
  const { user } = useAuth();
  const { currency } = useCart();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      if (user?.uid) {
        const response = await api.getOrders(user.uid);
        setOrders(response.data.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch orders:', error);
      // Mock data for demo
      setOrders([
        {
          id: 'ORD-001',
          created_at: new Date().toISOString(),
          status: 'delivered',
          total: currency === 'GBP' ? 1249.99 : 2250000,
          items: [
            { name: 'Samsung S25 Ultra', quantity: 1 },
          ],
        },
        {
          id: 'ORD-002',
          created_at: new Date(Date.now() - 86400000 * 3).toISOString(),
          status: 'shipped',
          total: currency === 'GBP' ? 89.99 : 162000,
          items: [
            { name: 'AirPods Pro', quantity: 1 },
            { name: 'USB-C Cable', quantity: 2 },
          ],
        },
        {
          id: 'ORD-003',
          created_at: new Date(Date.now() - 86400000 * 7).toISOString(),
          status: 'processing',
          total: currency === 'GBP' ? 1944.44 : 3500000,
          items: [
            { name: 'MacBook Pro M4', quantity: 1 },
          ],
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const styles = createStyles(colors);

  const renderOrder = ({ item: order }) => {
    const statusColor = statusColors[order.status] || colors.textMuted;
    const statusIcon = statusIcons[order.status] || 'ellipse';
    
    return (
      <TouchableOpacity style={styles.orderCard}>
        <View style={styles.orderHeader}>
          <View>
            <Text style={styles.orderId}>Order #{order.id}</Text>
            <Text style={styles.orderDate}>
              {new Date(order.created_at).toLocaleDateString('en-GB', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
              })}
            </Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: statusColor + '20' }]}>
            <Ionicons name={statusIcon} size={14} color={statusColor} />
            <Text style={[styles.statusText, { color: statusColor }]}>
              {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
            </Text>
          </View>
        </View>
        
        <View style={styles.orderItems}>
          {order.items.slice(0, 2).map((item, index) => (
            <Text key={index} style={styles.itemText} numberOfLines={1}>
              {item.quantity}x {item.name}
            </Text>
          ))}
          {order.items.length > 2 && (
            <Text style={styles.moreItems}>+{order.items.length - 2} more items</Text>
          )}
        </View>
        
        <View style={styles.orderFooter}>
          <Text style={styles.orderTotal}>{formatPrice(order.total, currency)}</Text>
          <View style={styles.viewDetails}>
            <Text style={styles.viewDetailsText}>View Details</Text>
            <Ionicons name="chevron-forward" size={16} color={colors.primary} />
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (orders.length === 0) {
    return (
      <View style={[styles.container, styles.emptyContainer]}>
        <Ionicons name="receipt-outline" size={80} color={colors.textMuted} />
        <Text style={styles.emptyTitle}>No orders yet</Text>
        <Text style={styles.emptyText}>Your order history will appear here</Text>
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
        data={orders}
        renderItem={renderOrder}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
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
    loadingContainer: {
      justifyContent: 'center',
      alignItems: 'center',
    },
    emptyContainer: {
      justifyContent: 'center',
      alignItems: 'center',
      padding: spacing.xl,
    },
    emptyTitle: {
      fontSize: fontSize.xl,
      fontWeight: 'bold',
      color: colors.text,
      marginTop: spacing.md,
    },
    emptyText: {
      fontSize: fontSize.md,
      color: colors.textMuted,
      marginTop: spacing.xs,
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
    listContent: {
      padding: spacing.md,
    },
    orderCard: {
      backgroundColor: colors.card,
      borderRadius: borderRadius.lg,
      padding: spacing.md,
      marginBottom: spacing.md,
    },
    orderHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: spacing.sm,
    },
    orderId: {
      fontSize: fontSize.md,
      fontWeight: '600',
      color: colors.text,
    },
    orderDate: {
      fontSize: fontSize.sm,
      color: colors.textMuted,
      marginTop: 2,
    },
    statusBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.xs,
      borderRadius: borderRadius.full,
    },
    statusText: {
      fontSize: fontSize.sm,
      fontWeight: '500',
    },
    orderItems: {
      paddingVertical: spacing.sm,
      borderTopWidth: 1,
      borderBottomWidth: 1,
      borderColor: colors.border,
    },
    itemText: {
      fontSize: fontSize.sm,
      color: colors.textSecondary,
      marginBottom: 2,
    },
    moreItems: {
      fontSize: fontSize.sm,
      color: colors.textMuted,
      fontStyle: 'italic',
    },
    orderFooter: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: spacing.sm,
    },
    orderTotal: {
      fontSize: fontSize.lg,
      fontWeight: 'bold',
      color: colors.text,
    },
    viewDetails: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    viewDetailsText: {
      fontSize: fontSize.sm,
      color: colors.primary,
      fontWeight: '500',
    },
  });
