import React, { createContext, useContext, useState, useEffect } from 'react';

const WishlistContext = createContext(null);

const WISHLIST_STORAGE_KEY = 'xtrapush_wishlist';

export function WishlistProvider({ children }) {
  const [items, setItems] = useState([]);
  
  useEffect(() => {
    const saved = localStorage.getItem(WISHLIST_STORAGE_KEY);
    if (saved) {
      try {
        setItems(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to load wishlist:', e);
      }
    }
  }, []);
  
  useEffect(() => {
    localStorage.setItem(WISHLIST_STORAGE_KEY, JSON.stringify(items));
  }, [items]);
  
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
