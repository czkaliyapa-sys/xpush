import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Heart, ShoppingCart, Star, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { useCart } from '@/context/CartContext';
import { useWishlist } from '@/context/WishlistContext';
import { formatPrice } from '@/lib/utils';

export default function ProductCard({ product, index = 0 }) {
  const { addItem, currency } = useCart();
  const { toggleItem, isInWishlist } = useWishlist();
  
  const price = currency === 'GBP' ? (product.price_gbp || product.price) : product.price;
  const monthlyPrice = currency === 'GBP' ? product.monthly_price_gbp : product.monthly_price;
  const inStock = product.effective_in_stock || product.stock_quantity > 0;
  const isWishlisted = isInWishlist(product.id);
  
  const handleAddToCart = (e) => {
    e.preventDefault();
    e.stopPropagation();
    addItem({
      id: product.id,
      name: product.name,
      price: product.price,
      price_gbp: product.price_gbp,
      image: product.image_url,
      brand: product.brand,
      category: product.category,
    });
  };
  
  const handleToggleWishlist = (e) => {
    e.preventDefault();
    e.stopPropagation();
    toggleItem({
      id: product.id,
      name: product.name,
      price: product.price,
      price_gbp: product.price_gbp,
      image: product.image_url,
      brand: product.brand,
    });
  };
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
    >
      <Link to={`/products/${product.id}`}>
        <Card className="group overflow-hidden hover:shadow-lg transition-all duration-300 h-full" data-testid={`product-card-${product.id}`}>
          <div className="relative aspect-square bg-muted/30 overflow-hidden">
            <img
              src={product.image_url || '/placeholder-product.png'}
              alt={product.name}
              className="w-full h-full object-contain p-4 group-hover:scale-105 transition-transform duration-300"
              loading="lazy"
            />
            
            {/* Badges */}
            <div className="absolute top-2 left-2 flex flex-col gap-1">
              {!inStock && (
                <Badge variant="destructive" className="text-xs">Out of Stock</Badge>
              )}
              {product.condition_status === 'refurbished' && (
                <Badge variant="secondary" className="text-xs">Refurbished</Badge>
              )}
              {product.condition_status === 'used' && (
                <Badge variant="outline" className="text-xs">Pre-owned</Badge>
              )}
            </div>
            
            {/* Actions Overlay */}
            <div className="absolute top-2 right-2 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button
                size="icon"
                variant="secondary"
                className="h-8 w-8 rounded-full shadow-md"
                onClick={handleToggleWishlist}
                data-testid={`wishlist-btn-${product.id}`}
              >
                <Heart className={`h-4 w-4 ${isWishlisted ? 'fill-red-500 text-red-500' : ''}`} />
              </Button>
              <Button
                size="icon"
                variant="secondary"
                className="h-8 w-8 rounded-full shadow-md"
                asChild
              >
                <Link to={`/products/${product.id}`}>
                  <Eye className="h-4 w-4" />
                </Link>
              </Button>
            </div>
            
            {/* Quick Add to Cart */}
            {inStock && (
              <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/60 to-transparent translate-y-full group-hover:translate-y-0 transition-transform">
                <Button
                  className="w-full bg-cyan-500 hover:bg-cyan-600"
                  size="sm"
                  onClick={handleAddToCart}
                  data-testid={`add-to-cart-${product.id}`}
                >
                  <ShoppingCart className="h-4 w-4 mr-2" />
                  Add to Cart
                </Button>
              </div>
            )}
          </div>
          
          <CardContent className="p-4">
            {/* Brand */}
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
              {product.brand}
            </p>
            
            {/* Name */}
            <h3 className="font-semibold text-sm line-clamp-2 mb-2 group-hover:text-cyan-500 transition-colors">
              {product.name}
            </h3>
            
            {/* Rating */}
            <div className="flex items-center gap-1 mb-2">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={`h-3 w-3 ${i < 4 ? 'fill-amber-400 text-amber-400' : 'text-muted'}`}
                />
              ))}
              <span className="text-xs text-muted-foreground ml-1">(4.0)</span>
            </div>
            
            {/* Price */}
            <div className="space-y-1">
              <div className="flex items-baseline gap-2">
                <span className="text-lg font-bold text-cyan-500">
                  {formatPrice(price, currency)}
                </span>
              </div>
              {monthlyPrice && (
                <p className="text-xs text-muted-foreground">
                  or {formatPrice(monthlyPrice, currency)}/mo
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </Link>
    </motion.div>
  );
}
