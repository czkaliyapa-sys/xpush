import * as React from 'react';

export interface WishlistContextValue {
  items: string[];
  add: (id: string | number) => void;
  remove: (id: string | number) => void;
  toggle: (id: string | number) => void;
  clear: () => void;
  isWished: (id: string | number) => boolean;
}

declare module '../contexts/WishlistContext.jsx' {
  export function useWishlist(): WishlistContextValue;
  export const WishlistProvider: React.FC<{ children?: React.ReactNode }>;
}