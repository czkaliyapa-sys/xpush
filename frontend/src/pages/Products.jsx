import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Grid, List, ArrowUpDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import Breadcrumb from '@/components/layout/Breadcrumb';
import ProductGrid from '@/components/products/ProductGrid';
import ProductFilters from '@/components/products/ProductFilters';
import { api } from '@/lib/api';
import { useCart } from '@/context/CartContext';

const sortOptions = [
  { value: 'newest', label: 'Newest First' },
  { value: 'price-low', label: 'Price: Low to High' },
  { value: 'price-high', label: 'Price: High to Low' },
  { value: 'popular', label: 'Most Popular' },
  { value: 'rating', label: 'Highest Rated' },
];

export default function Products() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalProducts, setTotalProducts] = useState(0);
  const [viewMode, setViewMode] = useState('grid');
  const { currency } = useCart();
  
  // Get initial filters from URL
  const [filters, setFilters] = useState(() => {
    const category = searchParams.get('category');
    const brand = searchParams.get('brand');
    const q = searchParams.get('q');
    const inStock = searchParams.get('inStock');
    
    return {
      categories: category ? [category] : [],
      brands: brand ? [brand] : [],
      conditions: [],
      minPrice: 0,
      maxPrice: currency === 'GBP' ? 5000 : 9000000,
      inStock: inStock === 'true',
      search: q || '',
    };
  });
  
  const [sortBy, setSortBy] = useState('newest');
  const [page, setPage] = useState(1);
  const limit = 20;
  
  // Fetch products
  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        const params = {
          currency,
          page,
          limit,
        };
        
        if (filters.categories.length > 0) {
          params.category = filters.categories[0];
        }
        if (filters.brands.length > 0) {
          params.brand = filters.brands[0];
        }
        if (filters.conditions.length > 0) {
          params.condition = filters.conditions.join(',');
        }
        if (filters.minPrice > 0) {
          params.minPrice = filters.minPrice;
        }
        if (filters.maxPrice < (currency === 'GBP' ? 5000 : 9000000)) {
          params.maxPrice = filters.maxPrice;
        }
        if (filters.inStock) {
          params.inStock = '1';
        }
        if (filters.search) {
          params.q = filters.search;
        }
        
        const response = await api.getGadgets(params);
        let data = response.data.data || [];
        
        // Client-side sorting
        if (sortBy === 'price-low') {
          data.sort((a, b) => {
            const priceA = currency === 'GBP' ? (a.price_gbp || a.price) : a.price;
            const priceB = currency === 'GBP' ? (b.price_gbp || b.price) : b.price;
            return priceA - priceB;
          });
        } else if (sortBy === 'price-high') {
          data.sort((a, b) => {
            const priceA = currency === 'GBP' ? (a.price_gbp || a.price) : a.price;
            const priceB = currency === 'GBP' ? (b.price_gbp || b.price) : b.price;
            return priceB - priceA;
          });
        }
        
        setProducts(data);
        setTotalProducts(response.data.count || data.length);
      } catch (error) {
        console.error('Failed to fetch products:', error);
        // Use mock data for demo
        setProducts([
          { id: 1, name: 'MacBook Pro M4', brand: 'Apple', price: 3500000, price_gbp: 1944.44, category: 'laptop', image_url: '/gadgets/macbookm4.png', stock_quantity: 10, condition_status: 'new' },
          { id: 2, name: 'Samsung S25 Ultra', brand: 'Samsung', price: 2250000, price_gbp: 1250, category: 'smartphone', image_url: '/gadgets/s25ultra.png', stock_quantity: 15, condition_status: 'new' },
          { id: 3, name: 'iPhone 16 Pro Max', brand: 'Apple', price: 5000000, price_gbp: 2777.78, category: 'smartphone', image_url: '/gadgets/iphone16max.png', stock_quantity: 8, condition_status: 'new' },
          { id: 4, name: 'ASUS ROG Strix Scar 17', brand: 'ASUS', price: 4500000, price_gbp: 2500, category: 'gaming', image_url: '/gadgets/asusrog.png', stock_quantity: 5, condition_status: 'new' },
          { id: 5, name: 'iPhone 16', brand: 'Apple', price: 3500000, price_gbp: 1944.44, category: 'smartphone', image_url: '/gadgets/iphone16.png', stock_quantity: 12, condition_status: 'new' },
          { id: 6, name: 'Samsung S24', brand: 'Samsung', price: 2500000, price_gbp: 1388.89, category: 'smartphone', image_url: '/gadgets/s24.png', stock_quantity: 20, condition_status: 'new' },
          { id: 7, name: 'Dell XPS 15', brand: 'Dell', price: 2800000, price_gbp: 1555.56, category: 'laptop', image_url: '/gadgets/delllattude.png', stock_quantity: 7, condition_status: 'new' },
          { id: 8, name: 'Sony PS5', brand: 'Sony', price: 850000, price_gbp: 472.22, category: 'gaming', image_url: '/gadgets/ps5.png', stock_quantity: 25, condition_status: 'new' },
        ]);
        setTotalProducts(8);
      } finally {
        setLoading(false);
      }
    };
    
    fetchProducts();
  }, [filters, sortBy, page, currency]);
  
  // Update URL params when filters change
  useEffect(() => {
    const params = new URLSearchParams();
    if (filters.categories.length > 0) {
      params.set('category', filters.categories[0]);
    }
    if (filters.brands.length > 0) {
      params.set('brand', filters.brands[0]);
    }
    if (filters.search) {
      params.set('q', filters.search);
    }
    if (filters.inStock) {
      params.set('inStock', 'true');
    }
    setSearchParams(params);
  }, [filters, setSearchParams]);
  
  const handleFilterChange = (newFilters) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
    setPage(1);
  };
  
  const handleResetFilters = () => {
    setFilters({
      categories: [],
      brands: [],
      conditions: [],
      minPrice: 0,
      maxPrice: currency === 'GBP' ? 5000 : 9000000,
      inStock: false,
      search: '',
    });
    setPage(1);
  };
  
  const categoryTitle = filters.categories.length > 0
    ? filters.categories[0].charAt(0).toUpperCase() + filters.categories[0].slice(1) + 's'
    : 'All Products';
  
  return (
    <div className="min-h-screen">
      <div className="container mx-auto px-4 py-6">
        <Breadcrumb />
        
        <div className="flex gap-8">
          {/* Filters Sidebar */}
          <ProductFilters
            filters={filters}
            onFilterChange={handleFilterChange}
            onReset={handleResetFilters}
            totalProducts={totalProducts}
          />
          
          {/* Main Content */}
          <div className="flex-1">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div>
                <h1 className="text-2xl font-bold">{categoryTitle}</h1>
                <p className="text-muted-foreground text-sm">
                  {totalProducts} products found
                </p>
              </div>
              
              <div className="flex items-center gap-3">
                {/* Mobile Filters */}
                <div className="lg:hidden">
                  <ProductFilters
                    filters={filters}
                    onFilterChange={handleFilterChange}
                    onReset={handleResetFilters}
                    totalProducts={totalProducts}
                  />
                </div>
                
                {/* Sort */}
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-[180px]">
                    <ArrowUpDown className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    {sortOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                {/* View Mode */}
                <div className="hidden sm:flex border rounded-lg p-1">
                  <Button
                    variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => setViewMode('grid')}
                  >
                    <Grid className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={viewMode === 'list' ? 'secondary' : 'ghost'}
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => setViewMode('list')}
                  >
                    <List className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
            
            {/* Products Grid */}
            <ProductGrid products={products} loading={loading} />
            
            {/* Pagination */}
            {totalProducts > limit && (
              <div className="flex justify-center gap-2 mt-8">
                <Button
                  variant="outline"
                  disabled={page === 1}
                  onClick={() => setPage((p) => p - 1)}
                >
                  Previous
                </Button>
                <span className="flex items-center px-4">
                  Page {page} of {Math.ceil(totalProducts / limit)}
                </span>
                <Button
                  variant="outline"
                  disabled={page >= Math.ceil(totalProducts / limit)}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Next
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
