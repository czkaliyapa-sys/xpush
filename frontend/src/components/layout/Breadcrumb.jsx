import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';

export default function Breadcrumb({ items = [] }) {
  const location = useLocation();
  
  // Auto-generate breadcrumbs from path if items not provided
  const breadcrumbs = items.length > 0 ? items : generateBreadcrumbs(location.pathname);
  
  if (breadcrumbs.length === 0) return null;
  
  return (
    <nav aria-label="Breadcrumb" className="py-3">
      <ol className="flex items-center flex-wrap gap-1 text-sm">
        <li>
          <Link
            to="/"
            className="flex items-center text-muted-foreground hover:text-foreground transition-colors"
          >
            <Home className="h-4 w-4" />
          </Link>
        </li>
        {breadcrumbs.map((item, index) => (
          <li key={item.href} className="flex items-center">
            <ChevronRight className="h-4 w-4 text-muted-foreground mx-1" />
            {index === breadcrumbs.length - 1 ? (
              <span className="font-medium text-foreground">{item.label}</span>
            ) : (
              <Link
                to={item.href}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                {item.label}
              </Link>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}

function generateBreadcrumbs(pathname) {
  const pathSegments = pathname.split('/').filter(Boolean);
  const breadcrumbs = [];
  
  const labels = {
    products: 'Products',
    cart: 'Cart',
    checkout: 'Checkout',
    dashboard: 'Dashboard',
    admin: 'Admin',
    orders: 'Orders',
    subscriptions: 'Subscriptions',
    'trade-in': 'Trade-In',
    wishlist: 'Wishlist',
    login: 'Sign In',
    register: 'Sign Up',
  };
  
  let currentPath = '';
  pathSegments.forEach((segment) => {
    currentPath += `/${segment}`;
    const label = labels[segment] || segment.charAt(0).toUpperCase() + segment.slice(1);
    breadcrumbs.push({ label, href: currentPath });
  });
  
  return breadcrumbs;
}
