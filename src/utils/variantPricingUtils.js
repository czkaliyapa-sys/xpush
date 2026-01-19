/**
 * Variant Pricing Synchronization System
 * 
 * This system ensures consistent variant-based pricing across all components:
 * - GadgetsPage (listing view)
 * - Admin Dashboard (management)
 * - CartModal (shopping cart)
 * - InstallmentModal (finance options)
 * - GadgetDetail (product page)
 * - ItemCard3D (display cards)
 */

// Utility Functions for Variant Processing
export const variantPricingUtils = {
  /**
   * Process gadget data to include variant-derived pricing and stock
   * @param {Object} gadget - Raw gadget data from API
   * @param {Array} variants - Array of variant objects
   * @returns {Object} Enhanced gadget with variant pricing
   */
  processGadgetWithVariants: (gadget, variants = []) => {
    // Debug logging
    console.log('Processing gadget:', {
      id: gadget.id,
      name: gadget.name,
      is_pre_order: gadget.is_pre_order,
      stock_quantity: gadget.stock_quantity,
      has_variants: gadget.has_variants,
      variants_count: variants.length
    });
    
    // NEW LOGIC: Aggregate stock from ALL variants regardless of active status
    let totalVariantStock = 0;
    let hasAnyVariants = Array.isArray(variants) && variants.length > 0;
    
    // Sum ALL variant stock (both active and inactive variants)
    if (hasAnyVariants) {
      totalVariantStock = variants.reduce((sum, v) => 
        sum + parseInt(v.stock_quantity ?? 0, 10), 0
      );
    }
    
    // Calculate lowest variant price from ACTIVE variants only
    let lowestPrice = null;
    let lowestPriceGbp = null;
    let lowestPriceMwk = null;
    let hasActiveVariants = false;
    
    if (hasAnyVariants) {
      // Filter active variants for pricing calculations
      const activeVariants = variants.filter(v => (v.is_active ?? 1) === 1);
      
      if (activeVariants.length > 0) {
        hasActiveVariants = true;
        
        // Sort by price to get lowest from active variants
        const sortedByPrice = [...activeVariants].sort((a, b) => {
          const priceA = parseFloat(a.price || a.price_gbp || 0);
          const priceB = parseFloat(b.price || b.price_gbp || 0);
          return priceA - priceB;
        });
        
        const cheapestVariant = sortedByPrice[0];
        lowestPrice = cheapestVariant.price;
        lowestPriceGbp = cheapestVariant.price_gbp || cheapestVariant.priceGbp;
        lowestPriceMwk = cheapestVariant.price_mwk || cheapestVariant.priceMwk;
      }
    }
    
    // Determine final stock quantity - use variant stock if variants exist, otherwise main stock
    const finalStockQuantity = hasAnyVariants ? totalVariantStock : (gadget.stock_quantity || 0);
    
    // NEW LOGIC: Zero stock means pre-order only
    const isZeroStock = finalStockQuantity === 0;
    
    // Enhance gadget with variant-derived data
    const processedGadget = {
      ...gadget,
      // Override prices with lowest variant prices if available
      price: lowestPrice || gadget.price,
      price_gbp: lowestPriceGbp || gadget.price_gbp || gadget.priceGbp,
      price_mwk: lowestPriceMwk || gadget.price_mwk || gadget.priceMwk || gadget.price,
      // NEW: Use total variant stock as the definitive stock quantity
      stock_quantity: finalStockQuantity,
      // NEW: Force pre-order status for zero stock items
      is_pre_order: isZeroStock ? 1 : gadget.is_pre_order,
      // Preserve original data for reference
      original_price: gadget.price,
      original_price_gbp: gadget.price_gbp || gadget.priceGbp,
      original_stock: gadget.stock_quantity,
      // Metadata
      has_variants: hasAnyVariants,
      has_active_variants: hasActiveVariants,
      variant_count: variants.length,
      active_variant_count: variants.filter(v => 
        (v.is_active ?? 1) === 1 && parseInt(v.stock_quantity ?? 0, 10) > 0
      ).length,
      total_variant_stock: totalVariantStock,
      lowest_variant_price: lowestPrice,
      lowest_variant_price_gbp: lowestPriceGbp,
      lowest_variant_price_mwk: lowestPriceMwk
    };
    
    // Debug logging for zero stock items
    if (isZeroStock) {
      console.log('📦 Zero stock gadget (will show pre-order only):', {
        id: processedGadget.id,
        name: processedGadget.name,
        has_variants: processedGadget.has_variants,
        variant_count: processedGadget.variant_count,
        total_variant_stock: processedGadget.total_variant_stock,
        final_stock: processedGadget.stock_quantity,
        forced_pre_order: processedGadget.is_pre_order
      });
    }
    
    return processedGadget;
  },

  /**
   * Get formatted price for display based on user location
   * @param {Object} gadget - Processed gadget data
   * @param {boolean} isInMalawi - User location flag
   * @returns {string} Formatted price string
   */
  getDisplayPrice: (gadget, isInMalawi) => {
    const price = isInMalawi 
      ? (gadget.price_gbp ? gadget.price : gadget.original_price)
      : (gadget.price_gbp || gadget.lowest_variant_price_gbp || gadget.original_price_gbp);
    
    return price ? `MK ${(parseFloat(price)).toLocaleString()}` : 'Price N/A';
  },

  /**
   * Get stock status for display
   * @param {Object} gadget - Processed gadget data
   * @returns {Object} Stock information
   */
  getStockInfo: (gadget) => {
    const stock = parseInt(gadget.stock_quantity ?? 0, 10);
    const isActive = (gadget.is_active ?? 1) === 1;
    
    return {
      quantity: stock,
      inStock: stock > 0 && isActive,
      status: stock > 0 ? 'In Stock' : 'Out of Stock',
      availability: isActive ? (stock > 0 ? 'available' : 'unavailable') : 'inactive'
    };
  },

  /**
   * Find matching variant for selected attributes
   * @param {Array} variants - Array of variant objects
   * @param {string} color - Selected color
   * @param {string} storage - Selected storage
   * @param {string} condition - Selected condition
   * @returns {Object|null} Matching variant or null
   */
  findMatchingVariant: (variants, color, storage, condition) => {
    if (!Array.isArray(variants) || variants.length === 0) return null;
    
    return variants.find(v => 
      (!color || String(v.color).toLowerCase() === String(color).toLowerCase()) &&
      (!storage || String(v.storage).toLowerCase() === String(storage).toLowerCase()) &&
      (!condition || String(v.condition_status).toLowerCase() === String(condition).toLowerCase()) &&
      (v.is_active ?? 1) === 1 &&
      parseInt(v.stock_quantity ?? 0, 10) > 0
    ) || null;
  }
};

// Component-Specific Integration Helpers

/**
 * Admin Dashboard Integration
 * Handles variant-aware gadget updates and stock management
 */
export const adminDashboardHelpers = {
  /**
   * Prepare gadget data for admin form with variant awareness
   * @param {Object} gadget - Raw gadget data
   * @param {Array} variants - Associated variants
   * @returns {Object} Form-ready data
   */
  prepareGadgetFormData: (gadget, variants = []) => {
    const processed = variantPricingUtils.processGadgetWithVariants(gadget, variants);
    
    return {
      name: gadget.name || '',
      description: gadget.description || '',
      // Prices set to 0 as they're managed via variants (as per existing logic)
      price: 0,
      priceGbp: 0,
      monthlyPrice: 0,
      monthlyPriceGbp: 0,
      image: gadget.image || '',
      more_img: Array.isArray(gadget.more_img) ? gadget.more_img : [],
      category: gadget.category || '',
      brand: gadget.brand || '',
      model: gadget.model || '',
      condition: gadget.condition || 'new',
      specifications: gadget.specifications || {},
      inStock: processed.has_active_variants,
      stockQuantity: processed.total_variant_stock
    };
  },

  /**
   * Validate variant updates before saving
   * @param {Array} variants - Current variants
   * @returns {Object} Validation result
   */
  validateVariants: (variants) => {
    if (!Array.isArray(variants)) return { valid: false, error: 'Invalid variants data' };
    
    const activeVariants = variants.filter(v => (v.is_active ?? 1) === 1);
    
    if (activeVariants.length === 0) {
      return { 
        valid: false, 
        error: 'At least one active variant is required',
        warning: 'Gadget will be unavailable for purchase without active variants'
      };
    }
    
    // Check for duplicate combinations
    const combinations = new Set();
    const duplicates = [];
    
    activeVariants.forEach((v, index) => {
      const combo = `${v.color || ''}-${v.storage || ''}-${v.condition_status || ''}`;
      if (combinations.has(combo)) {
        duplicates.push({ index, variant: v });
      }
      combinations.add(combo);
    });
    
    if (duplicates.length > 0) {
      return {
        valid: false,
        error: `Duplicate variant combinations found`,
        duplicates: duplicates.map(d => ({
          storage: d.variant.storage,
          condition: d.variant.condition_status,
          color: d.variant.color
        }))
      };
    }
    
    return { valid: true };
  }
};

/**
 * Shopping Cart Integration
 * Ensures cart items use correct variant pricing
 */
export const cartIntegrationHelpers = {
  /**
   * Prepare cart item with variant pricing
   * @param {Object} item - Original cart item
   * @param {Object} gadget - Enhanced gadget data
   * @param {string} variantId - Selected variant ID
   * @returns {Object} Cart-ready item
   */
  prepareCartItem: (item, gadget, variantId) => {
    const variant = gadget.variants?.find(v => v.id === variantId);
    
    return {
      ...item,
      // Use variant-specific pricing if available
      price: variant ? variant.price : gadget.price,
      price_gbp: variant ? (variant.price_gbp || variant.priceGbp) : gadget.price_gbp,
      // Store variant reference
      variant_id: variantId,
      variant_data: variant ? {
        color: variant.color,
        storage: variant.storage,
        condition: variant.condition_status,
        sku: variant.sku
      } : null,
      // Enhanced metadata
      has_variant_pricing: !!variant,
      gadget_name: gadget.name,
      gadget_brand: gadget.brand,
      gadget_model: gadget.model
    };
  }
};

/**
 * Real-time Stock Synchronization
 * Keeps all components updated with latest stock/pricing
 */
export const stockSyncService = {
  subscribers: new Map(),
  
  /**
   * Subscribe to stock updates
   * @param {string} componentId - Unique component identifier
   * @param {Function} callback - Update handler
   */
  subscribe: function(componentId, callback) {
    this.subscribers.set(componentId, callback);
  },
  
  /**
   * Unsubscribe from stock updates
   * @param {string} componentId - Component identifier
   */
  unsubscribe: function(componentId) {
    this.subscribers.delete(componentId);
  },
  
  /**
   * Broadcast stock/pricing updates
   * @param {Object} updateData - Update information
   */
  broadcastUpdate: function(updateData) {
    this.subscribers.forEach(callback => {
      try {
        callback(updateData);
      } catch (error) {
        console.error('Error in stock update subscriber:', error);
      }
    });
  },
  
  /**
   * Process real-time variant update
   * @param {number} gadgetId - Gadget ID
   * @param {number} variantId - Variant ID
   * @param {Object} changes - Updated fields
   */
  processVariantUpdate: function(gadgetId, variantId, changes) {
    const updateData = {
      type: 'variant_update',
      gadgetId,
      variantId,
      changes,
      timestamp: Date.now()
    };
    
    this.broadcastUpdate(updateData);
  }
};

// Export for use in components
export default {
  variantPricingUtils,
  adminDashboardHelpers,
  cartIntegrationHelpers,
  stockSyncService
};