import React, { useEffect, useState, Suspense } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Box, Button, Typography, Alert } from '@mui/material';
import SEOMeta from './components/SEOMeta.jsx';
import { getCanonicalUrl } from './utils/seoUtils.js';
 
import { useWishlist } from './contexts/WishlistContext.jsx';
import { usePricing } from './hooks/usePricing';
import { gadgetsAPI } from './services/api.js';
const ItemCard3D = React.lazy(() => import('./external_components/ItemCard3D.tsx'));

const WishlistPage = () => {
  const location = useLocation();
  const { items, remove, clear } = useWishlist();
  const { formatLocalPrice, isInMalawi } = usePricing();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [gadgets, setGadgets] = useState([]);

  useEffect(() => {
    const fetchWishlistGadgets = async () => {
      try {
        setLoading(true);
        setError(null);
        const results = await Promise.all(
          items.map(async (id) => {
            try {
              const res = await gadgetsAPI.getById(id);
              if (res && res.success) return res.data;
              return null;
            } catch (e) {
              console.warn('Failed to fetch gadget', id, e);
              return null;
            }
          })
        );
        setGadgets(results.filter(Boolean));
      } catch (err) {
        console.error('Error loading wishlist gadgets:', err);
        setError('Failed to load wishlist items.');
      } finally {
        setLoading(false);
      }
    };

    if (items.length > 0) {
      fetchWishlistGadgets();
    } else {
      setGadgets([]);
    }
  }, [items]);

  return (
    <>
      <SEOMeta
        title="My Wishlist - Saved Gadgets | Xtrapush Gadgets"
        description="View your saved wishlist items. Keep track of gadgets you want to buy later with prices and availability updates."
        keywords="wishlist, saved items, favorite gadgets, save for later"
        canonical={getCanonicalUrl(location.pathname)}
        ogTitle="My Wishlist"
        ogDescription="Your Saved Gadgets Wishlist"
        ogUrl={getCanonicalUrl(location.pathname)}
      />
    <div className="deep bg-primary w-full overflow-hidden min-h-screen">
      <div className="px-4 sm:px-6">
        <div className="max-w-7xl mx-auto">
          

          <Box sx={{ mt: 2 }}>
            <Typography variant="h5" sx={{ color: 'white', mb: 2 }}>
              Your Wishlist
            </Typography>

            {loading ? (
              <div className="text-white">Loading wishlist...</div>
            ) : error ? (
              <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>
            ) : gadgets.length === 0 ? (
              <div className="text-white">
                Your wishlist is empty. Browse gadgets and tap the heart icon to add.
              </div>
            ) : (
              <>
                <Typography 
                  variant="body1" 
                  sx={{ color: 'white', mb: 3, opacity: 0.8 }}
                >
                  {gadgets.length} item{gadgets.length !== 1 ? 's' : ''} saved
                </Typography>

                <Suspense fallback={<div className="text-white opacity-70">Loading wishlist…</div>}>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                    {gadgets.map((gadget) => (
                      <Link
                        key={gadget.id}
                        to={`/gadgets/${gadget.id}`}
                        onClick={(e) => {
                          try {
                            if (window.__dialogOpen) {
                              e.preventDefault();
                              e.stopPropagation();
                            }
                          } catch {}
                        }}
                      >
                        <ItemCard3D 
                          id={String(gadget.id)}
                          title={gadget.name}
                          date={gadget.date || 'Available Now'}
                          number={(() => { 
                            // Try to get stock quantity from various possible field names
                            const candidates = [gadget?.stock_quantity, gadget?.qty, gadget?.number];
                            for (const val of candidates) {
                              const n = Number(val);
                              if (Number.isFinite(n) && n >= 0) return n;
                            }
                            // Fallback to in_stock boolean flag
                            if (gadget?.in_stock || gadget?.inStock) return 1;
                            return 0;
                          })()}
                          image={gadget.image}
                          description={gadget.description}
                          price={gadget.price}
                          priceMwk={gadget.price_mwk ?? gadget.priceMwk ?? gadget.price}
                          priceGbp={gadget.price_gbp ?? gadget.priceGbp}
                          monthlyPrice={gadget.monthly_price ?? gadget.monthlyPrice}
                          monthlyPriceGbp={gadget.monthly_price_gbp ?? gadget.monthlyPriceGbp}
                        />
                      </Link>
                    ))}
                  </div>
                </Suspense>

                <Box sx={{ display: 'flex', gap: 2, mt: 3 }}>
                  <Button variant="outlined" color="error" onClick={clear}>
                    Clear Wishlist
                  </Button>
                </Box>
              </>
            )}
          </Box>

          
        </div>
      </div>
    </div>
    </>
  );
};

export default WishlistPage;