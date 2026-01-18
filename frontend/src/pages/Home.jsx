import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  Smartphone,
  Laptop,
  Gamepad2,
  Headphones,
  Watch,
  Truck,
  Shield,
  CreditCard,
  RotateCcw,
  Star,
  ChevronRight,
  Play,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import ProductCard from '@/components/products/ProductCard';
import { api } from '@/lib/api';
import { useCart } from '@/context/CartContext';
import { formatPrice } from '@/lib/utils';

const categories = [
  { name: 'Smartphones', icon: Smartphone, href: '/products?category=smartphone', color: 'from-blue-500 to-blue-600' },
  { name: 'Laptops', icon: Laptop, href: '/products?category=laptop', color: 'from-purple-500 to-purple-600' },
  { name: 'Gaming', icon: Gamepad2, href: '/products?category=gaming', color: 'from-green-500 to-green-600' },
  { name: 'Audio', icon: Headphones, href: '/products?category=accessory', color: 'from-orange-500 to-orange-600' },
  { name: 'Wearables', icon: Watch, href: '/products?category=wearable', color: 'from-pink-500 to-pink-600' },
];

const features = [
  { icon: Truck, title: 'Free Delivery', desc: 'On orders over £50' },
  { icon: Shield, title: '1 Year Warranty', desc: 'Full coverage' },
  { icon: CreditCard, title: 'Flexible Payment', desc: 'Pay in installments' },
  { icon: RotateCcw, title: 'Easy Trade-In', desc: 'Get value for old devices' },
];

const testimonials = [
  {
    name: 'James M.',
    role: 'Tech Enthusiast',
    content: 'Amazing service! Got my MacBook within 2 days and the trade-in process was seamless.',
    rating: 5,
  },
  {
    name: 'Sarah K.',
    role: 'Business Owner',
    content: 'The installment option made it possible for me to upgrade my entire office setup.',
    rating: 5,
  },
  {
    name: 'Michael O.',
    role: 'Gamer',
    content: 'Best prices on gaming laptops! The subscription benefits are incredible.',
    rating: 5,
  },
];

export default function Home() {
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const { currency } = useCart();
  
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await api.getGadgets({ limit: 8, currency });
        setFeaturedProducts(response.data.data || []);
      } catch (error) {
        console.error('Failed to fetch products:', error);
        // Use mock data for demo
        setFeaturedProducts([
          { id: 1, name: 'MacBook Pro M4', brand: 'Apple', price: 3500000, price_gbp: 1944.44, category: 'laptop', image_url: '/gadgets/macbookm4.png', stock_quantity: 10 },
          { id: 2, name: 'Samsung S25 Ultra', brand: 'Samsung', price: 2250000, price_gbp: 1250, category: 'smartphone', image_url: '/gadgets/s25ultra.png', stock_quantity: 15 },
          { id: 3, name: 'iPhone 16 Pro Max', brand: 'Apple', price: 5000000, price_gbp: 2777.78, category: 'smartphone', image_url: '/gadgets/iphone16max.png', stock_quantity: 8 },
          { id: 4, name: 'ASUS ROG Strix', brand: 'ASUS', price: 4500000, price_gbp: 2500, category: 'gaming', image_url: '/gadgets/asusrog.png', stock_quantity: 5 },
        ]);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, [currency]);
  
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0zNiAxOGMtOS45NCAwLTE4IDguMDYtMTggMThzOC4wNiAxOCAxOCAxOCAxOC04LjA2IDE4LTE4LTguMDYtMTgtMTgtMTh6bTAgMzJjLTcuNzMyIDAtMTQtNi4yNjgtMTQtMTRzNi4yNjgtMTQgMTQtMTQgMTQgNi4yNjggMTQgMTQtNi4yNjggMTQtMTQgMTR6IiBmaWxsPSIjZmZmIiBmaWxsLW9wYWNpdHk9Ii4wMyIvPjwvZz48L3N2Zz4=')] opacity-20" />
        
        <div className="container mx-auto px-4 py-20 md:py-32">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
            >
              <Badge className="mb-4 bg-cyan-500/20 text-cyan-400 border-cyan-500/30">
                🚀 New Arrivals
              </Badge>
              <h1 className="text-4xl md:text-6xl font-bold text-white mb-6 leading-tight">
                A Little Push To
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500"> Get You There</span>
              </h1>
              <p className="text-lg text-slate-300 mb-8 max-w-lg">
                Premium gadgets with flexible payment options. Trade-in your old devices, 
                pay in installments, and enjoy exclusive subscription benefits.
              </p>
              <div className="flex flex-wrap gap-4">
                <Button asChild size="lg" className="bg-cyan-500 hover:bg-cyan-600">
                  <Link to="/products">
                    Shop Now <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="border-slate-600 text-white hover:bg-slate-800">
                  <Link to="/trade-in">
                    Trade-In Value
                  </Link>
                </Button>
              </div>
              
              {/* Stats */}
              <div className="flex gap-8 mt-12">
                <div>
                  <p className="text-3xl font-bold text-white">5000+</p>
                  <p className="text-slate-400 text-sm">Happy Customers</p>
                </div>
                <div>
                  <p className="text-3xl font-bold text-white">500+</p>
                  <p className="text-slate-400 text-sm">Products</p>
                </div>
                <div>
                  <p className="text-3xl font-bold text-white">4.9</p>
                  <p className="text-slate-400 text-sm">Rating</p>
                </div>
              </div>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="relative hidden lg:block"
            >
              <div className="relative">
                <div className="absolute -inset-4 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-3xl blur-3xl opacity-20" />
                <img
                  src="https://images.unsplash.com/photo-1592899677977-9c10ca588bbd?w=600&q=80"
                  alt="Premium Gadgets"
                  className="relative rounded-3xl shadow-2xl"
                />
              </div>
              
              {/* Floating Card */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 }}
                className="absolute -bottom-6 -left-6 bg-white dark:bg-slate-800 rounded-xl p-4 shadow-xl"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 dark:bg-green-500/20 rounded-lg">
                    <Truck className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm">Free Delivery</p>
                    <p className="text-xs text-muted-foreground">On orders over £50</p>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>
      
      {/* Features Strip */}
      <section className="bg-muted/30 border-y">
        <div className="container mx-auto px-4 py-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {features.map((feature) => (
              <div key={feature.title} className="flex items-center gap-3">
                <div className="p-2 bg-cyan-500/10 rounded-lg flex-shrink-0">
                  <feature.icon className="h-5 w-5 text-cyan-500" />
                </div>
                <div>
                  <p className="font-medium text-sm">{feature.title}</p>
                  <p className="text-xs text-muted-foreground">{feature.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
      
      {/* Categories */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl md:text-3xl font-bold">Shop by Category</h2>
              <p className="text-muted-foreground mt-1">Find exactly what you need</p>
            </div>
            <Button asChild variant="ghost" className="hidden md:flex">
              <Link to="/products">
                View All <ChevronRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {categories.map((category, index) => (
              <motion.div
                key={category.name}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Link to={category.href}>
                  <Card className="group hover:shadow-lg transition-all duration-300 overflow-hidden">
                    <CardContent className="p-6 text-center">
                      <div className={`inline-flex p-4 rounded-2xl bg-gradient-to-br ${category.color} mb-4 group-hover:scale-110 transition-transform`}>
                        <category.icon className="h-8 w-8 text-white" />
                      </div>
                      <h3 className="font-semibold">{category.name}</h3>
                    </CardContent>
                  </Card>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
      
      {/* Featured Products */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl md:text-3xl font-bold">Featured Products</h2>
              <p className="text-muted-foreground mt-1">Handpicked for you</p>
            </div>
            <Button asChild variant="outline">
              <Link to="/products">
                View All <ChevronRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          </div>
          
          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="aspect-square bg-muted rounded-lg mb-4" />
                  <div className="h-4 bg-muted rounded w-1/3 mb-2" />
                  <div className="h-5 bg-muted rounded w-2/3" />
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {featuredProducts.slice(0, 4).map((product, index) => (
                <ProductCard key={product.id} product={product} index={index} />
              ))}
            </div>
          )}
        </div>
      </section>
      
      {/* Subscription CTA */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <Card className="overflow-hidden bg-gradient-to-r from-cyan-500 to-blue-600">
            <CardContent className="p-8 md:p-12">
              <div className="grid md:grid-cols-2 gap-8 items-center">
                <div className="text-white">
                  <Badge className="mb-4 bg-white/20 text-white border-white/30">
                    Xtrapush Plus & Premium
                  </Badge>
                  <h2 className="text-3xl md:text-4xl font-bold mb-4">
                    Unlock Exclusive Benefits
                  </h2>
                  <ul className="space-y-3 mb-6">
                    <li className="flex items-center gap-2">
                      <div className="h-5 w-5 rounded-full bg-white/20 flex items-center justify-center">
                        <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" />
                        </svg>
                      </div>
                      Free unlimited delivery on all orders
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="h-5 w-5 rounded-full bg-white/20 flex items-center justify-center">
                        <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" />
                        </svg>
                      </div>
                      Gadget insurance coverage for 1 year
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="h-5 w-5 rounded-full bg-white/20 flex items-center justify-center">
                        <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" />
                        </svg>
                      </div>
                      Exclusive member discounts
                    </li>
                  </ul>
                  <div className="flex flex-wrap gap-4">
                    <Button asChild size="lg" className="bg-white text-cyan-600 hover:bg-white/90">
                      <Link to="/subscriptions">
                        View Plans <ArrowRight className="ml-2 h-5 w-5" />
                      </Link>
                    </Button>
                    <p className="text-white/80 text-sm self-center">
                      Starting from just {formatPrice(currency === 'GBP' ? 6 : 6000, currency)}/month
                    </p>
                  </div>
                </div>
                <div className="hidden md:block">
                  <img
                    src="https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500&q=80"
                    alt="Premium Benefits"
                    className="rounded-2xl shadow-2xl"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
      
      {/* Testimonials */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-bold">What Our Customers Say</h2>
            <p className="text-muted-foreground mt-2">Trusted by thousands of happy customers</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={testimonial.name}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="h-full">
                  <CardContent className="p-6">
                    <div className="flex gap-1 mb-4">
                      {[...Array(testimonial.rating)].map((_, i) => (
                        <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />
                      ))}
                    </div>
                    <p className="text-muted-foreground mb-4">"{testimonial.content}"</p>
                    <div>
                      <p className="font-semibold">{testimonial.name}</p>
                      <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
      
      {/* Newsletter */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="text-2xl md:text-3xl font-bold mb-4">Stay Updated</h2>
            <p className="text-muted-foreground mb-6">
              Subscribe to our newsletter for the latest deals, new arrivals, and exclusive offers.
            </p>
            <form className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
              <input
                type="email"
                placeholder="Enter your email"
                className="flex-1 px-4 py-3 rounded-lg border bg-background"
              />
              <Button className="bg-cyan-500 hover:bg-cyan-600 px-8">
                Subscribe
              </Button>
            </form>
          </div>
        </div>
      </section>
    </div>
  );
}
