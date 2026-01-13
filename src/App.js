import React, { useState } from 'react';
import './App.css';

// Import verification components
import SellerVerification from './components/SellerVerification';
import SellerProfile from './components/SellerProfile';
import ProductAuthenticity from './components/ProductAuthenticity';
import EscrowPayment from './components/EscrowPayment';
import TrustIndicators from './components/TrustIndicators';
import VerificationDashboard from './components/VerificationDashboard';
import Logo from './components/Logo';

function App() {
  const [currentView, setCurrentView] = useState('dashboard');
  const [user] = useState({
    id: 'user123',
    name: 'John Doe',
    email: 'john@example.com',
    role: 'seller'
  });

  const navigation = [
    { id: 'dashboard', label: 'Verification Dashboard', icon: '🏠' },
    { id: 'verification', label: 'Seller Verification', icon: '✅' },
    { id: 'profile', label: 'Seller Profile', icon: '👤' },
    { id: 'authenticity', label: 'Product Authenticity', icon: '🔍' },
    { id: 'escrow', label: 'Escrow Payment', icon: '💰' },
    { id: 'trust', label: 'Trust Indicators', icon: '🛡️' }
  ];

  const renderCurrentView = () => {
    switch (currentView) {
      case 'dashboard':
        return <VerificationDashboard sellerId={user.id} />;
      case 'verification':
        return <SellerVerification sellerId={user.id} />;
      case 'profile':
        return <SellerProfile sellerId={user.id} />;
      case 'authenticity':
        return <ProductAuthenticity productId="product123" sellerId={user.id} />;
      case 'escrow':
        return <EscrowPayment transactionId="txn123" />;
      case 'trust':
        return <TrustIndicators sellerId={user.id} />;
      default:
        return <VerificationDashboard sellerId={user.id} />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Logo />
              <div>
                <h1 className="text-xl font-bold text-gray-900">Xtrapush</h1>
                <p className="text-sm text-gray-500">A little push to get you there</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">Welcome, {user.name}</span>
              <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
                {user.name.charAt(0)}
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar Navigation */}
        <nav className="w-64 bg-white shadow-sm min-h-screen">
          <div className="p-4">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Verification System</h2>
            <ul className="space-y-2">
              {navigation.map((item) => (
                <li key={item.id}>
                  <button
                    onClick={() => setCurrentView(item.id)}
                    className={`w-full text-left px-4 py-3 rounded-lg transition-colors duration-200 flex items-center space-x-3 ${
                      currentView === item.id
                        ? 'bg-blue-50 text-blue-700 border border-blue-200'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                  >
                    <span className="text-lg">{item.icon}</span>
                    <span className="font-medium">{item.label}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Quick Stats */}
          <div className="p-4 border-t">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Quick Stats</h3>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Trust Score</span>
                <span className="font-semibold text-green-600">87/100</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Verification</span>
                <span className="font-semibold text-blue-600">Verified</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Tier</span>
                <span className="font-semibold text-purple-600">Trusted</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Active Escrows</span>
                <span className="font-semibold text-orange-600">3</span>
              </div>
            </div>
          </div>
        </nav>

        {/* Main Content */}
        <main className="flex-1 p-6">
          <div className="max-w-6xl mx-auto">
            {/* Breadcrumb */}
            <div className="mb-6">
              <nav className="flex" aria-label="Breadcrumb">
                <ol className="flex items-center space-x-4">
                  <li>
                    <div className="flex items-center">
                      <span className="text-sm font-medium text-gray-500">Verification System</span>
                    </div>
                  </li>
                  <li>
                    <div className="flex items-center">
                      <span className="text-gray-400 mx-2">/</span>
                      <span className="text-sm font-medium text-gray-900">
                        {navigation.find(item => item.id === currentView)?.label}
                      </span>
                    </div>
                  </li>
                </ol>
              </nav>
            </div>

            {/* Current View */}
            <div className="bg-white rounded-lg shadow-sm">
              {renderCurrentView()}
            </div>
          </div>
        </main>
      </div>

      {/* Footer */}
      <footer className="bg-white border-t mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <p className="text-sm text-gray-500">
              © 2024 Xtrapush. Secure marketplace with seller verification & authenticity checks.
            </p>
            <div className="flex items-center space-x-4 text-sm text-gray-500">
              <span>🔒 SSL Secured</span>
              <span>🛡️ Escrow Protected</span>
              <span>✅ Verified Sellers</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
