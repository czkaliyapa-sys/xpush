import React, { createContext, useContext, useReducer, useEffect } from 'react';
import * as SecureStore from 'expo-secure-store';

const CartContext = createContext(null);

const initialState = {
  items: [],
  currency: 'GBP',
};

function cartReducer(state, action) {
  switch (action.type) {
    case 'ADD_ITEM': {
      const existingIndex = state.items.findIndex(
        (item) => item.id === action.payload.id && item.variantId === action.payload.variantId
      );
      if (existingIndex > -1) {
        const newItems = [...state.items];
        newItems[existingIndex].quantity += action.payload.quantity || 1;
        return { ...state, items: newItems };
      }
      return {
        ...state,
        items: [...state.items, { ...action.payload, quantity: action.payload.quantity || 1 }],
      };
    }
    case 'REMOVE_ITEM':
      return {
        ...state,
        items: state.items.filter(
          (item) => !(item.id === action.payload.id && item.variantId === action.payload.variantId)
        ),
      };
    case 'UPDATE_QUANTITY': {
      const newItems = state.items.map((item) => {
        if (item.id === action.payload.id && item.variantId === action.payload.variantId) {
          return { ...item, quantity: Math.max(1, action.payload.quantity) };
        }
        return item;
      });
      return { ...state, items: newItems };
    }
    case 'SET_CURRENCY':
      return { ...state, currency: action.payload };
    case 'CLEAR_CART':
      return { ...state, items: [] };
    case 'LOAD_CART':
      return { ...state, ...action.payload };
    default:
      return state;
  }
}

export function CartProvider({ children }) {
  const [state, dispatch] = useReducer(cartReducer, initialState);

  useEffect(() => {
    loadCart();
  }, []);

  useEffect(() => {
    saveCart();
  }, [state]);

  const loadCart = async () => {
    try {
      const saved = await SecureStore.getItemAsync('cart');
      if (saved) {
        dispatch({ type: 'LOAD_CART', payload: JSON.parse(saved) });
      }
    } catch (e) {
      console.error('Failed to load cart:', e);
    }
  };

  const saveCart = async () => {
    try {
      await SecureStore.setItemAsync('cart', JSON.stringify(state));
    } catch (e) {
      console.error('Failed to save cart:', e);
    }
  };

  const addItem = (item) => dispatch({ type: 'ADD_ITEM', payload: item });
  const removeItem = (id, variantId) => dispatch({ type: 'REMOVE_ITEM', payload: { id, variantId } });
  const updateQuantity = (id, variantId, quantity) =>
    dispatch({ type: 'UPDATE_QUANTITY', payload: { id, variantId, quantity } });
  const setCurrency = (currency) => dispatch({ type: 'SET_CURRENCY', payload: currency });
  const clearCart = () => dispatch({ type: 'CLEAR_CART' });

  const itemCount = state.items.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = state.items.reduce((sum, item) => {
    const price = state.currency === 'GBP' ? (item.price_gbp || item.price) : item.price;
    return sum + price * item.quantity;
  }, 0);

  const value = {
    items: state.items,
    currency: state.currency,
    itemCount,
    subtotal,
    addItem,
    removeItem,
    updateQuantity,
    setCurrency,
    clearCart,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
