import React from 'react';
import { SlidersHorizontal, X, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Slider } from '@/components/ui/slider';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
} from '@/components/ui/sheet';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { useCart } from '@/context/CartContext';
import { formatPrice } from '@/lib/utils';

const categories = [
  { id: 'smartphone', name: 'Smartphones' },
  { id: 'laptop', name: 'Laptops' },
  { id: 'gaming', name: 'Gaming' },
  { id: 'accessory', name: 'Accessories' },
  { id: 'wearable', name: 'Wearables' },
  { id: 'tablet', name: 'Tablets' },
];

const brands = [
  'Apple', 'Samsung', 'Google', 'Sony', 'ASUS', 'Lenovo', 'HP', 'Dell',
  'Xiaomi', 'OnePlus', 'Huawei', 'Microsoft', 'LG', 'Acer', 'MSI',
];

const conditions = [
  { id: 'new', name: 'New' },
  { id: 'refurbished', name: 'Refurbished' },
  { id: 'used', name: 'Pre-owned' },
];

export default function ProductFilters({
  filters = {},
  onFilterChange,
  onReset,
  totalProducts = 0,
}) {
  const { currency } = useCart();
  const maxPrice = currency === 'GBP' ? 5000 : 9000000;
  
  const activeFilterCount = Object.values(filters).filter((v) => {
    if (Array.isArray(v)) return v.length > 0;
    if (typeof v === 'number') return v > 0;
    return !!v;
  }).length;
  
  const handleCategoryChange = (categoryId, checked) => {
    const current = filters.categories || [];
    const updated = checked
      ? [...current, categoryId]
      : current.filter((c) => c !== categoryId);
    onFilterChange({ categories: updated });
  };
  
  const handleBrandChange = (brand, checked) => {
    const current = filters.brands || [];
    const updated = checked
      ? [...current, brand]
      : current.filter((b) => b !== brand);
    onFilterChange({ brands: updated });
  };
  
  const handleConditionChange = (condition, checked) => {
    const current = filters.conditions || [];
    const updated = checked
      ? [...current, condition]
      : current.filter((c) => c !== condition);
    onFilterChange({ conditions: updated });
  };
  
  const handlePriceChange = (values) => {
    onFilterChange({ minPrice: values[0], maxPrice: values[1] });
  };
  
  const handleInStockChange = (checked) => {
    onFilterChange({ inStock: checked });
  };
  
  const FilterContent = () => (
    <div className="space-y-6">
      {/* In Stock */}
      <div className="flex items-center space-x-2">
        <Checkbox
          id="inStock"
          checked={filters.inStock || false}
          onCheckedChange={handleInStockChange}
        />
        <Label htmlFor="inStock" className="font-medium">
          In Stock Only
        </Label>
      </div>
      
      <Accordion type="multiple" defaultValue={['categories', 'price']} className="w-full">
        {/* Categories */}
        <AccordionItem value="categories">
          <AccordionTrigger className="text-sm font-medium">
            Categories
          </AccordionTrigger>
          <AccordionContent>
            <div className="space-y-2">
              {categories.map((category) => (
                <div key={category.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={`category-${category.id}`}
                    checked={(filters.categories || []).includes(category.id)}
                    onCheckedChange={(checked) => handleCategoryChange(category.id, checked)}
                  />
                  <Label htmlFor={`category-${category.id}`} className="text-sm font-normal">
                    {category.name}
                  </Label>
                </div>
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>
        
        {/* Price Range */}
        <AccordionItem value="price">
          <AccordionTrigger className="text-sm font-medium">
            Price Range
          </AccordionTrigger>
          <AccordionContent>
            <div className="space-y-4 pt-2">
              <Slider
                min={0}
                max={maxPrice}
                step={currency === 'GBP' ? 50 : 50000}
                value={[filters.minPrice || 0, filters.maxPrice || maxPrice]}
                onValueChange={handlePriceChange}
                className="w-full"
              />
              <div className="flex justify-between text-sm">
                <span>{formatPrice(filters.minPrice || 0, currency)}</span>
                <span>{formatPrice(filters.maxPrice || maxPrice, currency)}</span>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>
        
        {/* Brands */}
        <AccordionItem value="brands">
          <AccordionTrigger className="text-sm font-medium">
            Brands
          </AccordionTrigger>
          <AccordionContent>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {brands.map((brand) => (
                <div key={brand} className="flex items-center space-x-2">
                  <Checkbox
                    id={`brand-${brand}`}
                    checked={(filters.brands || []).includes(brand)}
                    onCheckedChange={(checked) => handleBrandChange(brand, checked)}
                  />
                  <Label htmlFor={`brand-${brand}`} className="text-sm font-normal">
                    {brand}
                  </Label>
                </div>
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>
        
        {/* Condition */}
        <AccordionItem value="condition">
          <AccordionTrigger className="text-sm font-medium">
            Condition
          </AccordionTrigger>
          <AccordionContent>
            <div className="space-y-2">
              {conditions.map((condition) => (
                <div key={condition.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={`condition-${condition.id}`}
                    checked={(filters.conditions || []).includes(condition.id)}
                    onCheckedChange={(checked) => handleConditionChange(condition.id, checked)}
                  />
                  <Label htmlFor={`condition-${condition.id}`} className="text-sm font-normal">
                    {condition.name}
                  </Label>
                </div>
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
  
  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:block w-64 flex-shrink-0">
        <div className="sticky top-24">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold">Filters</h2>
            {activeFilterCount > 0 && (
              <Button variant="ghost" size="sm" onClick={onReset}>
                Clear all
              </Button>
            )}
          </div>
          <FilterContent />
        </div>
      </aside>
      
      {/* Mobile Filter Sheet */}
      <div className="lg:hidden">
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline" className="gap-2">
              <SlidersHorizontal className="h-4 w-4" />
              Filters
              {activeFilterCount > 0 && (
                <Badge className="ml-1">{activeFilterCount}</Badge>
              )}
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-80">
            <SheetHeader>
              <SheetTitle>Filters</SheetTitle>
            </SheetHeader>
            <div className="mt-6 overflow-y-auto max-h-[calc(100vh-200px)]">
              <FilterContent />
            </div>
            <SheetFooter className="mt-6">
              <Button variant="outline" onClick={onReset} className="flex-1">
                Clear all
              </Button>
              <Button className="flex-1 bg-cyan-500 hover:bg-cyan-600">
                Show {totalProducts} results
              </Button>
            </SheetFooter>
          </SheetContent>
        </Sheet>
      </div>
    </>
  );
}
