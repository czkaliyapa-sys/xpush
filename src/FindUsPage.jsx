import React from 'react';
import styles from './style';
import { locations } from './data/locations.js';
import { useLocation as useRouterLocation } from 'react-router-dom';
import { useLocation } from './contexts/LocationContext';
import { Box, Card, CardContent, Typography, Button, Alert } from '@mui/material';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import StorefrontIcon from '@mui/icons-material/Storefront';
import SEOMeta from './components/SEOMeta.jsx';
import { getCanonicalUrl } from './utils/seoUtils.js';

const FindUsPage = () => {
  const location = useLocation();
  const routerLocation = useRouterLocation();
  const isInMalawi = location?.isInMalawi;
  return (
    <>
      <SEOMeta
        title="Find Us - Store Locations | Xtrapush Gadgets"
        description="Visit our Xtrapush Gadgets stores across Malawi. Find our locations in Lilongwe, Blantyre, and Mzuzu with contact information and directions."
        keywords="find us, locations, stores, Lilongwe, Blantyre, Mzuzu, contact, visit"
        canonical={getCanonicalUrl(routerLocation.pathname)}
        ogTitle="Find Our Stores"
        ogDescription="Xtrapush Gadgets Store Locations"
        ogUrl={getCanonicalUrl(routerLocation.pathname)}
      />
    <div className="deep bg-primary w-full min-h-screen overflow-hidden">
      <div className={`${styles.paddingX} ${styles.flexCenter}`}>
        <div className={`${styles.boxWidth}`}>
          
        </div>
      </div>

      <div className={`${styles.paddingX} ${styles.flexCenter}`}>
        <div className={`${styles.boxWidth} py-6`}>
          <Typography variant="h4" component="h1" sx={{ color: 'white', mb: 4, display: 'flex', alignItems: 'center', gap: 1 }}>
            <LocationOnIcon sx={{ fontSize: 32 }} />
            Find Us
          </Typography>

          {/* Region-Specific Content */}
          {isInMalawi ? (
            <>
              <Typography variant="h6" sx={{ color: '#48CEDB', mb: 2 }}>
                🇲🇼 Currently in Malawi
              </Typography>
              <Typography variant="body1" sx={{ color: 'white', mb: 4, lineHeight: 1.8 }}>
                We are currently <strong>mobile-based</strong> and visit popular locations in <strong>Lilongwe and Blantyre</strong>. 
                You can find us at the locations listed below or contact us for custom meetup arrangements.
              </Typography>

              <Typography variant="h6" sx={{ color: 'white', mb: 2 }}>
                Visit Us At
              </Typography>

              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2, mb: 4 }}>
                {locations.map((loc) => (
                  <Card key={loc.id} sx={{ backgroundColor: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.2)', transition: 'all 0.3s ease', '&:hover': { backgroundColor: 'rgba(72, 206, 219, 0.1)', borderColor: '#48CEDB' } }}>
                    <CardContent>
                      <Typography variant="h6" sx={{ color: '#48CEDB', mb: 1 }}>{loc.name}</Typography>
                      <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.8)', mb: 2 }}>{loc.address}</Typography>
                      <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.6)', display: 'block', mb: 2 }}>
                        📍 Mobile service - Contact us for specific times
                      </Typography>
                      <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
                        {loc.places && loc.places.google && (
                          <Button
                            variant="contained"
                            size="small"
                            href={loc.places.google}
                            target="_blank"
                            rel="noopener noreferrer"
                            sx={{ bgcolor: '#48CEDB', color: '#1565c0', '&:hover': { bgcolor: '#3ba8b8' } }}
                          >
                            View on Maps
                          </Button>
                        )}
                      </Box>
                    </CardContent>
                  </Card>
                ))}
              </Box>

              <Card sx={{ backgroundColor: 'rgba(72, 206, 219, 0.1)', border: '1px solid rgba(72, 206, 219, 0.3)', mt: 4 }}>
                <CardContent>
                  <Typography variant="subtitle1" sx={{ color: '#48CEDB', mb: 1, fontWeight: 600 }}>
                    Coming Soon: Physical Branches
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.85)' }}>
                    We're expanding! Physical stores will be opening soon in <strong>Lilongwe</strong> and <strong>Blantyre</strong>. 
                    Subscribe to our newsletter or follow us on social media for opening announcements.
                  </Typography>
                </CardContent>
              </Card>
            </>
          ) : (
            <>
              <Typography variant="h6" sx={{ color: '#48CEDB', mb: 2 }}>
                🇬🇧 Currently in UK
              </Typography>
              <Typography variant="body1" sx={{ color: 'white', mb: 4, lineHeight: 1.8 }}>
                We are currently <strong>mobile-based</strong> in the <strong>Northamptonshire region</strong>. 
                We travel to meet customers or arrange convenient pickup and delivery locations.
              </Typography>

              <Card sx={{ backgroundColor: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(72, 206, 219, 0.3)', mb: 4 }}>
                <CardContent>
                  <Typography variant="h6" sx={{ color: '#48CEDB', mb: 2 }}>Service Area: Northamptonshire</Typography>
                  <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.85)', mb: 2 }}>
                    📍 <strong>Mobile Service</strong> - We come to you for viewings, demos, and pickups
                  </Typography>
                  <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.7)', display: 'block', mb: 2 }}>
                    Available by appointment. Contact us to arrange a time that works for you.
                  </Typography>
                  <Button
                    variant="contained"
                    sx={{ bgcolor: '#48CEDB', color: '#1565c0', '&:hover': { bgcolor: '#3ba8b8' } }}
                    href="mailto:contact@itsxtrapush.com"
                  >
                    Contact Us for Appointment
                  </Button>
                </CardContent>
              </Card>

              <Card sx={{ backgroundColor: 'rgba(72, 206, 219, 0.1)', border: '1px solid rgba(72, 206, 219, 0.3)' }}>
                <CardContent>
                  <Typography variant="subtitle1" sx={{ color: '#48CEDB', mb: 1, fontWeight: 600 }}>
                    Coming Soon: Physical Branch
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.85)' }}>
                    A permanent physical store will be opening soon in <strong>Northamptonshire</strong>. 
                    We'll announce the exact location and opening date soon. Stay tuned!
                  </Typography>
                </CardContent>
              </Card>
            </>
          )}

        </div>
      </div>

      
    </div>
    </>
  );
};

export default FindUsPage;