import React from 'react';
import { Typography, Box, Card, CardContent, Grid, Chip } from '@mui/material';
import { useLocation as useRouterLocation } from 'react-router-dom';
import { useLocation } from './contexts/LocationContext';
import StorefrontIcon from '@mui/icons-material/Storefront';
import VerifiedIcon from '@mui/icons-material/Verified';
import PublicIcon from '@mui/icons-material/Public';
import HandshakeIcon from '@mui/icons-material/Handshake';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import BusinessIcon from '@mui/icons-material/Business';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import EmailIcon from '@mui/icons-material/Email';
import PhoneIcon from '@mui/icons-material/Phone';
import GavelIcon from '@mui/icons-material/Gavel';
import SEOMeta from './components/SEOMeta.jsx';
import { getCanonicalUrl } from './utils/seoUtils.js';
import styles from './style';

const AboutPage = () => {
  const routerLocation = useRouterLocation();
  const { isMalawi } = useLocation();

  // Location-specific business information
  const businessInfo = isMalawi ? {
    country: 'Malawi',
    flag: '🇲🇼',
    registration: {
      name: 'Xtrapush Gadgets',
      type: 'Registered Business',
      registrationNumber: 'BRN: BRN-PKSDGB7',
      tinNumber: 'TIN: 70785674',
      registeredAddress: 'Area 47, Sector 4, Lilongwe, Malawi',
      email: 'kelvin@itsxtrapush.com',
      phone: '+265 99438 5706',
      regulator: 'Malawi Revenue Authority (MRA)',
      currency: 'MWK (Malawian Kwacha)',
      paymentProvider: 'PayChangu'
    },
    description: 'Xtrapush Gadgets operates in Malawi under the regulations of the Malawi Revenue Authority, providing quality technology products with secure local payment options.',
    highlights: [
      {
        icon: <VerifiedIcon sx={{ fontSize: 40, color: '#48cedb' }} />, 
        title: "MRA Registered",
        description: "Compliant with Malawi tax regulations"
      },
      {
        icon: <PublicIcon sx={{ fontSize: 40, color: '#48cedb' }} />, 
        title: "LLW & BT Based",
        description: "Serving customers nationwide"
      },
      {
        icon: <HandshakeIcon sx={{ fontSize: 40, color: '#48cedb' }} />, 
        title: "Card & Mobile Money",
        description: "PayChangu payments accepted"
      }
    ]
  } : {
    country: 'United Kingdom',
    flag: '🇬🇧',
    registration: {
      name: 'Xtrapush Gadgets Ltd',
      type: 'Private Limited Company',
      registrationNumber: 'Company No: 16938444',
      registeredAddress: 'London, United Kingdom',
      email: 'conrad@itsxtrapush.com',
      phone: '+44 7506369609',
      regulator: 'Companies House',
      vatNumber: 'GB 123 4567 89',
      currency: 'GBP (British Pounds)',
      paymentProvider: 'Square',
      ebayStore: 'eBay UK'
    },
    description: 'Xtrapush Gadgets Ltd is registered in the United Kingdom and also sells on eBay UK. We provide quality technology products with secure card payments via Square.',
    highlights: [
      {
        icon: <VerifiedIcon sx={{ fontSize: 40, color: '#48cedb' }} />, 
        title: "Companies House",
        description: "UK registered company"
      },
      {
        icon: <PublicIcon sx={{ fontSize: 40, color: '#48cedb' }} />, 
        title: "Also on eBay UK",
        description: "Verified eBay seller"
      },
      {
        icon: <HandshakeIcon sx={{ fontSize: 40, color: '#48cedb' }} />, 
        title: "Card Payments",
        description: "Secure Square checkout"
      }
    ]
  };

  return (
    <>
      <SEOMeta
        title="About Us - Xtrapush Gadgets | Technology Retailer UK & Malawi"
        description="Learn about Xtrapush Gadgets - a trusted technology retailer in UK and Malawi. We provide quality smartphones, laptops, tablets, and accessories with warranty, finance options, and excellent customer service. Also selling on eBay UK."
        keywords="about xtrapush, xtrapush gadgets, technology retailer, electronics store, smartphone seller, gadget store, ebay uk seller, uk company, malawi business, tech retail"
        canonical={getCanonicalUrl(routerLocation.pathname)}
        ogTitle="About Xtrapush Gadgets - Your Trusted Tech Retailer"
        ogDescription="Xtrapush Gadgets provides quality technology products in UK and Malawi with warranty, flexible finance, and trade-in options."
        ogUrl={getCanonicalUrl(routerLocation.pathname)}
        structuredData={{
          "@context": "https://schema.org",
          "@type": "AboutPage",
          "@id": "https://itsxtrapush.com/about#webpage",
          "url": "https://itsxtrapush.com/about",
          "name": "About Xtrapush Gadgets",
          "description": "Learn about Xtrapush Gadgets - your trusted technology retailer.",
          "mainEntity": {
            "@type": "Organization",
            "@id": "https://itsxtrapush.com/#organization"
          },
          "breadcrumb": {
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
                "name": "About",
                "item": "https://itsxtrapush.com/about"
              }
            ]
          }
        }}
      />
      <div className="deep bg-primary w-full overflow-hidden min-h-screen">
        <div className={`${styles.paddingX} ${styles.flexCenter}`}>
          <div className={`${styles.boxWidth}`}>
            
            <section className="flex flex-col items-center text-center px-4 py-8 sm:p-12">
              {/* Hero Section */}
              <Typography 
                variant="h3" 
                component="h1" 
                sx={{ 
                  color: 'white', 
                  textAlign: 'center', 
                  mb: 2,
                  fontWeight: 'bold',
                  fontFamily: 'Poppins, sans-serif',
                  fontSize: { xs: '2rem', sm: '2.5rem', md: '3.5rem' }
                }}
              >
                About <span className="text-gradient">Xtrapush Gadgets</span>
              </Typography>
              
              <Typography 
                variant="h6" 
                sx={{ 
                  color: 'rgba(255, 255, 255, 0.8)', 
                  textAlign: 'center', 
                  mb: 4,
                  maxWidth: '600px',
                  fontFamily: 'Poppins, sans-serif',
                  fontSize: { xs: '1rem', sm: '1.1rem' }
                }}
              >
                A little push to get you there — making quality tech accessible and reliable
              </Typography>

              {/* Highlights Grid */}
              <Grid container spacing={3} sx={{ mb: 6, maxWidth: '1000px' }}>
                {businessInfo.highlights.map((item, index) => (
                  <Grid item xs={12} sm={6} md={3} key={index}>
                    <Card 
                      sx={{ 
                        bgcolor: 'rgba(5, 19, 35, 0.8)',
                        border: '1px solid rgba(72, 206, 219, 0.2)',
                        borderRadius: 3,
                        height: '100%',
                        transition: 'transform 0.3s, border-color 0.3s',
                        '&:hover': {
                          transform: 'translateY(-4px)',
                          borderColor: 'rgba(72, 206, 219, 0.5)'
                        }
                      }}
                    >
                      <CardContent sx={{ textAlign: 'center', py: 3 }}>
                        <Box sx={{ mb: 2 }}>
                          {item.icon}
                        </Box>
                        <Typography 
                          variant="h6" 
                          sx={{ 
                            color: 'white', 
                            fontWeight: 600, 
                            mb: 1,
                            fontFamily: 'Poppins, sans-serif',
                            fontSize: '1rem'
                          }}
                        >
                          {item.title}
                        </Typography>
                        <Typography 
                          variant="body2" 
                          sx={{ 
                            color: 'rgba(255, 255, 255, 0.7)',
                            fontFamily: 'Poppins, sans-serif',
                            fontSize: '0.85rem'
                          }}
                        >
                          {item.description}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>

              {/* Main Content */}
              <Box sx={{ maxWidth: '900px', textAlign: 'left' }}>
                {/* Our Story */}
                <Card 
                  sx={{ 
                    bgcolor: 'rgba(5, 19, 35, 0.6)',
                    border: '1px solid rgba(72, 206, 219, 0.15)',
                    borderRadius: 3,
                    mb: 4
                  }}
                >
                  <CardContent sx={{ p: { xs: 3, sm: 4 } }}>
                    <Typography 
                      variant="h5" 
                      sx={{ 
                        color: '#48cedb', 
                        fontWeight: 600, 
                        mb: 3,
                        fontFamily: 'Poppins, sans-serif',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1
                      }}
                    >
                      <TrendingUpIcon /> Our Journey
                    </Typography>
                    <Typography 
                      variant="body1" 
                      sx={{ 
                        color: 'rgba(255, 255, 255, 0.85)', 
                        lineHeight: 1.8,
                        fontFamily: 'Poppins, sans-serif',
                        mb: 2
                      }}
                    >
                      Xtrapush Gadgets is a technology-focused retail business with a vision to make quality gadgets accessible and reliable for {isMalawi ? 'customers in Malawi' : 'UK customers'}. Our journey began as a vision to bridge the gap between technology availability and affordability. In early 2024, Xtrapush started operations on a smaller scale, carefully building a foundation of trust, reliability, and expertise in gadget sales.
                    </Typography>
                  </CardContent>
                </Card>

                {/* Operations */}
                <Card 
                  sx={{ 
                    bgcolor: 'rgba(5, 19, 35, 0.6)',
                    border: '1px solid rgba(72, 206, 219, 0.15)',
                    borderRadius: 3,
                    mb: 4
                  }}
                >
                  <CardContent sx={{ p: { xs: 3, sm: 4 } }}>
                    <Typography 
                      variant="h5" 
                      sx={{ 
                        color: '#48cedb', 
                        fontWeight: 600, 
                        mb: 3,
                        fontFamily: 'Poppins, sans-serif',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1
                      }}
                    >
                      <BusinessIcon /> Business Registration
                    </Typography>
                    <Typography 
                      variant="body1" 
                      sx={{ 
                        color: 'rgba(255, 255, 255, 0.85)', 
                        lineHeight: 1.8,
                        fontFamily: 'Poppins, sans-serif',
                        mb: 3
                      }}
                    >
                      {businessInfo.description}
                    </Typography>

                    {/* Registration Details Grid */}
                    <Box 
                      sx={{ 
                        bgcolor: 'rgba(0, 0, 0, 0.3)',
                        borderRadius: 2,
                        p: 3,
                        border: '1px solid rgba(72, 206, 219, 0.1)'
                      }}
                    >
                      <Grid container spacing={2}>
                        <Grid item xs={12} sm={6}>
                          <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5, mb: 2 }}>
                            <BusinessIcon sx={{ color: '#48cedb', fontSize: 20, mt: 0.3 }} />
                            <Box>
                              <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)', fontFamily: 'Poppins' }}>
                                Business Name
                              </Typography>
                              <Typography variant="body2" sx={{ color: 'white', fontFamily: 'Poppins', fontWeight: 500 }}>
                                {businessInfo.registration.name}
                              </Typography>
                            </Box>
                          </Box>
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5, mb: 2 }}>
                            <GavelIcon sx={{ color: '#48cedb', fontSize: 20, mt: 0.3 }} />
                            <Box>
                              <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)', fontFamily: 'Poppins' }}>
                                Business Type
                              </Typography>
                              <Typography variant="body2" sx={{ color: 'white', fontFamily: 'Poppins', fontWeight: 500 }}>
                                {businessInfo.registration.type}
                              </Typography>
                            </Box>
                          </Box>
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5, mb: 2 }}>
                            <VerifiedIcon sx={{ color: '#48cedb', fontSize: 20, mt: 0.3 }} />
                            <Box>
                              <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)', fontFamily: 'Poppins' }}>
                                {isMalawi ? 'Tax Registration' : 'Company Registration'}
                              </Typography>
                              <Typography variant="body2" sx={{ color: 'white', fontFamily: 'Poppins', fontWeight: 500 }}>
                                {businessInfo.registration.registrationNumber}
                              </Typography>
                            </Box>
                          </Box>
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5, mb: 2 }}>
                            <PublicIcon sx={{ color: '#48cedb', fontSize: 20, mt: 0.3 }} />
                            <Box>
                              <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)', fontFamily: 'Poppins' }}>
                                Regulator
                              </Typography>
                              <Typography variant="body2" sx={{ color: 'white', fontFamily: 'Poppins', fontWeight: 500 }}>
                                {businessInfo.registration.regulator}
                              </Typography>
                            </Box>
                          </Box>
                        </Grid>
                        <Grid item xs={12}>
                          <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5, mb: 2 }}>
                            <LocationOnIcon sx={{ color: '#48cedb', fontSize: 20, mt: 0.3 }} />
                            <Box>
                              <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)', fontFamily: 'Poppins' }}>
                                Registered Address
                              </Typography>
                              <Typography variant="body2" sx={{ color: 'white', fontFamily: 'Poppins', fontWeight: 500 }}>
                                {businessInfo.registration.registeredAddress}
                              </Typography>
                            </Box>
                          </Box>
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5, mb: 2 }}>
                            <EmailIcon sx={{ color: '#48cedb', fontSize: 20, mt: 0.3 }} />
                            <Box>
                              <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)', fontFamily: 'Poppins' }}>
                                Email
                              </Typography>
                              <Typography variant="body2" sx={{ color: 'white', fontFamily: 'Poppins', fontWeight: 500 }}>
                                {businessInfo.registration.email}
                              </Typography>
                            </Box>
                          </Box>
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5, mb: 2 }}>
                            <PhoneIcon sx={{ color: '#48cedb', fontSize: 20, mt: 0.3 }} />
                            <Box>
                              <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)', fontFamily: 'Poppins' }}>
                                Phone
                              </Typography>
                              <Typography variant="body2" sx={{ color: 'white', fontFamily: 'Poppins', fontWeight: 500 }}>
                                {businessInfo.registration.phone}
                              </Typography>
                            </Box>
                          </Box>
                        </Grid>
                      </Grid>

                      {/* Payment & Currency Info */}
                      <Box 
                        sx={{ 
                          mt: 2, 
                          pt: 2, 
                          borderTop: '1px solid rgba(72, 206, 219, 0.1)',
                          display: 'flex',
                          flexWrap: 'wrap',
                          gap: 2
                        }}
                      >
                        <Chip 
                          label={`Currency: ${businessInfo.registration.currency}`}
                          size="small"
                          sx={{ 
                            bgcolor: 'rgba(72, 206, 219, 0.15)', 
                            color: '#48cedb',
                            fontFamily: 'Poppins'
                          }}
                        />
                        <Chip 
                          label={`Payments: ${businessInfo.registration.paymentProvider}`}
                          size="small"
                          sx={{ 
                            bgcolor: 'rgba(72, 206, 219, 0.15)', 
                            color: '#48cedb',
                            fontFamily: 'Poppins'
                          }}
                        />
                        {!isMalawi && businessInfo.registration.vatNumber && (
                          <Chip 
                            label={`VAT: ${businessInfo.registration.vatNumber}`}
                            size="small"
                            sx={{ 
                              bgcolor: 'rgba(72, 206, 219, 0.15)', 
                              color: '#48cedb',
                              fontFamily: 'Poppins'
                            }}
                          />
                        )}
                        {isMalawi && businessInfo.registration.tinNumber && (
                          <Chip 
                            label={businessInfo.registration.tinNumber}
                            size="small"
                            sx={{ 
                              bgcolor: 'rgba(72, 206, 219, 0.15)', 
                              color: '#48cedb',
                              fontFamily: 'Poppins'
                            }}
                          />
                        )}
                      </Box>
                    </Box>

                    {!isMalawi && (
                      <Box sx={{ mt: 3 }}>
                        <a
                          href="https://ebay.us/m/87H7XC"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 py-3 px-5 font-poppins font-medium text-[16px] text-primary bg-blue-gradient rounded-[10px] outline-none transition-transform hover:scale-105"
                        >
                          Visit Our eBay UK Store
                          <svg 
                            xmlns="http://www.w3.org/2000/svg" 
                            className="h-5 w-5" 
                            viewBox="0 0 20 20" 
                            fill="currentColor"
                          >
                            <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
                          </svg>
                        </a>
                      </Box>
                    )}
                  </CardContent>
                </Card>

                {/* Commitment */}
                <Card 
                  sx={{ 
                    bgcolor: 'rgba(5, 19, 35, 0.6)',
                    border: '1px solid rgba(72, 206, 219, 0.15)',
                    borderRadius: 3,
                    mb: 4
                  }}
                >
                  <CardContent sx={{ p: { xs: 3, sm: 4 } }}>
                    <Typography 
                      variant="h5" 
                      sx={{ 
                        color: '#48cedb', 
                        fontWeight: 600, 
                        mb: 3,
                        fontFamily: 'Poppins, sans-serif',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1
                      }}
                    >
                      <HandshakeIcon /> Our Commitment
                    </Typography>
                    <Typography 
                      variant="body1" 
                      sx={{ 
                        color: 'rgba(255, 255, 255, 0.85)', 
                        lineHeight: 1.8,
                        fontFamily: 'Poppins, sans-serif',
                        mb: 2
                      }}
                    >
                      The gadget industry presents several challenges, including sourcing reliable stock, maintaining competitive pricing, and meeting diverse customer expectations. Despite these obstacles, Xtrapush Gadgets is dedicated to overcoming these challenges through meticulous sourcing, quality control, and attentive customer service. Our team works tirelessly to ensure that each sale not only meets but exceeds customer expectations.
                    </Typography>
                    <Typography 
                      variant="body1" 
                      sx={{ 
                        color: 'rgba(255, 255, 255, 0.85)', 
                        lineHeight: 1.8,
                        fontFamily: 'Poppins, sans-serif'
                      }}
                    >
                      While our primary focus is currently on the direct sale of smartphones, tablets, and other popular gadgets, we are actively laying the groundwork for future initiatives, such as flexible gadget leasing solutions. This will provide businesses and individuals with more affordable access to essential technology, without compromising on quality or reliability.
                    </Typography>
                  </CardContent>
                </Card>

                {/* Vision */}
                <Card 
                  sx={{ 
                    bgcolor: 'rgba(5, 19, 35, 0.6)',
                    border: '1px solid rgba(72, 206, 219, 0.15)',
                    borderRadius: 3,
                    mb: 4
                  }}
                >
                  <CardContent sx={{ p: { xs: 3, sm: 4 } }}>
                    <Typography 
                      variant="h5" 
                      sx={{ 
                        color: '#48cedb', 
                        fontWeight: 600, 
                        mb: 3,
                        fontFamily: 'Poppins, sans-serif',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1
                      }}
                    >
                      <VerifiedIcon /> Our Vision
                    </Typography>
                    <Typography 
                      variant="body1" 
                      sx={{ 
                        color: 'rgba(255, 255, 255, 0.85)', 
                        lineHeight: 1.8,
                        fontFamily: 'Poppins, sans-serif'
                      }}
                    >
                      {isMalawi 
                        ? 'Since its inception, Xtrapush Gadgets has remained guided by the vision of making technology accessible, trustworthy, and convenient for all customers in Malawi. Based in Lilongwe, we are committed to continuously improving our services and expanding our product offerings to meet the evolving needs of Malawian consumers, with secure local payment options through PayChangu.'
                        : 'Since its inception, Xtrapush Gadgets has remained guided by the vision of making technology accessible, trustworthy, and convenient for all customers. Based in the United Kingdom, we are committed to continuously improving our services and expanding our product offerings to meet the evolving needs of our international clients, with secure payment processing through Square.'
                      }
                    </Typography>
                  </CardContent>
                </Card>
              </Box>
            </section>
          </div>
        </div>
      </div>
    </>
  );
};

export default AboutPage;
