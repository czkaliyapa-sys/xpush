import React, { useState } from 'react';
import { Shield, CheckCircle, Clock, AlertTriangle, Upload, Camera, Phone, Mail, CreditCard, Building2, Star, Award, TrendingUp } from 'lucide-react';
import { TrustBadge, VerificationStatus, TrustScore, TrustProgress, SafetyGuarantee } from './TrustIndicators';
import SellerVerification from './SellerVerification';
import ProductAuthenticity from './ProductAuthenticity';
import EscrowPayment from './EscrowPayment';

const VerificationDashboard = ({ user, userRole = 'seller' }) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [verificationData, setVerificationData] = useState({
    id: false,
    phone: true,
    email: true,
    address: false,
    business: false
  });

  const [sellerStats] = useState({
    tier: 'verified',
    trustScore: 87,
    reviewCount: 156,
    totalSales: 342,
    memberSince: 'Jan 2024',
    completedTransactions: 298,
    averageRating: 4.7,
    responseTime: '2 hours',
    verifications: verificationData
  });

  const [recentTransactions] = useState([
    { id: '1', item: 'iPhone 15 Pro', amount: 999, status: 'completed', buyer: 'John D.' },
    { id: '2', item: 'MacBook Air M3', amount: 1299, status: 'shipped', buyer: 'Sarah M.' },
    { id: '3', item: 'Samsung S24 Ultra', amount: 899, status: 'delivered', buyer: 'Mike R.' }
  ]);

  const tabs = [
    { id: 'overview', label: 'Overview', icon: Shield },
    { id: 'verification', label: 'Seller Verification', icon: CheckCircle },
    { id: 'products', label: 'Product Authenticity', icon: Award },
    { id: 'escrow', label: 'Payment Protection', icon: CreditCard },
    { id: 'analytics', label: 'Trust Analytics', icon: TrendingUp }
  ];

  const verificationSteps = [
    {
      id: 'basic',
      title: 'Basic Information',
      description: 'Complete your profile with accurate information',
      completed: true,
      icon: CheckCircle
    },
    {
      id: 'phone',
      title: 'Phone Verification',
      description: 'Verify your phone number with SMS code',
      completed: verificationData.phone,
      icon: Phone
    },
    {
      id: 'email',
      title: 'Email Verification',
      description: 'Confirm your email address',
      completed: verificationData.email,
      icon: Mail
    },
    {
      id: 'id',
      title: 'ID Verification',
      description: 'Upload government-issued ID and selfie',
      completed: verificationData.id,
      icon: Upload
    },
    {
      id: 'address',
      title: 'Address Verification',
      description: 'Verify your address with utility bill',
      completed: verificationData.address,
      icon: Building2
    }
  ];

  const getNextSteps = () => {
    const incomplete = verificationSteps.filter(step => !step.completed);
    return incomplete.slice(0, 3);
  };

  const calculateTrustProgress = () => {
    const completed = Object.values(verificationData).filter(Boolean).length;
    const total = Object.keys(verificationData).length;
    return Math.round((completed / total) * 100);
  };

  const renderOverview = () => (
    <div className="space-y-6">
      {/* Trust Level Card */}
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold mb-2">Trust Level: Verified Seller</h2>
            <p className="text-blue-100">You're doing great! Complete more verifications to unlock Trusted Merchant status.</p>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold">{sellerStats.trustScore}%</div>
            <div className="text-blue-100">Trust Score</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Verification Progress */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Verification Progress</h3>
          <TrustProgress currentTier={sellerStats.tier} progress={calculateTrustProgress()} />
        </div>

        {/* Quick Stats */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Your Stats</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-3 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{sellerStats.totalSales}</div>
              <div className="text-sm text-green-800">Total Sales</div>
            </div>
            <div className="text-center p-3 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{sellerStats.averageRating}</div>
              <div className="text-sm text-blue-800">Avg Rating</div>
            </div>
            <div className="text-center p-3 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">{sellerStats.reviewCount}</div>
              <div className="text-sm text-purple-800">Reviews</div>
            </div>
            <div className="text-center p-3 bg-yellow-50 rounded-lg">
              <div className="text-2xl font-bold text-yellow-600">{sellerStats.responseTime}</div>
              <div className="text-sm text-yellow-800">Response Time</div>
            </div>
          </div>
        </div>
      </div>

      {/* Next Steps */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Recommended Next Steps</h3>
        <div className="space-y-3">
          {getNextSteps().map(step => {
            const Icon = step.icon;
            return (
              <div key={step.id} className="flex items-center space-x-4 p-3 bg-gray-50 rounded-lg">
                <Icon className="w-6 h-6 text-blue-600" />
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900">{step.title}</h4>
                  <p className="text-sm text-gray-600">{step.description}</p>
                </div>
                <button className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 text-sm">
                  Start
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Transactions</h3>
        <div className="space-y-3">
          {recentTransactions.map(transaction => (
            <div key={transaction.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <h4 className="font-medium text-gray-900">{transaction.item}</h4>
                <p className="text-sm text-gray-600">Sold to {transaction.buyer}</p>
              </div>
              <div className="text-right">
                <div className="font-semibold text-gray-900">${transaction.amount}</div>
                <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                  transaction.status === 'completed' ? 'bg-green-100 text-green-800' :
                  transaction.status === 'shipped' ? 'bg-blue-100 text-blue-800' :
                  'bg-yellow-100 text-yellow-800'
                }`}>
                  {transaction.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderAnalytics = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Trust Analytics</h3>
        
        {/* Trust Score Breakdown */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="text-center">
            <div className="w-20 h-20 mx-auto bg-green-100 rounded-full flex items-center justify-center mb-3">
              <CheckCircle className="w-10 h-10 text-green-600" />
            </div>
            <h4 className="font-semibold text-gray-900">Verification Score</h4>
            <p className="text-2xl font-bold text-green-600">85%</p>
            <p className="text-sm text-gray-600">4/5 verifications complete</p>
          </div>
          
          <div className="text-center">
            <div className="w-20 h-20 mx-auto bg-blue-100 rounded-full flex items-center justify-center mb-3">
              <Star className="w-10 h-10 text-blue-600" />
            </div>
            <h4 className="font-semibold text-gray-900">Customer Rating</h4>
            <p className="text-2xl font-bold text-blue-600">{sellerStats.averageRating}</p>
            <p className="text-sm text-gray-600">Based on {sellerStats.reviewCount} reviews</p>
          </div>
          
          <div className="text-center">
            <div className="w-20 h-20 mx-auto bg-purple-100 rounded-full flex items-center justify-center mb-3">
              <TrendingUp className="w-10 h-10 text-purple-600" />
            </div>
            <h4 className="font-semibold text-gray-900">Sales Performance</h4>
            <p className="text-2xl font-bold text-purple-600">92%</p>
            <p className="text-sm text-gray-600">Successful completion rate</p>
          </div>
        </div>

        {/* Trust Factors */}
        <div className="border-t pt-6">
          <h4 className="font-semibold text-gray-900 mb-4">Trust Factors Impact</h4>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-gray-700">ID Verification</span>
              <div className="flex items-center space-x-2">
                <div className="w-32 bg-gray-200 rounded-full h-2">
                  <div className="bg-green-500 h-2 rounded-full" style={{ width: '80%' }}></div>
                </div>
                <span className="text-sm font-medium text-green-600">+20 points</span>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-gray-700">Customer Reviews</span>
              <div className="flex items-center space-x-2">
                <div className="w-32 bg-gray-200 rounded-full h-2">
                  <div className="bg-blue-500 h-2 rounded-full" style={{ width: '94%' }}></div>
                </div>
                <span className="text-sm font-medium text-blue-600">+35 points</span>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-gray-700">Transaction History</span>
              <div className="flex items-center space-x-2">
                <div className="w-32 bg-gray-200 rounded-full h-2">
                  <div className="bg-purple-500 h-2 rounded-full" style={{ width: '88%' }}></div>
                </div>
                <span className="text-sm font-medium text-purple-600">+25 points</span>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-gray-700">Response Time</span>
              <div className="flex items-center space-x-2">
                <div className="w-32 bg-gray-200 rounded-full h-2">
                  <div className="bg-yellow-500 h-2 rounded-full" style={{ width: '70%' }}></div>
                </div>
                <span className="text-sm font-medium text-yellow-600">+7 points</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Verification Dashboard</h1>
            <p className="text-gray-600">Manage your seller verification and build trust with buyers</p>
          </div>
          <div className="flex items-center space-x-4">
            <TrustBadge tier={sellerStats.tier} size="lg" />
            <div className="text-right">
              <div className="text-2xl font-bold text-gray-900">{sellerStats.trustScore}%</div>
              <div className="text-sm text-gray-600">Trust Score</div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="border-b border-gray-200 mb-8">
        <nav className="flex space-x-8">
          {tabs.map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="min-h-screen">
        {activeTab === 'overview' && renderOverview()}
        {activeTab === 'verification' && (
          <SellerVerification 
            onVerificationComplete={(data) => {
              setVerificationData(prev => ({ ...prev, ...data }));
            }}
          />
        )}
        {activeTab === 'products' && (
          <ProductAuthenticity 
            product={{ category: 'smartphone' }}
            onVerificationComplete={(data) => {
              console.log('Product verification completed:', data);
            }}
          />
        )}
        {activeTab === 'escrow' && (
          <EscrowPayment 
            transaction={{ 
              amount: 999, 
              escrowStatus: 'pending',
              deliveryDate: new Date()
            }}
            userRole="seller"
            onStatusUpdate={(status, data) => {
              console.log('Escrow status updated:', status, data);
            }}
          />
        )}
        {activeTab === 'analytics' && renderAnalytics()}
      </div>
    </div>
  );
};

export default VerificationDashboard;