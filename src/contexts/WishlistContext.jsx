import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

// Provide a safe default so components can consume the hook even if the provider
// is temporarily missing (e.g., in isolated renders/tests). This prevents runtime
// errors related to undefined isWished/toggle functions.
/**
 * @type {{
 *  items: string[],
 *  add: (id: string | number) => void,
 *  remove: (id: string | number) => void,
 *  toggle: (id: string | number) => void,
 *  clear: () => void,
 *  isWished: (id: string | number) => boolean,
 * }}
 */
const defaultWishlistValue = {
  items: [],
  add: (id) => {},
  remove: (id) => {},
  toggle: (id) => {},
  clear: () => {},
  isWished: (id) => false,
};

const WishlistContext = createContext(defaultWishlistValue);

export const WishlistProvider = ({ children }) => {
  const [items, setItems] = useState(() => {
    try {
      const raw = localStorage.getItem('wishlist');
      const parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('wishlist', JSON.stringify(items));
    } catch {
      // ignore storage errors
    }
  }, [items]);

  const add = (id) => {
    setItems((prev) => {
      const strId = String(id);
      if (prev.includes(strId)) return prev;
      return [...prev, strId];
    });
  };

  const remove = (id) => {
    setItems((prev) => prev.filter((x) => x !== String(id)));
  };

  const toggle = (id) => {
    setItems((prev) => {
      const strId = String(id);
      if (prev.includes(strId)) {
        return prev.filter((x) => x !== strId);
      }
      return [...prev, strId];
    });
  };

  const clear = () => setItems([]);

  const isWished = (id) => items.includes(String(id));

  const value = useMemo(() => ({ items, add, remove, toggle, clear, isWished }), [items]);

  return (
    <WishlistContext.Provider value={value}>
      {children}
    </WishlistContext.Provider>
  );
};

export const useWishlist = () => {
  // With a default value set on the context, this will always return an object
  // with safe no-op methods, avoiding crashes when the provider isn't present.
  return useContext(WishlistContext);
};