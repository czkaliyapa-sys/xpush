import React, { createContext, useContext, useReducer, useEffect } from 'react';

const CartContext = createContext();

const cartReducer = (state, action) => {
  switch (action.type) {
    case 'ADD_TO_CART':
      const existingItem = state.items.find(item => item.id === action.payload.id);
      if (existingItem) {
        const stockLimit = action.payload.number || 0;
        return {
          ...state,
          items: state.items.map(item =>
            item.id === action.payload.id
              ? { ...item, quantity: Math.min(item.quantity + 1, stockLimit) }
              : item
          )
        };
      }
      return {
        ...state,
        items: [...state.items, { ...action.payload, quantity: 1 }]
      };
    
    case 'REMOVE_FROM_CART':
      return {
        ...state,
        items: state.items.filter(item => item.id !== action.payload)
      };
    
    case 'UPDATE_QUANTITY':
      return {
        ...state,
        items: state.items.map(item =>
          item.id === action.payload.id
            ? { ...item, quantity: Math.max(0, Math.min(action.payload.quantity, item.number || 0)) }
            : item
        ).filter(item => item.quantity > 0)
      };

    case 'UPDATE_ITEM_STOCK': {
      const { id, stock } = action.payload;
      const liveStock = Math.max(0, Number.parseInt(stock, 10) || 0);
      return {
        ...state,
        items: state.items
          .map(item =>
            item.id === id
              ? { ...item, number: liveStock, quantity: Math.max(0, Math.min(item.quantity || 0, liveStock)) }
              : item
          )
          .filter(item => item.quantity > 0 || item.isPreOrder) // Keep pre-order items even with 0 quantity
      };
    }

    case 'UPDATE_ITEM_CONDITION': {
      const { id, condition } = action.payload;
      return {
        ...state,
        items: state.items.map(item =>
          item.id === id ? { ...item, condition } : item
        )
      };
    }
    
    case 'UPDATE_ITEM_STORAGE': {
      const { id, storage } = action.payload;
      return {
        ...state,
        items: state.items.map(item =>
          item.id === id ? { ...item, storage } : item
        )
      };
    }

    case 'UPDATE_ITEM_COLOR': {
      const { id, color } = action.payload;
      return {
        ...state,
        items: state.items.map(item =>
          item.id === id ? { ...item, color } : item
        )
      };
    }

    case 'UPDATE_ITEM_PRICE': {
      const { id, price } = action.payload;
      let numericPrice = price;
      if (typeof numericPrice === 'string') {
        numericPrice = parseFloat(numericPrice.replace(/[^0-9.-]+/g, ''));
      }
      numericPrice = Number.isFinite(numericPrice) ? numericPrice : 0;
      return {
        ...state,
        items: state.items.map(item =>
          item.id === id ? { ...item, price: numericPrice } : item
        )
      };
    }

    case 'UPDATE_ITEM_VARIANT_ID': {
      const { id, variantId } = action.payload;
      return {
        ...state,
        items: state.items.map(item =>
          item.id === id ? { ...item, variantId } : item
        )
      };
    }
    
    case 'CLEAR_CART':
      return {
        ...state,
        items: []
      };
    
    case 'LOAD_CART':
      return {
        ...state,
        items: action.payload || []
      };
    
    default:
      return state;
  }
};

const initialState = {
  items: [],
  isOpen: false
};

export const CartProvider = ({ children }) => {
  const [state, dispatch] = useReducer(cartReducer, initialState);

  // Load cart from localStorage on mount
  useEffect(() => {
    const savedCart = localStorage.getItem('cart');
    if (savedCart) {
      try {
        const parsedCart = JSON.parse(savedCart);
        dispatch({ type: 'LOAD_CART', payload: parsedCart });
      } catch (error) {
        console.error('Error loading cart from localStorage:', error);
      }
    }
  }, []);

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(state.items));
  }, [state.items]);

  const addToCart = (item) => {
    dispatch({ type: 'ADD_TO_CART', payload: item });
  };

  const removeFromCart = (itemId) => {
    dispatch({ type: 'REMOVE_FROM_CART', payload: itemId });
  };

  const updateQuantity = (itemId, quantity) => {
    dispatch({ type: 'UPDATE_QUANTITY', payload: { id: itemId, quantity } });
  };

  const updateItemStock = (itemId, stock) => {
    dispatch({ type: 'UPDATE_ITEM_STOCK', payload: { id: itemId, stock } });
  };

  const updateItemCondition = (itemId, condition) => {
    dispatch({ type: 'UPDATE_ITEM_CONDITION', payload: { id: itemId, condition } });
  };

  const updateItemStorage = (itemId, storage) => {
    dispatch({ type: 'UPDATE_ITEM_STORAGE', payload: { id: itemId, storage } });
  };

  const updateItemColor = (itemId, color) => {
    dispatch({ type: 'UPDATE_ITEM_COLOR', payload: { id: itemId, color } });
  };

  const updateItemPrice = (itemId, price) => {
    dispatch({ type: 'UPDATE_ITEM_PRICE', payload: { id: itemId, price } });
  };

  const updateItemVariantId = (itemId, variantId) => {
    dispatch({ type: 'UPDATE_ITEM_VARIANT_ID', payload: { id: itemId, variantId } });
  };

  const clearCart = () => {
    dispatch({ type: 'CLEAR_CART' });
  };

  const toggleCart = () => {
    dispatch({ type: 'TOGGLE_CART' });
  };

  const getCartTotal = () => {
    return state.items.reduce((total, item) => {
      let price;
      if (typeof item.price === 'string') {
        price = parseFloat(item.price.replace(/[^0-9.-]+/g, ''));
      } else {
        price = parseFloat(item.price) || 0;
      }
      // Pre-order items should count as quantity 1 even if stock sync set quantity to 0
      const effectiveQuantity = item.isPreOrder ? Math.max(1, item.quantity) : item.quantity;
      return total + (price * effectiveQuantity);
    }, 0);
  };

  const getCartItemsCount = () => {
    return state.items.reduce((total, item) => total + item.quantity, 0);
  };

  const value = {
    items: state.items,
    isOpen: state.isOpen,
    addToCart,
    removeFromCart,
    updateQuantity,
    updateItemStock,
    updateItemCondition,
    updateItemStorage,
    updateItemColor,
    updateItemPrice,
    updateItemVariantId,
    clearCart,
    toggleCart,
    getCartTotal,
    getCartItemsCount
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

export default CartContext;