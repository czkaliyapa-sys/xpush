import React from 'react';
import { Shield, CheckCircle, Star, Award, AlertTriangle, Clock, Verified, Building2, User, Package } from 'lucide-react';

// Trust Badge Component
export const TrustBadge = ({ tier, size = 'md', showLabel = true }) => {
  const sizes = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
    xl: 'w-10 h-10'
  };

  const textSizes = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
    xl: 'text-lg'
  };

  const getBadgeConfig = (tier) => {
    switch (tier) {
      case 'new':
        return {
          icon: Clock,
          color: 'text-gray-600 bg-gray-100',
          label: 'New Seller',
          description: 'Recently joined Xtrapush'
        };
      case 'verified':
        return {
          icon: CheckCircle,
          color: 'text-blue-600 bg-blue-100',
          label: 'Verified Seller',
          description: 'ID verified with successful sales'
        };
      case 'trusted':
        return {
          icon: Shield,
          color: 'text-green-600 bg-green-100',
          label: 'Trusted Merchant',
          description: 'Registered business with documents'
        };
      case 'premium':
        return {
          icon: Award,
          color: 'text-purple-600 bg-purple-100',
          label: 'Premium Seller',
          description: 'Top-rated seller with excellent history'
        };
      default:
        return {
          icon: User,
          color: 'text-gray-600 bg-gray-100',
          label: 'Unverified',
          description: 'Verification pending'
        };
    }
  };

  const config = getBadgeConfig(tier);
  const Icon = config.icon;

  return (
    <div className="flex items-center space-x-2">
      <div className={`${config.color} rounded-full p-1 ${sizes[size]}`}>
        <Icon className="w-full h-full" />
      </div>
      {showLabel && (
        <span className={`font-medium ${config.color.split(' ')[0]} ${textSizes[size]}`}>
          {config.label}
        </span>
      )}
    </div>
  );
};

// Verification Status Component
export const VerificationStatus = ({ verifications, compact = false }) => {
  const verificationItems = [
    { key: 'id', label: 'ID Verified', icon: Verified },
    { key: 'phone', label: 'Phone Verified', icon: CheckCircle },
    { key: 'email', label: 'Email Verified', icon: CheckCircle },
    { key: 'address', label: 'Address Verified', icon: CheckCircle },
    { key: 'business', label: 'Business Verified', icon: Building2 }
  ];

  if (compact) {
    const verifiedCount = Object.values(verifications || {}).filter(Boolean).length;
    const totalCount = Object.keys(verifications || {}).length;
    
    return (
      <div className="flex items-center space-x-2">
        <Shield className="w-4 h-4 text-green-600" />
        <span className="text-sm text-gray-600">
          {verifiedCount}/{totalCount} Verified
        </span>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <h4 className="text-sm font-medium text-gray-900">Verification Status</h4>
      <div className="space-y-1">
        {verificationItems.map(item => {
          const Icon = item.icon;
          const isVerified = verifications?.[item.key];
          
          return (
            <div key={item.key} className="flex items-center space-x-2">
              <Icon className={`w-4 h-4 ${isVerified ? 'text-green-600' : 'text-gray-400'}`} />
              <span className={`text-sm ${isVerified ? 'text-green-800' : 'text-gray-500'}`}>
                {item.label}
              </span>
              {isVerified && <CheckCircle className="w-3 h-3 text-green-600" />}
            </div>
          );
        })}
      </div>
    </div>
  );
};

// Trust Score Component
export const TrustScore = ({ score, reviews, size = 'md' }) => {
  const getScoreColor = (score) => {
    if (score >= 90) return 'text-green-600 bg-green-100';
    if (score >= 75) return 'text-blue-600 bg-blue-100';
    if (score >= 60) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const sizes = {
    sm: 'text-sm px-2 py-1',
    md: 'text-base px-3 py-1',
    lg: 'text-lg px-4 py-2'
  };

  return (
    <div className="flex items-center space-x-3">
      <div className={`${getScoreColor(score)} rounded-full font-bold ${sizes[size]}`}>
        {score}%
      </div>
      <div className="flex items-center space-x-1">
        <div className="flex">
          {[1, 2, 3, 4, 5].map(star => (
            <Star
              key={star}
              className={`w-4 h-4 ${
                star <= Math.round(score / 20) ? 'text-yellow-400 fill-current' : 'text-gray-300'
              }`}
            />
          ))}
        </div>
        <span className="text-sm text-gray-600">({reviews} reviews)</span>
      </div>
    </div>
  );
};

// Product Authenticity Badge
export const AuthenticityBadge = ({ authenticityScore, verifications }) => {
  const getAuthenticityLevel = (score) => {
    if (score >= 90) return { level: 'Highly Authentic', color: 'text-green-600 bg-green-100', icon: Shield };
    if (score >= 75) return { level: 'Verified Authentic', color: 'text-blue-600 bg-blue-100', icon: CheckCircle };
    if (score >= 50) return { level: 'Partially Verified', color: 'text-yellow-600 bg-yellow-100', icon: AlertTriangle };
    return { level: 'Unverified', color: 'text-gray-600 bg-gray-100', icon: Package };
  };

  const auth = getAuthenticityLevel(authenticityScore);
  const Icon = auth.icon;

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <Icon className={`w-5 h-5 ${auth.color.split(' ')[0]}`} />
          <span className={`font-medium ${auth.color.split(' ')[0]}`}>
            {auth.level}
          </span>
        </div>
        <div className={`${auth.color} rounded-full px-2 py-1 text-sm font-bold`}>
          {authenticityScore}%
        </div>
      </div>
      
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">Proof of Purchase</span>
          {verifications?.proofOfPurchase ? (
            <CheckCircle className="w-4 h-4 text-green-600" />
          ) : (
            <div className="w-4 h-4 rounded-full bg-gray-300" />
          )}
        </div>
        
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">IMEI/Serial Check</span>
          {verifications?.imeiCheck ? (
            <CheckCircle className="w-4 h-4 text-green-600" />
          ) : (
            <div className="w-4 h-4 rounded-full bg-gray-300" />
          )}
        </div>
        
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">Photo Verification</span>
          {verifications?.photoVerification ? (
            <CheckCircle className="w-4 h-4 text-green-600" />
          ) : (
            <div className="w-4 h-4 rounded-full bg-gray-300" />
          )}
        </div>
      </div>
    </div>
  );
};

// Seller Trust Card
export const SellerTrustCard = ({ seller, compact = false }) => {
  if (compact) {
    return (
      <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
        <img
          src={seller.avatar || '/api/placeholder/40/40'}
          alt={seller.name}
          className="w-10 h-10 rounded-full"
        />
        <div className="flex-1">
          <div className="flex items-center space-x-2">
            <span className="font-medium text-gray-900">{seller.name}</span>
            <TrustBadge tier={seller.tier} size="sm" showLabel={false} />
          </div>
          <TrustScore score={seller.trustScore} reviews={seller.reviewCount} size="sm" />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <div className="flex items-start space-x-4">
        <img
          src={seller.avatar || '/api/placeholder/80/80'}
          alt={seller.name}
          className="w-20 h-20 rounded-full"
        />
        <div className="flex-1">
          <div className="flex items-center space-x-3 mb-2">
            <h3 className="text-xl font-bold text-gray-900">{seller.name}</h3>
            <TrustBadge tier={seller.tier} size="lg" />
          </div>
          
          <TrustScore score={seller.trustScore} reviews={seller.reviewCount} />
          
          <div className="mt-4 grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600">Member Since</p>
              <p className="font-medium">{seller.memberSince}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Sales</p>
              <p className="font-medium">{seller.totalSales}</p>
            </div>
          </div>
          
          <div className="mt-4">
            <VerificationStatus verifications={seller.verifications} compact />
          </div>
        </div>
      </div>
    </div>
  );
};

// Trust Progress Bar
export const TrustProgress = ({ currentTier, progress }) => {
  const tiers = [
    { key: 'new', label: 'New Seller', color: 'bg-gray-400' },
    { key: 'verified', label: 'Verified Seller', color: 'bg-blue-500' },
    { key: 'trusted', label: 'Trusted Merchant', color: 'bg-green-500' },
    { key: 'premium', label: 'Premium Seller', color: 'bg-purple-500' }
  ];

  const currentIndex = tiers.findIndex(tier => tier.key === currentTier);

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <h3 className="text-lg font-medium text-gray-900 mb-4">Trust Level Progress</h3>
      
      <div className="space-y-4">
        {tiers.map((tier, index) => {
          const isCompleted = index < currentIndex;
          const isCurrent = index === currentIndex;
          const isLocked = index > currentIndex;
          
          return (
            <div key={tier.key} className="flex items-center space-x-4">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                isCompleted ? tier.color : 
                isCurrent ? `${tier.color} opacity-50` : 
                'bg-gray-200'
              }`}>
                {isCompleted && <CheckCircle className="w-5 h-5 text-white" />}
                {isCurrent && <div className="w-3 h-3 bg-white rounded-full" />}
                {isLocked && <div className="w-3 h-3 bg-gray-400 rounded-full" />}
              </div>
              
              <div className="flex-1">
                <p className={`font-medium ${
                  isCompleted || isCurrent ? 'text-gray-900' : 'text-gray-500'
                }`}>
                  {tier.label}
                </p>
                {isCurrent && (
                  <div className="mt-1">
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full ${tier.color}`}
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                    <p className="text-sm text-gray-600 mt-1">{progress}% complete</p>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// Safety Guarantee Badge
export const SafetyGuarantee = ({ hasEscrow, hasVerification, hasAuthenticity }) => {
  const guarantees = [
    { key: 'escrow', label: 'Payment Protection', active: hasEscrow, icon: Shield },
    { key: 'verification', label: 'Seller Verified', active: hasVerification, icon: CheckCircle },
    { key: 'authenticity', label: 'Product Authentic', active: hasAuthenticity, icon: Award }
  ];

  const activeCount = guarantees.filter(g => g.active).length;

  return (
    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
      <div className="flex items-center space-x-2 mb-3">
        <Shield className="w-5 h-5 text-green-600" />
        <span className="font-medium text-green-800">
          Xtrapush Safety Guarantee ({activeCount}/3)
        </span>
      </div>
      
      <div className="space-y-2">
        {guarantees.map(guarantee => {
          const Icon = guarantee.icon;
          return (
            <div key={guarantee.key} className="flex items-center space-x-2">
              <Icon className={`w-4 h-4 ${
                guarantee.active ? 'text-green-600' : 'text-gray-400'
              }`} />
              <span className={`text-sm ${
                guarantee.active ? 'text-green-800' : 'text-gray-500'
              }`}>
                {guarantee.label}
              </span>
              {guarantee.active && <CheckCircle className="w-3 h-3 text-green-600" />}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default {
  TrustBadge,
  VerificationStatus,
  TrustScore,
  AuthenticityBadge,
  SellerTrustCard,
  TrustProgress,
  SafetyGuarantee
};