import React from 'react';
import { Container, Typography, Box } from '@mui/material';
import TradeInSection from './components/TradeInSection';
import SEOMeta from './components/SEOMeta';

const TradeInPage = () => {
  // Structured data for Trade-In Service
  const tradeInStructuredData = {
    "@context": "https://schema.org",
    "@type": "Service",
    "@id": "https://itsxtrapush.com/trade-in#service",
    "name": "Device Trade-In Service",
    "description": "Trade in your old smartphones, laptops, tablets, wearables, and gaming consoles for instant cash. We offer competitive prices, free pickup, and fast payment.",
    "provider": {
      "@type": "Organization",
      "@id": "https://itsxtrapush.com/#organization",
      "name": "Xtrapush Gadgets"
    },
    "areaServed": [
      {
        "@type": "Country",
        "name": "United Kingdom"
      },
      {
        "@type": "Country",
        "name": "Malawi"
      }
    ],
    "serviceType": "Electronics Trade-In",
    "offers": {
      "@type": "Offer",
      "availability": "https://schema.org/InStock",
      "priceSpecification": {
        "@type": "PriceSpecification",
        "priceCurrency": "GBP",
        "price": "0",
        "description": "Free trade-in service with competitive instant quotes"
      }
    },
    "hasOfferCatalog": {
      "@type": "OfferCatalog",
      "name": "Devices We Accept",
      "itemListElement": [
        {
          "@type": "ListItem",
          "position": 1,
          "item": {
            "@type": "Product",
            "name": "Smartphones",
            "description": "iPhone, Samsung, Google Pixel, OnePlus and more"
          }
        },
        {
          "@type": "ListItem",
          "position": 2,
          "item": {
            "@type": "Product",
            "name": "Laptops",
            "description": "MacBooks, Windows laptops, Chromebooks"
          }
        },
        {
          "@type": "ListItem",
          "position": 3,
          "item": {
            "@type": "Product",
            "name": "Tablets",
            "description": "iPads, Android tablets, Microsoft Surface"
          }
        },
        {
          "@type": "ListItem",
          "position": 4,
          "item": {
            "@type": "Product",
            "name": "Wearables",
            "description": "Smartwatches, fitness trackers"
          }
        },
        {
          "@type": "ListItem",
          "position": 5,
          "item": {
            "@type": "Product",
            "name": "Gaming Consoles",
            "description": "PlayStation, Xbox, Nintendo Switch"
          }
        }
      ]
    },
    "termsOfService": "https://itsxtrapush.com/terms",
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": "4.8",
      "reviewCount": "127"
    }
  };

  // Breadcrumb structured data
  const breadcrumbStructuredData = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "name": "Home",
        "item": "https://itsxtrapush.com/"
      },
      {
        "@type": "ListItem",
        "position": 2,
        "name": "Trade In",
        "item": "https://itsxtrapush.com/trade-in"
      }
    ]
  };

  return (
    <Box
      component="main"
      role="main"
      aria-label="Trade-in your device"
      sx={{
        minHeight: '100vh',
        background: '#051323',
        color: 'white',
        pt: { xs: 10, md: 12 },
        pb: 8
      }}
    >
      <SEOMeta
        title="Trade or Swap Your Device | Xtrapush Gadgets - Best Deal Guaranteed"
        description="Trade in for cash, swap for a new device, or do both! Get competitive quotes in minutes. Free pickup across UK and Malawi. Secure, fast, and hassle-free device trade-in and swap service."
        keywords="trade in device, swap device, sell phone, sell laptop, device buyback, device swap, cash for electronics, smartphone trade in, laptop trade in, tablet trade in, sell old phone, gadget trade in, iPhone trade in, Samsung trade in, MacBook trade in, UK trade in, Malawi trade in, device exchange"
        canonical="https://itsxtrapush.com/trade-in"
        ogTitle="Trade or Swap Your Device | Get Best Deal - Xtrapush Gadgets"
        ogDescription="Sell your old gadgets for cash or swap for new ones. Instant quotes, free pickup, competitive prices. Trade in smartphones, laptops, tablets & more."
        ogUrl="https://itsxtrapush.com/trade-in"
        ogImage="https://itsxtrapush.com/lastone.png"
        structuredData={[tradeInStructuredData, breadcrumbStructuredData]}
      />

      <Container maxWidth="lg">
        {/* Hero Section */}
        <Box component="header" sx={{ textAlign: 'center', mb: 8 }}>
          <Typography
            component="h1"
            variant="h2"
            sx={{
              fontWeight: 800,
              mb: 2,
              background: 'linear-gradient(135deg, #48CEDB 0%, #6DD5ED 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              fontSize: { xs: '2.5rem', md: '3.5rem' }
            }}
          >
            Trade Your Device for a Good Deal
          </Typography>
          <Typography
            component="p"
            variant="h5"
            sx={{
              color: 'rgba(255, 255, 255, 0.8)',
              maxWidth: 700,
              mx: 'auto',
              fontSize: { xs: '1.1rem', md: '1.3rem' },
              lineHeight: 1.6
            }}
          >
            Get instant cash, swap for a new device, or do both! Fast, secure, and hassle-free with free pickup.
          </Typography>
        </Box>

        {/* Trade-In Form */}
        <Container component="section" aria-label="Trade-in form" maxWidth="md">
          <TradeInSection />
        </Container>
      </Container>
    </Box>
  );
};

export default TradeInPage;