import React, { useState, useRef } from 'react';
import { Upload, Camera, Phone, Mail, CheckCircle, AlertCircle, User, FileText, Shield } from 'lucide-react';

const SellerVerification = ({ onVerificationComplete }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [verificationData, setVerificationData] = useState({
    personalInfo: {
      firstName: '',
      lastName: '',
      dateOfBirth: '',
      address: '',
      city: '',
      country: '',
      postalCode: ''
    },
    idDocument: null,
    proofOfAddress: null,
    selfiePhoto: null,
    phoneNumber: '',
    phoneVerified: false,
    emailVerified: false,
    businessInfo: {
      isBusinessSeller: false,
      businessName: '',
      businessRegistration: null,
      taxId: ''
    }
  });
  
  const [verificationStatus, setVerificationStatus] = useState({
    idCheck: 'pending',
    selfieMatch: 'pending',
    phoneVerification: 'pending',
    emailVerification: 'pending',
    addressVerification: 'pending'
  });

  const fileInputRef = useRef(null);
  const cameraRef = useRef(null);
  const [isCameraActive, setIsCameraActive] = useState(false);

  const handleInputChange = (section, field, value) => {
    setVerificationData(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }));
  };

  const handleFileUpload = (field, file) => {
    setVerificationData(prev => ({
      ...prev,
      [field]: file
    }));
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (cameraRef.current) {
        cameraRef.current.srcObject = stream;
        setIsCameraActive(true);
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
      alert('Unable to access camera. Please upload a selfie instead.');
    }
  };

  const capturePhoto = () => {
    if (cameraRef.current) {
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      canvas.width = cameraRef.current.videoWidth;
      canvas.height = cameraRef.current.videoHeight;
      context.drawImage(cameraRef.current, 0, 0);
      
      canvas.toBlob(blob => {
        setVerificationData(prev => ({
          ...prev,
          selfiePhoto: blob
        }));
        setIsCameraActive(false);
        // Stop camera stream
        const stream = cameraRef.current.srcObject;
        const tracks = stream.getTracks();
        tracks.forEach(track => track.stop());
      });
    }
  };

  const sendPhoneVerification = async () => {
    // Simulate SMS verification
    const code = Math.floor(100000 + Math.random() * 900000);
    alert(`Verification code sent to ${verificationData.phoneNumber}: ${code}`);
    // In real implementation, integrate with SMS service like Twilio
  };

  const verifyPhone = () => {
    const code = prompt('Enter the 6-digit verification code:');
    if (code && code.length === 6) {
      setVerificationData(prev => ({ ...prev, phoneVerified: true }));
      setVerificationStatus(prev => ({ ...prev, phoneVerification: 'verified' }));
    }
  };

  const submitVerification = async () => {
    // Simulate verification process
    setVerificationStatus({
      idCheck: 'verified',
      selfieMatch: 'verified',
      phoneVerification: verificationData.phoneVerified ? 'verified' : 'pending',
      emailVerification: 'verified',
      addressVerification: 'verified'
    });

    // Determine seller tier based on verification
    let sellerTier = 'new';
    const allVerified = Object.values(verificationStatus).every(status => status === 'verified');
    
    if (allVerified) {
      sellerTier = verificationData.businessInfo.isBusinessSeller ? 'trusted_merchant' : 'verified_individual';
    }

    onVerificationComplete && onVerificationComplete({
      ...verificationData,
      sellerTier,
      verificationStatus
    });
  };

  const renderStep1 = () => (
    <div className="space-y-6">
      <div className="text-center">
        <User className="mx-auto h-12 w-12 text-blue-600" />
        <h3 className="mt-2 text-lg font-medium text-gray-900">Personal Information</h3>
        <p className="text-sm text-gray-500">Please provide your basic information</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <input
          type="text"
          placeholder="First Name"
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={verificationData.personalInfo.firstName}
          onChange={(e) => handleInputChange('personalInfo', 'firstName', e.target.value)}
        />
        <input
          type="text"
          placeholder="Last Name"
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={verificationData.personalInfo.lastName}
          onChange={(e) => handleInputChange('personalInfo', 'lastName', e.target.value)}
        />
        <input
          type="date"
          placeholder="Date of Birth"
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={verificationData.personalInfo.dateOfBirth}
          onChange={(e) => handleInputChange('personalInfo', 'dateOfBirth', e.target.value)}
        />
        <input
          type="tel"
          placeholder="Phone Number"
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={verificationData.phoneNumber}
          onChange={(e) => setVerificationData(prev => ({ ...prev, phoneNumber: e.target.value }))}
        />
      </div>

      <textarea
        placeholder="Full Address"
        rows="3"
        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        value={verificationData.personalInfo.address}
        onChange={(e) => handleInputChange('personalInfo', 'address', e.target.value)}
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <input
          type="text"
          placeholder="City"
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={verificationData.personalInfo.city}
          onChange={(e) => handleInputChange('personalInfo', 'city', e.target.value)}
        />
        <input
          type="text"
          placeholder="Country"
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={verificationData.personalInfo.country}
          onChange={(e) => handleInputChange('personalInfo', 'country', e.target.value)}
        />
        <input
          type="text"
          placeholder="Postal Code"
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={verificationData.personalInfo.postalCode}
          onChange={(e) => handleInputChange('personalInfo', 'postalCode', e.target.value)}
        />
      </div>

      {/* Business Seller Option */}
      <div className="border-t pt-4">
        <label className="flex items-center space-x-2">
          <input
            type="checkbox"
            checked={verificationData.businessInfo.isBusinessSeller}
            onChange={(e) => handleInputChange('businessInfo', 'isBusinessSeller', e.target.checked)}
            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <span className="text-sm text-gray-700">I'm selling as a business/company</span>
        </label>

        {verificationData.businessInfo.isBusinessSeller && (
          <div className="mt-4 space-y-3">
            <input
              type="text"
              placeholder="Business Name"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={verificationData.businessInfo.businessName}
              onChange={(e) => handleInputChange('businessInfo', 'businessName', e.target.value)}
            />
            <input
              type="text"
              placeholder="Tax ID / Business Registration Number"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={verificationData.businessInfo.taxId}
              onChange={(e) => handleInputChange('businessInfo', 'taxId', e.target.value)}
            />
          </div>
        )}
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6">
      <div className="text-center">
        <FileText className="mx-auto h-12 w-12 text-blue-600" />
        <h3 className="mt-2 text-lg font-medium text-gray-900">Document Verification</h3>
        <p className="text-sm text-gray-500">Upload your ID and proof of address</p>
      </div>

      {/* ID Document Upload */}
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
        <div className="text-center">
          <Upload className="mx-auto h-8 w-8 text-gray-400" />
          <h4 className="mt-2 text-sm font-medium text-gray-900">Government ID</h4>
          <p className="text-xs text-gray-500">Driver's License, Passport, or National ID</p>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => handleFileUpload('idDocument', e.target.files[0])}
            className="mt-2 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
          />
          {verificationData.idDocument && (
            <p className="mt-2 text-sm text-green-600">✓ ID document uploaded</p>
          )}
        </div>
      </div>

      {/* Proof of Address Upload */}
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
        <div className="text-center">
          <Upload className="mx-auto h-8 w-8 text-gray-400" />
          <h4 className="mt-2 text-sm font-medium text-gray-900">Proof of Address</h4>
          <p className="text-xs text-gray-500">Utility bill, bank statement (last 3 months)</p>
          <input
            type="file"
            accept="image/*,application/pdf"
            onChange={(e) => handleFileUpload('proofOfAddress', e.target.files[0])}
            className="mt-2 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
          />
          {verificationData.proofOfAddress && (
            <p className="mt-2 text-sm text-green-600">✓ Proof of address uploaded</p>
          )}
        </div>
      </div>

      {/* Business Documents (if applicable) */}
      {verificationData.businessInfo.isBusinessSeller && (
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
          <div className="text-center">
            <Upload className="mx-auto h-8 w-8 text-gray-400" />
            <h4 className="mt-2 text-sm font-medium text-gray-900">Business Registration</h4>
            <p className="text-xs text-gray-500">Certificate of incorporation or business license</p>
            <input
              type="file"
              accept="image/*,application/pdf"
              onChange={(e) => handleFileUpload('businessRegistration', e.target.files[0])}
              className="mt-2 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
            {verificationData.businessInfo.businessRegistration && (
              <p className="mt-2 text-sm text-green-600">✓ Business registration uploaded</p>
            )}
          </div>
        </div>
      )}
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-6">
      <div className="text-center">
        <Camera className="mx-auto h-12 w-12 text-blue-600" />
        <h3 className="mt-2 text-lg font-medium text-gray-900">Selfie Verification</h3>
        <p className="text-sm text-gray-500">Take a live selfie to match with your ID</p>
      </div>

      {!isCameraActive && !verificationData.selfiePhoto && (
        <div className="text-center space-y-4">
          <button
            onClick={startCamera}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <Camera className="mr-2 h-4 w-4" />
            Start Camera
          </button>
          <p className="text-sm text-gray-500">Or upload a selfie photo</p>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => handleFileUpload('selfiePhoto', e.target.files[0])}
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
          />
        </div>
      )}

      {isCameraActive && (
        <div className="text-center space-y-4">
          <video
            ref={cameraRef}
            autoPlay
            playsInline
            className="w-full max-w-md mx-auto rounded-lg border"
          />
          <button
            onClick={capturePhoto}
            className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            Capture Photo
          </button>
        </div>
      )}

      {verificationData.selfiePhoto && (
        <div className="text-center">
          <p className="text-sm text-green-600">✓ Selfie captured successfully</p>
        </div>
      )}
    </div>
  );

  const renderStep4 = () => (
    <div className="space-y-6">
      <div className="text-center">
        <Shield className="mx-auto h-12 w-12 text-blue-600" />
        <h3 className="mt-2 text-lg font-medium text-gray-900">Contact Verification</h3>
        <p className="text-sm text-gray-500">Verify your phone number and email</p>
      </div>

      {/* Phone Verification */}
      <div className="border rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Phone className="h-5 w-5 text-gray-400" />
            <span className="text-sm font-medium">Phone: {verificationData.phoneNumber}</span>
          </div>
          {verificationData.phoneVerified ? (
            <CheckCircle className="h-5 w-5 text-green-500" />
          ) : (
            <div className="space-x-2">
              <button
                onClick={sendPhoneVerification}
                className="text-sm bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700"
              >
                Send Code
              </button>
              <button
                onClick={verifyPhone}
                className="text-sm bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700"
              >
                Verify
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Email Verification */}
      <div className="border rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Mail className="h-5 w-5 text-gray-400" />
            <span className="text-sm font-medium">Email verification will be sent after submission</span>
          </div>
          <AlertCircle className="h-5 w-5 text-yellow-500" />
        </div>
      </div>

      {/* Verification Summary */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h4 className="text-sm font-medium text-gray-900 mb-3">Verification Summary</h4>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span>Personal Information</span>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </div>
          <div className="flex justify-between">
            <span>ID Document</span>
            {verificationData.idDocument ? (
              <CheckCircle className="h-4 w-4 text-green-500" />
            ) : (
              <AlertCircle className="h-4 w-4 text-yellow-500" />
            )}
          </div>
          <div className="flex justify-between">
            <span>Selfie Photo</span>
            {verificationData.selfiePhoto ? (
              <CheckCircle className="h-4 w-4 text-green-500" />
            ) : (
              <AlertCircle className="h-4 w-4 text-yellow-500" />
            )}
          </div>
          <div className="flex justify-between">
            <span>Phone Verification</span>
            {verificationData.phoneVerified ? (
              <CheckCircle className="h-4 w-4 text-green-500" />
            ) : (
              <AlertCircle className="h-4 w-4 text-yellow-500" />
            )}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      {/* Progress Bar */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          {[1, 2, 3, 4].map((step) => (
            <div
              key={step}
              className={`flex items-center justify-center w-8 h-8 rounded-full ${
                currentStep >= step ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
              }`}
            >
              {step}
            </div>
          ))}
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${(currentStep / 4) * 100}%` }}
          ></div>
        </div>
      </div>

      {/* Step Content */}
      {currentStep === 1 && renderStep1()}
      {currentStep === 2 && renderStep2()}
      {currentStep === 3 && renderStep3()}
      {currentStep === 4 && renderStep4()}

      {/* Navigation Buttons */}
      <div className="flex justify-between mt-8">
        <button
          onClick={() => setCurrentStep(Math.max(1, currentStep - 1))}
          disabled={currentStep === 1}
          className="px-4 py-2 text-gray-600 bg-gray-200 rounded-md hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Previous
        </button>
        
        {currentStep < 4 ? (
          <button
            onClick={() => setCurrentStep(Math.min(4, currentStep + 1))}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Next
          </button>
        ) : (
          <button
            onClick={submitVerification}
            className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            Submit Verification
          </button>
        )}
      </div>
    </div>
  );
};

export default SellerVerification;