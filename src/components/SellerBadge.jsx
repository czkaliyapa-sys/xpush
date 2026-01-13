import React from 'react';
import { Shield, Star, Building, User, CheckCircle, AlertTriangle } from 'lucide-react';

const SellerBadge = ({ 
  sellerTier = 'new', 
  verificationStatus = {}, 
  salesCount = 0, 
  rating = 0, 
  joinDate = null,
  size = 'medium',
  showDetails = false 
}) => {
  const getTierConfig = (tier) => {
    switch (tier) {
      case 'trusted_merchant':
        return {
          label: 'Trusted Merchant',
          icon: Building,
          bgColor: 'bg-purple-100',
          textColor: 'text-purple-800',
          borderColor: 'border-purple-300',
          iconColor: 'text-purple-600',
          description: 'Verified business with complete documentation'
        };
      case 'verified_individual':
        return {
          label: 'Verified Seller',
          icon: CheckCircle,
          bgColor: 'bg-green-100',
          textColor: 'text-green-800',
          borderColor: 'border-green-300',
          iconColor: 'text-green-600',
          description: 'Identity verified with successful sales history'
        };
      case 'new':
      default:
        return {
          label: 'New Seller',
          icon: User,
          bgColor: 'bg-yellow-100',
          textColor: 'text-yellow-800',
          borderColor: 'border-yellow-300',
          iconColor: 'text-yellow-600',
          description: 'New to the platform, limited listings allowed'
        };
    }
  };

  const getSizeClasses = (size) => {
    switch (size) {
      case 'small':
        return {
          container: 'px-2 py-1 text-xs',
          icon: 'h-3 w-3',
          text: 'text-xs'
        };
      case 'large':
        return {
          container: 'px-4 py-2 text-base',
          icon: 'h-5 w-5',
          text: 'text-base'
        };
      case 'medium':
      default:
        return {
          container: 'px-3 py-1.5 text-sm',
          icon: 'h-4 w-4',
          text: 'text-sm'
        };
    }
  };

  const tierConfig = getTierConfig(sellerTier);
  const sizeClasses = getSizeClasses(size);
  const IconComponent = tierConfig.icon;

  const getVerificationScore = () => {
    const checks = Object.values(verificationStatus);
    const verified = checks.filter(status => status === 'verified').length;
    return checks.length > 0 ? Math.round((verified / checks.length) * 100) : 0;
  };

  const renderStars = (rating) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`h-3 w-3 ${
          i < Math.floor(rating) 
            ? 'text-yellow-400 fill-current' 
            : 'text-gray-300'
        }`}
      />
    ));
  };

  if (showDetails) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
        {/* Main Badge */}
        <div className={`inline-flex items-center rounded-full border ${tierConfig.borderColor} ${tierConfig.bgColor} ${sizeClasses.container}`}>
          <IconComponent className={`${sizeClasses.icon} ${tierConfig.iconColor} mr-2`} />
          <span className={`font-medium ${tierConfig.textColor} ${sizeClasses.text}`}>
            {tierConfig.label}
          </span>
        </div>

        {/* Detailed Information */}
        <div className="mt-3 space-y-2">
          <p className="text-sm text-gray-600">{tierConfig.description}</p>
          
          {/* Stats Row */}
          <div className="flex items-center space-x-4 text-sm text-gray-500">
            {rating > 0 && (
              <div className="flex items-center space-x-1">
                <div className="flex">{renderStars(rating)}</div>
                <span>({rating.toFixed(1)})</span>
              </div>
            )}
            
            {salesCount > 0 && (
              <span>{salesCount} sales</span>
            )}
            
            {joinDate && (
              <span>Joined {new Date(joinDate).getFullYear()}</span>
            )}
          </div>

          {/* Verification Status */}
          {Object.keys(verificationStatus).length > 0 && (
            <div className="mt-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">Verification</span>
                <span className="text-sm text-gray-500">{getVerificationScore()}% complete</span>
              </div>
              
              <div className="grid grid-cols-2 gap-2 text-xs">
                {Object.entries(verificationStatus).map(([key, status]) => (
                  <div key={key} className="flex items-center space-x-1">
                    {status === 'verified' ? (
                      <CheckCircle className="h-3 w-3 text-green-500" />
                    ) : (
                      <AlertTriangle className="h-3 w-3 text-yellow-500" />
                    )}
                    <span className="capitalize text-gray-600">
                      {key.replace(/([A-Z])/g, ' $1').toLowerCase()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Simple badge view
  return (
    <div className={`inline-flex items-center rounded-full border ${tierConfig.borderColor} ${tierConfig.bgColor} ${sizeClasses.container}`}>
      <IconComponent className={`${sizeClasses.icon} ${tierConfig.iconColor} mr-2`} />
      <span className={`font-medium ${tierConfig.textColor} ${sizeClasses.text}`}>
        {tierConfig.label}
      </span>
      
      {rating > 0 && size !== 'small' && (
        <div className="ml-2 flex items-center space-x-1">
          <Star className="h-3 w-3 text-yellow-400 fill-current" />
          <span className={`${tierConfig.textColor} ${sizeClasses.text}`}>
            {rating.toFixed(1)}
          </span>
        </div>
      )}
    </div>
  );
};

export default SellerBadge;