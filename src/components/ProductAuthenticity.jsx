import React, { useState, useRef } from 'react';
import { Upload, Camera, Shield, CheckCircle, AlertTriangle, Smartphone, Receipt, Image, Search, X } from 'lucide-react';

const ProductAuthenticity = ({ product, onVerificationComplete }) => {
  const [verificationData, setVerificationData] = useState({
    proofOfPurchase: null,
    productPhotos: [],
    imeiNumber: '',
    serialNumber: '',
    warrantyInfo: null,
    originalPackaging: false,
    accessories: [],
    condition: 'excellent',
    purchaseDate: '',
    purchasePrice: '',
    retailer: ''
  });

  const [verificationStatus, setVerificationStatus] = useState({
    proofOfPurchase: 'pending',
    imeiCheck: 'pending',
    photoVerification: 'pending',
    serialVerification: 'pending'
  });

  const [imeiCheckResult, setImeiCheckResult] = useState(null);
  const [isCheckingImei, setIsCheckingImei] = useState(false);
  const fileInputRef = useRef(null);
  const photoInputRef = useRef(null);

  const productCategories = {
    smartphone: {
      name: 'Smartphone',
      requiredFields: ['imeiNumber', 'proofOfPurchase', 'productPhotos'],
      optionalFields: ['serialNumber', 'warrantyInfo'],
      minPhotos: 4,
      photoRequirements: ['Front view', 'Back view', 'IMEI sticker/settings', 'Original packaging']
    },
    laptop: {
      name: 'Laptop',
      requiredFields: ['serialNumber', 'proofOfPurchase', 'productPhotos'],
      optionalFields: ['warrantyInfo'],
      minPhotos: 3,
      photoRequirements: ['Front view', 'Serial number sticker', 'Original packaging']
    },
    tablet: {
      name: 'Tablet',
      requiredFields: ['serialNumber', 'proofOfPurchase', 'productPhotos'],
      optionalFields: ['imeiNumber', 'warrantyInfo'],
      minPhotos: 3,
      photoRequirements: ['Front view', 'Back view', 'Serial number']
    },
    watch: {
      name: 'Smartwatch',
      requiredFields: ['serialNumber', 'proofOfPurchase', 'productPhotos'],
      optionalFields: ['imeiNumber', 'warrantyInfo'],
      minPhotos: 3,
      photoRequirements: ['Front view', 'Back view', 'Serial number']
    },
    default: {
      name: 'Electronics',
      requiredFields: ['proofOfPurchase', 'productPhotos'],
      optionalFields: ['serialNumber', 'warrantyInfo'],
      minPhotos: 2,
      photoRequirements: ['Product view', 'Serial/model number']
    }
  };

  const getCurrentCategory = () => {
    const category = product?.category?.toLowerCase() || 'default';
    return productCategories[category] || productCategories.default;
  };

  const handleInputChange = (field, value) => {
    setVerificationData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleFileUpload = (field, file) => {
    if (field === 'productPhotos') {
      setVerificationData(prev => ({
        ...prev,
        productPhotos: [...prev.productPhotos, file]
      }));
    } else {
      setVerificationData(prev => ({
        ...prev,
        [field]: file
      }));
    }
  };

  const removePhoto = (index) => {
    setVerificationData(prev => ({
      ...prev,
      productPhotos: prev.productPhotos.filter((_, i) => i !== index)
    }));
  };

  const checkImei = async (imei) => {
    if (!imei || imei.length < 15) {
      alert('Please enter a valid 15-digit IMEI number');
      return;
    }

    setIsCheckingImei(true);
    
    try {
      // Simulate IMEI check API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Mock IMEI check result
      const mockResult = {
        valid: true,
        stolen: false,
        blacklisted: false,
        brand: 'Apple',
        model: 'iPhone 15 Pro',
        warranty: 'Active',
        carrier: 'Unlocked',
        country: 'USA'
      };

      setImeiCheckResult(mockResult);
      setVerificationStatus(prev => ({
        ...prev,
        imeiCheck: mockResult.valid && !mockResult.stolen && !mockResult.blacklisted ? 'verified' : 'failed'
      }));
    } catch (error) {
      console.error('IMEI check failed:', error);
      setImeiCheckResult({ error: 'Unable to verify IMEI. Please try again.' });
      setVerificationStatus(prev => ({ ...prev, imeiCheck: 'failed' }));
    } finally {
      setIsCheckingImei(false);
    }
  };

  const validatePhotos = () => {
    const category = getCurrentCategory();
    const hasMinPhotos = verificationData.productPhotos.length >= category.minPhotos;
    
    setVerificationStatus(prev => ({
      ...prev,
      photoVerification: hasMinPhotos ? 'verified' : 'pending'
    }));
    
    return hasMinPhotos;
  };

  const submitVerification = async () => {
    const category = getCurrentCategory();
    
    // Check required fields
    const missingFields = category.requiredFields.filter(field => {
      if (field === 'productPhotos') {
        return verificationData.productPhotos.length < category.minPhotos;
      }
      return !verificationData[field];
    });

    if (missingFields.length > 0) {
      alert(`Please complete the following required fields: ${missingFields.join(', ')}`);
      return;
    }

    // Validate photos
    validatePhotos();

    // Update verification status
    const newStatus = {
      proofOfPurchase: verificationData.proofOfPurchase ? 'verified' : 'pending',
      photoVerification: verificationData.productPhotos.length >= category.minPhotos ? 'verified' : 'pending',
      imeiCheck: verificationData.imeiNumber ? (imeiCheckResult?.valid ? 'verified' : 'pending') : 'not_applicable',
      serialVerification: verificationData.serialNumber ? 'verified' : 'not_applicable'
    };

    setVerificationStatus(newStatus);

    // Calculate authenticity score
    const verifiedCount = Object.values(newStatus).filter(status => status === 'verified').length;
    const totalChecks = Object.values(newStatus).filter(status => status !== 'not_applicable').length;
    const authenticityScore = totalChecks > 0 ? Math.round((verifiedCount / totalChecks) * 100) : 0;

    onVerificationComplete && onVerificationComplete({
      ...verificationData,
      verificationStatus: newStatus,
      authenticityScore,
      category: category.name
    });
  };

  const category = getCurrentCategory();

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <div className="text-center mb-8">
        <Shield className="mx-auto h-12 w-12 text-blue-600" />
        <h2 className="mt-2 text-2xl font-bold text-gray-900">Product Authenticity Verification</h2>
        <p className="text-sm text-gray-500">
          Verify your {category.name.toLowerCase()} to build buyer confidence
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Column - Product Information */}
        <div className="space-y-6">
          {/* Product Details */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Product Information</h3>
            
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="date"
                  placeholder="Purchase Date"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={verificationData.purchaseDate}
                  onChange={(e) => handleInputChange('purchaseDate', e.target.value)}
                />
                <input
                  type="number"
                  placeholder="Purchase Price ($)"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={verificationData.purchasePrice}
                  onChange={(e) => handleInputChange('purchasePrice', e.target.value)}
                />
              </div>
              
              <input
                type="text"
                placeholder="Retailer/Store Name"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={verificationData.retailer}
                onChange={(e) => handleInputChange('retailer', e.target.value)}
              />

              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={verificationData.condition}
                onChange={(e) => handleInputChange('condition', e.target.value)}
              >
                <option value="excellent">Excellent - Like new</option>
                <option value="very_good">Very Good - Minor wear</option>
                <option value="good">Good - Visible wear</option>
                <option value="fair">Fair - Heavy wear</option>
              </select>
            </div>
          </div>

          {/* IMEI/Serial Number */}
          {category.requiredFields.includes('imeiNumber') && (
            <div className="bg-blue-50 rounded-lg p-4">
              <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                <Smartphone className="mr-2 h-5 w-5 text-blue-600" />
                IMEI Verification
              </h3>
              
              <div className="space-y-3">
                <input
                  type="text"
                  placeholder="Enter 15-digit IMEI number"
                  maxLength="15"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={verificationData.imeiNumber}
                  onChange={(e) => handleInputChange('imeiNumber', e.target.value.replace(/\D/g, ''))}
                />
                
                <button
                  onClick={() => checkImei(verificationData.imeiNumber)}
                  disabled={isCheckingImei || verificationData.imeiNumber.length !== 15}
                  className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                >
                  {isCheckingImei ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Checking IMEI...</span>
                    </>
                  ) : (
                    <>
                      <Search className="h-4 w-4" />
                      <span>Check IMEI</span>
                    </>
                  )}
                </button>

                {imeiCheckResult && (
                  <div className={`p-3 rounded-md ${
                    imeiCheckResult.error ? 'bg-red-50 border border-red-200' :
                    imeiCheckResult.valid && !imeiCheckResult.stolen ? 'bg-green-50 border border-green-200' :
                    'bg-red-50 border border-red-200'
                  }`}>
                    {imeiCheckResult.error ? (
                      <p className="text-red-800 text-sm">{imeiCheckResult.error}</p>
                    ) : (
                      <div className="text-sm">
                        <div className="flex items-center space-x-2 mb-2">
                          {imeiCheckResult.valid && !imeiCheckResult.stolen ? (
                            <CheckCircle className="h-4 w-4 text-green-600" />
                          ) : (
                            <AlertTriangle className="h-4 w-4 text-red-600" />
                          )}
                          <span className={`font-medium ${
                            imeiCheckResult.valid && !imeiCheckResult.stolen ? 'text-green-800' : 'text-red-800'
                          }`}>
                            {imeiCheckResult.valid && !imeiCheckResult.stolen ? 'IMEI Verified' : 'IMEI Issue Detected'}
                          </span>
                        </div>
                        
                        <div className="space-y-1 text-gray-700">
                          <p><strong>Brand:</strong> {imeiCheckResult.brand}</p>
                          <p><strong>Model:</strong> {imeiCheckResult.model}</p>
                          <p><strong>Status:</strong> {imeiCheckResult.stolen ? 'Reported Stolen' : 'Clean'}</p>
                          <p><strong>Carrier:</strong> {imeiCheckResult.carrier}</p>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Serial Number */}
          {category.requiredFields.includes('serialNumber') && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Serial Number *
              </label>
              <input
                type="text"
                placeholder="Enter product serial number"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={verificationData.serialNumber}
                onChange={(e) => handleInputChange('serialNumber', e.target.value)}
              />
            </div>
          )}
        </div>

        {/* Right Column - Documents & Photos */}
        <div className="space-y-6">
          {/* Proof of Purchase */}
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
            <div className="text-center">
              <Receipt className="mx-auto h-8 w-8 text-gray-400" />
              <h4 className="mt-2 text-sm font-medium text-gray-900">Proof of Purchase *</h4>
              <p className="text-xs text-gray-500">Receipt, invoice, or order confirmation</p>
              <input
                type="file"
                accept="image/*,application/pdf"
                onChange={(e) => handleFileUpload('proofOfPurchase', e.target.files[0])}
                className="mt-2 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              />
              {verificationData.proofOfPurchase && (
                <p className="mt-2 text-sm text-green-600">✓ Proof of purchase uploaded</p>
              )}
            </div>
          </div>

          {/* Product Photos */}
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
            <div className="text-center mb-4">
              <Image className="mx-auto h-8 w-8 text-gray-400" />
              <h4 className="mt-2 text-sm font-medium text-gray-900">
                Product Photos * (Min: {category.minPhotos})
              </h4>
              <p className="text-xs text-gray-500">
                Required: {category.photoRequirements.join(', ')}
              </p>
            </div>

            <input
              ref={photoInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={(e) => {
                Array.from(e.target.files).forEach(file => {
                  handleFileUpload('productPhotos', file);
                });
              }}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />

            {/* Photo Preview */}
            {verificationData.productPhotos.length > 0 && (
              <div className="mt-4 grid grid-cols-2 gap-2">
                {verificationData.productPhotos.map((photo, index) => (
                  <div key={index} className="relative">
                    <img
                      src={URL.createObjectURL(photo)}
                      alt={`Product ${index + 1}`}
                      className="w-full h-24 object-cover rounded border"
                    />
                    <button
                      onClick={() => removePhoto(index)}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <p className="mt-2 text-sm text-gray-600">
              {verificationData.productPhotos.length}/{category.minPhotos} photos uploaded
            </p>
          </div>

          {/* Warranty Information */}
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
            <div className="text-center">
              <Shield className="mx-auto h-8 w-8 text-gray-400" />
              <h4 className="mt-2 text-sm font-medium text-gray-900">Warranty Information</h4>
              <p className="text-xs text-gray-500">Warranty card or documentation (optional)</p>
              <input
                type="file"
                accept="image/*,application/pdf"
                onChange={(e) => handleFileUpload('warrantyInfo', e.target.files[0])}
                className="mt-2 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              />
              {verificationData.warrantyInfo && (
                <p className="mt-2 text-sm text-green-600">✓ Warranty info uploaded</p>
              )}
            </div>
          </div>

          {/* Additional Options */}
          <div className="space-y-3">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={verificationData.originalPackaging}
                onChange={(e) => handleInputChange('originalPackaging', e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">Includes original packaging</span>
            </label>
          </div>
        </div>
      </div>

      {/* Submit Button */}
      <div className="mt-8 text-center">
        <button
          onClick={submitVerification}
          className="bg-green-600 text-white px-8 py-3 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 text-lg font-medium"
        >
          Submit Authenticity Verification
        </button>
        
        <p className="mt-2 text-sm text-gray-500">
          Verification helps build buyer trust and may increase your selling price
        </p>
      </div>
    </div>
  );
};

export default ProductAuthenticity;