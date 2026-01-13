import React from 'react';
import { Helmet } from 'react-helmet-async';

/**
 * SEO Meta Component - Updates document head with comprehensive meta tags
 * Supports Open Graph, Twitter Cards, Schema.org structured data, and more
 */
export const SEOMeta = ({
  title = 'Xtrapush Gadgets - Buy Gadgets Online',
  description = 'Shop the latest gadgets with flexible installment plans. Premium smartphones, laptops, gaming devices and more.',
  keywords = 'gadgets, smartphones, laptops, gaming, online shopping, installments',
  canonical = null,
  ogTitle = null,
  ogDescription = null,
  ogImage = 'https://itsxtrapush.com/logo512.png',
  ogUrl = null,
  ogType = 'website',
  structuredData = null,
  robots = 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1',
  article = null,
  product = null
}) => {
  const finalOgTitle = ogTitle || title;
  const finalOgDescription = ogDescription || description;
  const finalOgUrl = ogUrl || canonical || 'https://itsxtrapush.com';

  return (
    <Helmet>
      {/* Primary Meta Tags */}
      <title>{title}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />
      <meta name="robots" content={robots} />
      <meta name="googlebot" content={robots} />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <meta httpEquiv="content-language" content="en" />
      
      {/* Canonical URL */}
      {canonical && <link rel="canonical" href={canonical} />}
      
      {/* Open Graph / Facebook */}
      <meta property="og:type" content={ogType} />
      <meta property="og:site_name" content="Xtrapush Gadgets" />
      <meta property="og:url" content={finalOgUrl} />
      <meta property="og:title" content={finalOgTitle} />
      <meta property="og:description" content={finalOgDescription} />
      <meta property="og:image" content={ogImage} />
      <meta property="og:image:secure_url" content={ogImage} />
      <meta property="og:image:alt" content={finalOgTitle} />
      <meta property="og:locale" content="en_GB" />
      <meta property="og:locale:alternate" content="en_US" />
      
      {/* Article specific */}
      {article && (
        <>
          <meta property="article:published_time" content={article.publishedTime} />
          <meta property="article:modified_time" content={article.modifiedTime} />
          <meta property="article:author" content={article.author || 'Xtrapush Gadgets'} />
        </>
      )}

      {/* Product specific */}
      {product && (
        <>
          <meta property="product:price:amount" content={product.price} />
          <meta property="product:price:currency" content={product.currency || 'GBP'} />
          <meta property="product:availability" content={product.availability || 'in stock'} />
          <meta property="product:condition" content={product.condition || 'new'} />
          <meta property="product:brand" content={product.brand || 'Xtrapush Gadgets'} />
        </>
      )}
      
      {/* Twitter Cards */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:site" content="@xtrapush" />
      <meta name="twitter:creator" content="@xtrapush" />
      <meta name="twitter:url" content={finalOgUrl} />
      <meta name="twitter:title" content={finalOgTitle} />
      <meta name="twitter:description" content={finalOgDescription} />
      <meta name="twitter:image" content={ogImage} />
      <meta name="twitter:image:alt" content={finalOgTitle} />
      
      {/* Structured Data (JSON-LD) */}
      {structuredData && (
        <script type="application/ld+json">
          {JSON.stringify(structuredData)}
        </script>
      )}
      
      {/* Additional SEO Tags */}
      <meta name="language" content="English" />
      <meta name="author" content="Xtrapush Gadgets" />
      <meta name="publisher" content="Xtrapush Gadgets" />
      <meta name="revisit-after" content="7 days" />
      <meta name="rating" content="General" />
      <meta name="distribution" content="global" />
      <link rel="alternate" hrefLang="en" href={canonical || 'https://itsxtrapush.com'} />
      <link rel="alternate" hrefLang="x-default" href={canonical || 'https://itsxtrapush.com'} />
      
      {/* Mobile App Links */}
      <meta name="apple-mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      <meta name="mobile-web-app-capable" content="yes" />
    </Helmet>
  );
};

export default SEOMeta;
