import React, { createContext, useContext, useReducer, useEffect } from 'react';

const CartContext = createContext();

const cartReducer = (state, action) => {
  switch (action.type) {
    case 'ADD_TO_CART':
      // Check for existing item with same ID and pre-order status
      const existingItem = state.items.find(item => 
        item.id === action.payload.id && 
        item.isPreOrder === action.payload.isPreOrder
      );
      
      if (existingItem) {
        // For pre-order items, we don't limit by stock
        const stockLimit = action.payload.isPreOrder ? Infinity : (action.payload.number || 0);
        return {
          ...state,
          items: state.items.map(item =>
            item.id === action.payload.id && item.isPreOrder === action.payload.isPreOrder
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

    case 'UPDATE_ITEM_PRICE_GBP': {
      const { id, price_gbp } = action.payload;
      let numericPrice = price_gbp;
      if (typeof numericPrice === 'string') {
        numericPrice = parseFloat(numericPrice.replace(/[^0-9.-]+/g, ''));
      }
      numericPrice = Number.isFinite(numericPrice) ? numericPrice : 0;
      return {
        ...state,
        items: state.items.map(item =>
          item.id === id ? { ...item, price_gbp: numericPrice } : item
        )
      };
    }

    case 'UPDATE_ITEM_PRICE_MWK': {
      const { id, price_mwk } = action.payload;
      let numericPrice = price_mwk;
      if (typeof numericPrice === 'string') {
        numericPrice = parseFloat(numericPrice.replace(/[^0-9.-]+/g, ''));
      }
      numericPrice = Number.isFinite(numericPrice) ? numericPrice : 0;
      return {
        ...state,
        items: state.items.map(item =>
          item.id === id ? { ...item, price_mwk: numericPrice } : item
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
    console.log('💾 Saving cart to localStorage:', state.items);
    localStorage.setItem('cart', JSON.stringify(state.items));
  }, [state.items]);
  
  // Debug log cart changes
  useEffect(() => {
    console.log('🛒 Cart state updated:', {
      itemCount: state.items.length,
      items: state.items.map(item => ({
        id: item.id,
        title: item.title,
        quantity: item.quantity,
        price: item.price,
        isPreOrder: item.isPreOrder
      }))
    });
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

  const updateItemPriceGbp = (itemId, price_gbp) => {
    dispatch({ type: 'UPDATE_ITEM_PRICE_GBP', payload: { id: itemId, price_gbp } });
  };

  const updateItemPriceMwk = (itemId, price_mwk) => {
    dispatch({ type: 'UPDATE_ITEM_PRICE_MWK', payload: { id: itemId, price_mwk } });
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
      // Use currency-specific pricing if available
      let price = 0;
      
      // Priority order for price selection:
      // 1. GBP price (primary currency)
      // 2. MWK price (secondary currency)  
      // 3. General price field
      if (item.price_gbp && item.price_gbp > 0) {
        price = parseFloat(item.price_gbp);
      } else if (item.price_mwk && item.price_mwk > 0) {
        price = parseFloat(item.price_mwk);
      } else if (item.price && item.price > 0) {
        // Parse string prices or use numeric values
        if (typeof item.price === 'string') {
          price = parseFloat(item.price.replace(/[^0-9.-]+/g, ''));
        } else {
          price = parseFloat(item.price) || 0;
        }
      }
      
      // Ensure we have a valid price (fallback to 0 if all else fails)
      price = Number.isFinite(price) && price > 0 ? price : 0;
      
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
    updateItemPriceGbp,
    updateItemPriceMwk,
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