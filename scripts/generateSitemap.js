#!/usr/bin/env node

/**
 * Dynamic Sitemap Generator for Xtrapush Gadgets
 * Generates sitemap.xml with all static pages and product URLs
 * Run: node scripts/generateSitemap.js
 */

const fs = require('fs');
const path = require('path');
const http = require('http');

// Configuration
const BASE_URL = 'https://itsxtrapush.com';
const PUBLIC_DIR = path.join(__dirname, '../public');
const SITEMAP_PATH = path.join(PUBLIC_DIR, 'sitemap.xml');

// Category metadata matching seoUtils.js
const CATEGORIES = {
  'smartphone': { slug: 'smartphones', priority: 0.9 },
  'laptop': { slug: 'laptops', priority: 0.9 },
  'gaming': { slug: 'gaming', priority: 0.9 },
  'accessories': { slug: 'accessories', priority: 0.9 },
  'tablet': { slug: 'tablets', priority: 0.9 },
  'watch': { slug: 'smart-watches', priority: 0.9 }
};

// Static pages configuration
const STATIC_PAGES = [
  { loc: '/', changefreq: 'weekly', priority: 1.0 },
  { loc: '/gadgets', changefreq: 'daily', priority: 0.95 },
  { loc: '/smartphones', changefreq: 'daily', priority: 0.9 },
  { loc: '/laptops', changefreq: 'daily', priority: 0.9 },
  { loc: '/gaming', changefreq: 'daily', priority: 0.9 },
  { loc: '/accessories', changefreq: 'daily', priority: 0.9 },
  { loc: '/tablets', changefreq: 'daily', priority: 0.9 },
  { loc: '/smart-watches', changefreq: 'daily', priority: 0.9 },
  { loc: '/about', changefreq: 'monthly', priority: 0.8 },
  { loc: '/terms-and-conditions', changefreq: 'monthly', priority: 0.7 },
  { loc: '/find-us', changefreq: 'monthly', priority: 0.5 },
  { loc: '/installment-policy', changefreq: 'monthly', priority: 0.6 },
  { loc: '/contact', changefreq: 'monthly', priority: 0.6 },
  { loc: '/help', changefreq: 'monthly', priority: 0.5 },
  { loc: '/wishlist', changefreq: 'weekly', priority: 0.4 }
];

/**
 * Convert text to SEO-friendly slug (matching seoUtils.js logic)
 */
function generateSlug(text) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove special chars
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Remove duplicate hyphens
    .slice(0, 50); // Limit length
}

/**
 * Get fallback gadget data (for build-time generation)
 */
function getFallbackGadgets() {
  return [
    { id: 1, name: 'iPhone 16 Pro Max', brand: 'Apple', category: 'smartphone' },
    { id: 2, name: 'Samsung Galaxy S25 Ultra', brand: 'Samsung', category: 'smartphone' },
    { id: 3, name: 'Google Pixel 9 Pro', brand: 'Google', category: 'smartphone' },
    { id: 4, name: 'OnePlus 13', brand: 'OnePlus', category: 'smartphone' },
    { id: 5, name: 'iPhone 15 Pro', brand: 'Apple', category: 'smartphone' },
    { id: 10, name: 'MacBook M4 Pro', brand: 'Apple', category: 'laptop' },
    { id: 11, name: 'Dell XPS 15', brand: 'Dell', category: 'laptop' },
    { id: 12, name: 'HP Pavilion', brand: 'HP', category: 'laptop' },
    { id: 13, name: 'Lenovo ThinkPad', brand: 'Lenovo', category: 'laptop' },
    { id: 14, name: 'ASUS ROG Gaming Laptop', brand: 'ASUS', category: 'laptop' },
    { id: 15, name: 'PlayStation 5', brand: 'Sony', category: 'gaming' },
    { id: 16, name: 'Xbox Series X', brand: 'Microsoft', category: 'gaming' },
    { id: 17, name: 'Nintendo Switch OLED', brand: 'Nintendo', category: 'gaming' },
    { id: 18, name: 'Steam Deck', brand: 'Valve', category: 'gaming' },
    { id: 20, name: 'iPhone Case', brand: 'Generic', category: 'accessories' },
    { id: 21, name: 'USB-C Cable', brand: 'Generic', category: 'accessories' },
    { id: 22, name: 'Wireless Charger', brand: 'Generic', category: 'accessories' },
    { id: 25, name: 'iPad Pro', brand: 'Apple', category: 'tablet' },
    { id: 26, name: 'Samsung Galaxy Tab', brand: 'Samsung', category: 'tablet' },
    { id: 27, name: 'Microsoft Surface', brand: 'Microsoft', category: 'tablet' },
    { id: 30, name: 'Apple Watch Ultra', brand: 'Apple', category: 'watch' },
    { id: 31, name: 'Samsung Galaxy Watch', brand: 'Samsung', category: 'watch' },
    { id: 32, name: 'Fitbit Charge', brand: 'Fitbit', category: 'watch' }
  ];
}

/**
 * Generate product URLs
 */
function generateProductUrls(gadgets) {
  const urls = [];

  gadgets.forEach(gadget => {
    if (!gadget.id || !gadget.name || !gadget.category) {
      return; // Skip invalid entries silently
    }

    const categoryInfo = CATEGORIES[gadget.category];
    if (!categoryInfo) {
      return; // Skip unknown categories
    }

    // Generate slug matching seoUtils.js format: "productname-id"
    const slug = `${generateSlug(gadget.name)}-${gadget.id}`;
    const url = `/gadgets/${categoryInfo.slug}/${slug}`;

    urls.push({
      loc: url,
      changefreq: 'weekly',
      priority: 0.8,
      lastmod: new Date().toISOString().split('T')[0]
    });
  });

  return urls;
}

/**
 * Generate XML URL entry
 */
function generateUrlEntry(entry) {
  const lastmod = entry.lastmod || new Date().toISOString().split('T')[0];
  return `  <url>
    <loc>${BASE_URL}${entry.loc}</loc>
    <changefreq>${entry.changefreq}</changefreq>
    <priority>${entry.priority}</priority>
    <lastmod>${lastmod}</lastmod>
  </url>`;
}

/**
 * Generate complete sitemap XML
 */
function generateSitemapXml(allUrls) {
  const urlEntries = allUrls.map(generateUrlEntry).join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urlEntries}
</urlset>`;
}

/**
 * Main function - synchronous for build-time execution
 */
function generateSitemap() {
  try {
    console.log('🔄 Generating dynamic sitemap...');
    console.log(`📍 Base URL: ${BASE_URL}`);

    // Get gadgets (using fallback since we're in build phase)
    console.log('📦 Loading gadget data...');
    const gadgets = getFallbackGadgets();
    console.log(`✅ Loaded ${gadgets.length} gadgets`);

    // Generate product URLs
    console.log('🔗 Generating product URLs...');
    const productUrls = generateProductUrls(gadgets);
    console.log(`✅ Generated ${productUrls.length} product URLs`);

    // Combine static and product URLs
    const allUrls = [...STATIC_PAGES, ...productUrls];
    console.log(`📊 Total URLs in sitemap: ${allUrls.length}`);

    // Generate XML
    const sitemapXml = generateSitemapXml(allUrls);

    // Write to file
    fs.writeFileSync(SITEMAP_PATH, sitemapXml, 'utf-8');
    console.log(`✅ Sitemap written to: ${SITEMAP_PATH}`);

    // Also copy to build folder if it exists
    const buildPath = path.join(__dirname, '../build');
    if (fs.existsSync(buildPath)) {
      const buildSitemapPath = path.join(buildPath, 'sitemap.xml');
      fs.copyFileSync(SITEMAP_PATH, buildSitemapPath);
      console.log(`✅ Sitemap copied to build folder`);
    }

    console.log('\n✨ Sitemap generation complete!');
    console.log(`📈 Sitemap includes:`);
    console.log(`   • ${STATIC_PAGES.length} static pages`);
    console.log(`   • ${productUrls.length} product pages`);
    console.log(`   • ${allUrls.length} total URLs`);

    return true;
  } catch (error) {
    console.error('❌ Error generating sitemap:', error.message);
    process.exit(1);
  }
}

// Run immediately
generateSitemap();
