import React, { createContext, useContext, useState, useEffect } from 'react';
import * as SecureStore from 'expo-secure-store';

const WishlistContext = createContext(null);

export function WishlistProvider({ children }) {
  const [items, setItems] = useState([]);

  useEffect(() => {
    loadWishlist();
  }, []);

  useEffect(() => {
    saveWishlist();
  }, [items]);

  const loadWishlist = async () => {
    try {
      const saved = await SecureStore.getItemAsync('wishlist');
      if (saved) {
        setItems(JSON.parse(saved));
      }
    } catch (e) {
      console.error('Failed to load wishlist:', e);
    }
  };

  const saveWishlist = async () => {
    try {
      await SecureStore.setItemAsync('wishlist', JSON.stringify(items));
    } catch (e) {
      console.error('Failed to save wishlist:', e);
    }
  };

  const addItem = (item) => {
    setItems((prev) => {
      if (prev.some((i) => i.id === item.id)) return prev;
      return [...prev, item];
    });
  };

  const removeItem = (id) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  const toggleItem = (item) => {
    if (items.some((i) => i.id === item.id)) {
      removeItem(item.id);
    } else {
      addItem(item);
    }
  };

  const isInWishlist = (id) => items.some((item) => item.id === id);
  const clearWishlist = () => setItems([]);

  const value = {
    items,
    itemCount: items.length,
    addItem,
    removeItem,
    toggleItem,
    isInWishlist,
    clearWishlist,
  };

  return <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>;
}

export function useWishlist() {
  const context = useContext(WishlistContext);
  if (!context) {
    throw new Error('useWishlist must be used within a WishlistProvider');
  }
  return context;
}
