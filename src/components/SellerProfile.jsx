import React, { useState } from 'react';
import { MapPin, Calendar, Package, Star, Shield, Eye, MessageCircle, Flag } from 'lucide-react';
import SellerBadge from './SellerBadge';

const SellerProfile = ({ seller, onContactSeller, onReportSeller }) => {
  const [showFullProfile, setShowFullProfile] = useState(false);

  const {
    id,
    name,
    avatar,
    sellerTier = 'new',
    verificationStatus = {},
    location,
    joinDate,
    totalSales = 0,
    rating = 0,
    reviewCount = 0,
    responseTime = '2 hours',
    activeListings = 0,
    description = '',
    businessInfo = null,
    lastSeen = new Date()
  } = seller;

  const formatJoinDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long' 
    });
  };

  const formatLastSeen = (date) => {
    const now = new Date();
    const diff = now - new Date(date);
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);
    
    if (hours < 1) return 'Active now';
    if (hours < 24) return `Active ${hours}h ago`;
    if (days < 7) return `Active ${days}d ago`;
    return 'Active over a week ago';
  };

  const renderStars = (rating) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`h-4 w-4 ${
          i < Math.floor(rating) 
            ? 'text-yellow-400 fill-current' 
            : 'text-gray-300'
        }`}
      />
    ));
  };

  const getTrustScore = () => {
    let score = 0;
    
    // Base score for tier
    switch (sellerTier) {
      case 'trusted_merchant': score += 40; break;
      case 'verified_individual': score += 30; break;
      case 'new': score += 10; break;
    }
    
    // Verification completeness (max 30 points)
    const verificationKeys = Object.keys(verificationStatus);
    if (verificationKeys.length > 0) {
      const verified = verificationKeys.filter(key => verificationStatus[key] === 'verified').length;
      score += (verified / verificationKeys.length) * 30;
    }
    
    // Sales history (max 20 points)
    if (totalSales > 0) {
      score += Math.min(20, totalSales * 2);
    }
    
    // Rating (max 10 points)
    if (rating > 0) {
      score += (rating / 5) * 10;
    }
    
    return Math.min(100, Math.round(score));
  };

  const trustScore = getTrustScore();

  if (!showFullProfile) {
    // Compact seller card view
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow">
        <div className="flex items-start space-x-3">
          {/* Avatar */}
          <div className="flex-shrink-0">
            <img
              src={avatar || '/api/placeholder/48/48'}
              alt={name}
              className="h-12 w-12 rounded-full object-cover"
            />
          </div>
          
          {/* Seller Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2 mb-1">
              <h3 className="text-sm font-medium text-gray-900 truncate">{name}</h3>
              <SellerBadge 
                sellerTier={sellerTier} 
                verificationStatus={verificationStatus}
                rating={rating}
                size="small"
              />
            </div>
            
            <div className="flex items-center space-x-4 text-xs text-gray-500 mb-2">
              {rating > 0 && (
                <div className="flex items-center space-x-1">
                  <div className="flex">{renderStars(rating)}</div>
                  <span>({reviewCount})</span>
                </div>
              )}
              
              {location && (
                <div className="flex items-center space-x-1">
                  <MapPin className="h-3 w-3" />
                  <span>{location}</span>
                </div>
              )}
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500">
                {totalSales} sales • {formatLastSeen(lastSeen)}
              </span>
              
              <button
                onClick={() => setShowFullProfile(true)}
                className="text-xs text-blue-600 hover:text-blue-800 flex items-center space-x-1"
              >
                <Eye className="h-3 w-3" />
                <span>View Profile</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Full profile view
  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-lg max-w-2xl mx-auto">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-start space-x-4">
          <img
            src={avatar || '/api/placeholder/80/80'}
            alt={name}
            className="h-20 w-20 rounded-full object-cover"
          />
          
          <div className="flex-1">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-xl font-bold text-gray-900">{name}</h2>
              <button
                onClick={() => setShowFullProfile(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            </div>
            
            <SellerBadge 
              sellerTier={sellerTier} 
              verificationStatus={verificationStatus}
              rating={rating}
              salesCount={totalSales}
              joinDate={joinDate}
              showDetails={true}
            />
          </div>
        </div>
      </div>

      {/* Trust Score */}
      <div className="p-6 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-medium text-gray-900 flex items-center">
            <Shield className="h-5 w-5 text-blue-600 mr-2" />
            Trust Score
          </h3>
          <span className={`text-2xl font-bold ${
            trustScore >= 80 ? 'text-green-600' : 
            trustScore >= 60 ? 'text-yellow-600' : 'text-red-600'
          }`}>
            {trustScore}/100
          </span>
        </div>
        
        <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
          <div
            className={`h-2 rounded-full transition-all duration-300 ${
              trustScore >= 80 ? 'bg-green-500' : 
              trustScore >= 60 ? 'bg-yellow-500' : 'bg-red-500'
            }`}
            style={{ width: `${trustScore}%` }}
          ></div>
        </div>
        
        <p className="text-sm text-gray-600">
          {trustScore >= 80 ? 'Highly trusted seller with excellent track record' :
           trustScore >= 60 ? 'Reliable seller with good verification status' :
           'New seller - exercise caution and use secure payment methods'}
        </p>
      </div>

      {/* Stats */}
      <div className="p-6 border-b border-gray-200">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">{totalSales}</div>
            <div className="text-sm text-gray-500">Total Sales</div>
          </div>
          
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">{rating.toFixed(1)}</div>
            <div className="text-sm text-gray-500">Rating</div>
          </div>
          
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">{activeListings}</div>
            <div className="text-sm text-gray-500">Active Listings</div>
          </div>
          
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">{responseTime}</div>
            <div className="text-sm text-gray-500">Response Time</div>
          </div>
        </div>
      </div>

      {/* Details */}
      <div className="p-6 space-y-4">
        {/* Location & Join Date */}
        <div className="flex items-center space-x-6 text-sm text-gray-600">
          {location && (
            <div className="flex items-center space-x-1">
              <MapPin className="h-4 w-4" />
              <span>{location}</span>
            </div>
          )}
          
          <div className="flex items-center space-x-1">
            <Calendar className="h-4 w-4" />
            <span>Joined {formatJoinDate(joinDate)}</span>
          </div>
          
          <div className="flex items-center space-x-1">
            <Package className="h-4 w-4" />
            <span>{formatLastSeen(lastSeen)}</span>
          </div>
        </div>

        {/* Business Info */}
        {businessInfo && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-medium text-blue-900 mb-2">Business Information</h4>
            <p className="text-sm text-blue-800">{businessInfo.name}</p>
            {businessInfo.registrationNumber && (
              <p className="text-xs text-blue-600">Reg: {businessInfo.registrationNumber}</p>
            )}
          </div>
        )}

        {/* Description */}
        {description && (
          <div>
            <h4 className="font-medium text-gray-900 mb-2">About</h4>
            <p className="text-sm text-gray-600">{description}</p>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="p-6 border-t border-gray-200 bg-gray-50">
        <div className="flex space-x-3">
          <button
            onClick={() => onContactSeller && onContactSeller(seller)}
            className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 flex items-center justify-center space-x-2"
          >
            <MessageCircle className="h-4 w-4" />
            <span>Contact Seller</span>
          </button>
          
          <button
            onClick={() => onReportSeller && onReportSeller(seller)}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 flex items-center space-x-2"
          >
            <Flag className="h-4 w-4" />
            <span>Report</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default SellerProfile;