/**
 * SEO Utilities for generating optimized meta titles, descriptions, and URLs
 */

// Category metadata for SEO
export const CATEGORY_META = {
  smartphone: {
    name: 'Smartphones',
    slug: 'smartphones',
    description: 'Discover the latest smartphones with cutting-edge technology, high-performance processors, and stunning displays.',
    keywords: 'smartphones, mobile phones, Android, iOS, iPhone, Samsung, latest phones'
  },
  laptop: {
    name: 'Laptops',
    slug: 'laptops',
    description: 'Premium laptops for work, gaming, and creative professionals. From ultrabooks to gaming rigs.',
    keywords: 'laptops, notebooks, MacBook, gaming laptops, business laptops, ultrabooks'
  },
  gaming: {
    name: 'Gaming',
    slug: 'gaming',
    description: 'High-performance gaming devices including gaming laptops, consoles, graphics cards, and gaming controllers.',
    keywords: 'gaming, gaming laptops, PS5, Xbox, graphics cards, gaming peripherals'
  },
  accessories: {
    name: 'Accessories',
    slug: 'accessories',
    description: 'Essential gadget accessories including chargers, cables, headphones, and protective gear.',
    keywords: 'gadget accessories, chargers, cables, headphones, protective cases'
  },
  tablet: {
    name: 'Tablets',
    slug: 'tablets',
    description: 'Latest tablets perfect for entertainment, productivity, and creative work.',
    keywords: 'tablets, iPad, Android tablets, digital drawing, productivity'
  },
  watch: {
    name: 'Smart Watches',
    slug: 'smart-watches',
    description: 'Advanced smartwatches with fitness tracking, health monitoring, and smartphone integration.',
    keywords: 'smartwatches, fitness trackers, Apple Watch, Wear OS, health monitoring'
  }
};

/**
 * Generate SEO-friendly slug from text
 */
export const generateSlug = (text) => {
  if (!text) return '';
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
    .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
};

/**
 * Generate meta title for category page
 */
export const generateCategoryTitle = (category, searchQuery = '') => {
  // Handle null/undefined category - show general gadgets page title
  if (!category) {
    if (searchQuery) {
      return `${searchQuery} | Search Results - Xtrapush Gadgets`;
    }
    return 'All Gadgets - Best Deals | Xtrapush Gadgets';
  }
  
  const categoryName = CATEGORY_META[category]?.name || category;
  if (searchQuery) {
    return `${searchQuery} ${categoryName} | Buy Online - Xtrapush Gadgets`;
  }
  return `${categoryName} - Best Deals | Xtrapush Gadgets`;
};

/**
 * Generate meta description for category page
 */
export const generateCategoryDescription = (category, searchQuery = '') => {
  const categoryMeta = CATEGORY_META[category];
  if (!categoryMeta) return 'Shop the best gadgets and tech products at Xtrapush Gadgets.';
  
  if (searchQuery) {
    return `Browse ${searchQuery} in our ${categoryMeta.name.toLowerCase()} collection. ${categoryMeta.description}`;
  }
  return categoryMeta.description;
};

/**
 * Generate meta title for gadget detail page
 */
export const generateGadgetTitle = (gadgetName, brand, category) => {
  const name = gadgetName || 'Gadget';
  const brandName = brand || '';
  const categoryName = category ? (CATEGORY_META[category]?.name || category) : 'Gadgets';
  
  if (brandName) {
    return `${name} by ${brandName} | Buy ${categoryName} Online - Xtrapush Gadgets`;
  }
  return `${name} | Buy ${categoryName} Online - Xtrapush Gadgets`;
};

/**
 * Generate meta description for gadget detail page
 */
export const generateGadgetDescription = (gadgetName, brand, description, price) => {
  const name = gadgetName || 'This gadget';
  const brandName = brand || '';
  const briefDescription = description ? description.substring(0, 150) : '';
  
  const brandPart = brandName ? ` by ${brandName}` : '';
  return `${name}${brandPart}. ${briefDescription} Shop now with flexible installment plans.`.trim();
};

/**
 * Generate SEO-friendly URL for gadget
 */
export const generateGadgetUrl = (gadgetId, gadgetName, category) => {
  const gadgetSlug = generateSlug(gadgetName) || 'item';
  const categorySlug = category ? (CATEGORY_META[category]?.slug || generateSlug(category)) : 'all';
  return `/gadgets/${categorySlug}/${gadgetSlug}-${gadgetId}`;
};

/**
 * Parse gadget URL to get ID
 */
export const parseGadgetUrl = (pathname) => {
  const parts = pathname.split('/');
  if (parts.length >= 4) {
    const lastPart = parts[parts.length - 1];
    const idMatch = lastPart.match(/-(\d+)$/);
    if (idMatch) {
      return idMatch[1];
    }
  }
  return null;
};

/**
 * Generate structured data (JSON-LD) for gadget
 */
export const generateGadgetStructuredData = (gadget) => {
  return {
    '@context': 'https://schema.org/',
    '@type': 'Product',
    'name': gadget.name,
    'description': gadget.description,
    'image': gadget.image,
    'brand': {
      '@type': 'Brand',
      'name': gadget.brand
    },
    'offers': {
      '@type': 'Offer',
      'url': `https://itsxtrapush.com/gadgets/${generateSlug(gadget.name)}`,
      'priceCurrency': 'MWK',
      'price': gadget.price,
      'availability': gadget.stock_quantity > 0 ? 'InStock' : 'OutOfStock'
    },
    'aggregateRating': gadget.rating ? {
      '@type': 'AggregateRating',
      'ratingValue': gadget.rating.average,
      'ratingCount': gadget.rating.count
    } : undefined
  };
};

/**
 * Generate breadcrumb structured data
 */
export const generateBreadcrumbData = (items) => {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    'itemListElement': items.map((item, index) => ({
      '@type': 'ListItem',
      'position': index + 1,
      'name': item.name,
      'item': `https://itsxtrapush.com${item.url}`
    }))
  };
};

/**
 * Get canonical URL
 */
export const getCanonicalUrl = (pathname) => {
  return `https://itsxtrapush.com${pathname}`;
};

/**
 * Common SEO keywords by category
 */
export const getSEOKeywords = (category, gadgetName = '') => {
  const categoryKeywords = CATEGORY_META[category]?.keywords || '';
  if (gadgetName) {
    return `${gadgetName}, ${categoryKeywords}, buy online, price, deals`;
  }
  return categoryKeywords;
};
