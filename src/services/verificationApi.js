// Verification API Service for Xtrapush
// Handles seller verification, product authenticity, escrow transactions, and trust management

// Align with main API config: use '/api' in development (proxied),
// and the production backend URL when building for production.
const API_BASE_URL = process.env.REACT_APP_API_URL || (
  process.env.NODE_ENV === 'development' ? '/api' : 'https://sparkle-pro.co.uk/api'
);

class VerificationAPI {
  constructor() {
    this.baseURL = API_BASE_URL;
    this.token = localStorage.getItem('authToken');
  }

  // Helper method for API requests
  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...(this.token && { Authorization: `Bearer ${this.token}` }),
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error(`API request failed: ${endpoint}`, error);
      throw error;
    }
  }

  // Helper method for file uploads
  async uploadFile(endpoint, file, additionalData = {}) {
    const formData = new FormData();
    formData.append('file', file);
    
    Object.keys(additionalData).forEach(key => {
      formData.append(key, additionalData[key]);
    });

    return this.request(endpoint, {
      method: 'POST',
      headers: {
        ...(this.token && { Authorization: `Bearer ${this.token}` }),
      },
      body: formData,
    });
  }

  // ==================== SELLER VERIFICATION ====================

  // Submit seller verification documents
  async submitSellerVerification(verificationData) {
    const { idDocument, selfiePhoto, addressProof, ...otherData } = verificationData;
    
    // Upload documents first
    const uploadPromises = [];
    
    if (idDocument) {
      uploadPromises.push(
        this.uploadFile('/verification/upload-id', idDocument, { type: 'id_document' })
      );
    }
    
    if (selfiePhoto) {
      uploadPromises.push(
        this.uploadFile('/verification/upload-selfie', selfiePhoto, { type: 'selfie' })
      );
    }
    
    if (addressProof) {
      uploadPromises.push(
        this.uploadFile('/verification/upload-address', addressProof, { type: 'address_proof' })
      );
    }

    const uploadResults = await Promise.all(uploadPromises);
    
    // Submit verification with document URLs
    return this.request('/verification/seller', {
      method: 'POST',
      body: JSON.stringify({
        ...otherData,
        documents: uploadResults.map(result => result.data),
      }),
    });
  }

  // Get seller verification status
  async getSellerVerificationStatus(sellerId) {
    return this.request(`/verification/seller/${sellerId}`);
  }

  // Update verification status (admin only)
  async updateVerificationStatus(sellerId, status, notes = '') {
    return this.request(`/verification/seller/${sellerId}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status, notes }),
    });
  }

  // Verify phone number
  async verifyPhone(phoneNumber) {
    return this.request('/verification/phone/send-code', {
      method: 'POST',
      body: JSON.stringify({ phoneNumber }),
    });
  }

  // Confirm phone verification code
  async confirmPhoneVerification(phoneNumber, code) {
    return this.request('/verification/phone/verify-code', {
      method: 'POST',
      body: JSON.stringify({ phoneNumber, code }),
    });
  }

  // Verify email address
  async verifyEmail(email) {
    return this.request('/verification/email/send-verification', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  }

  // Confirm email verification
  async confirmEmailVerification(token) {
    return this.request('/verification/email/confirm', {
      method: 'POST',
      body: JSON.stringify({ token }),
    });
  }

  // ==================== SELLER TIER MANAGEMENT ====================

  // Get seller tier information
  async getSellerTier(sellerId) {
    return this.request(`/sellers/${sellerId}/tier`);
  }

  // Calculate and update seller tier
  async updateSellerTier(sellerId) {
    return this.request(`/sellers/${sellerId}/tier/calculate`, {
      method: 'POST',
    });
  }

  // Get tier requirements
  async getTierRequirements() {
    return this.request('/sellers/tier-requirements');
  }

  // Get seller trust score
  async getTrustScore(sellerId) {
    return this.request(`/sellers/${sellerId}/trust-score`);
  }

  // ==================== PRODUCT AUTHENTICITY ====================

  // Submit product authenticity verification
  async submitProductAuthenticity(productId, authenticityData) {
    const { proofOfPurchase, productPhotos, warrantyInfo, ...otherData } = authenticityData;
    
    const uploadPromises = [];
    
    if (proofOfPurchase) {
      uploadPromises.push(
        this.uploadFile('/products/upload-proof', proofOfPurchase, { 
          productId, 
          type: 'proof_of_purchase' 
        })
      );
    }
    
    if (warrantyInfo) {
      uploadPromises.push(
        this.uploadFile('/products/upload-warranty', warrantyInfo, { 
          productId, 
          type: 'warranty' 
        })
      );
    }
    
    // Upload multiple product photos
    if (productPhotos && productPhotos.length > 0) {
      productPhotos.forEach((photo, index) => {
        uploadPromises.push(
          this.uploadFile('/products/upload-photo', photo, { 
            productId, 
            type: 'product_photo',
            index 
          })
        );
      });
    }

    const uploadResults = await Promise.all(uploadPromises);
    
    return this.request(`/products/${productId}/authenticity`, {
      method: 'POST',
      body: JSON.stringify({
        ...otherData,
        documents: uploadResults.map(result => result.data),
      }),
    });
  }

  // Check IMEI number
  async checkIMEI(imeiNumber) {
    return this.request('/verification/imei-check', {
      method: 'POST',
      body: JSON.stringify({ imeiNumber }),
    });
  }

  // Verify serial number
  async verifySerialNumber(serialNumber, brand, model) {
    return this.request('/verification/serial-check', {
      method: 'POST',
      body: JSON.stringify({ serialNumber, brand, model }),
    });
  }

  // Get product authenticity status
  async getProductAuthenticity(productId) {
    return this.request(`/products/${productId}/authenticity`);
  }

  // ==================== ESCROW TRANSACTIONS ====================

  // Create escrow transaction
  async createEscrowTransaction(transactionData) {
    return this.request('/escrow/create', {
      method: 'POST',
      body: JSON.stringify(transactionData),
    });
  }

  // Get escrow transaction details
  async getEscrowTransaction(transactionId) {
    return this.request(`/escrow/${transactionId}`);
  }

  // Update escrow status (seller marks as shipped)
  async updateEscrowStatus(transactionId, status, data = {}) {
    return this.request(`/escrow/${transactionId}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status, ...data }),
    });
  }

  // Buyer confirms receipt
  async confirmReceipt(transactionId) {
    return this.request(`/escrow/${transactionId}/confirm-receipt`, {
      method: 'POST',
    });
  }

  // Release funds to seller
  async releaseFunds(transactionId) {
    return this.request(`/escrow/${transactionId}/release-funds`, {
      method: 'POST',
    });
  }

  // Create dispute
  async createDispute(transactionId, reason, evidence = []) {
    const uploadPromises = evidence.map(file => 
      this.uploadFile('/disputes/upload-evidence', file, { transactionId })
    );
    
    const uploadResults = await Promise.all(uploadPromises);
    
    return this.request('/disputes/create', {
      method: 'POST',
      body: JSON.stringify({
        transactionId,
        reason,
        evidence: uploadResults.map(result => result.data),
      }),
    });
  }

  // Get user's escrow transactions
  async getUserEscrowTransactions(userId, status = null) {
    const params = new URLSearchParams();
    if (status) params.append('status', status);
    
    return this.request(`/escrow/user/${userId}?${params.toString()}`);
  }

  // ==================== TRUST & REPUTATION ====================

  // Submit review for seller
  async submitSellerReview(sellerId, transactionId, reviewData) {
    return this.request('/reviews/seller', {
      method: 'POST',
      body: JSON.stringify({
        sellerId,
        transactionId,
        ...reviewData,
      }),
    });
  }

  // Get seller reviews
  async getSellerReviews(sellerId, page = 1, limit = 10) {
    return this.request(`/reviews/seller/${sellerId}?page=${page}&limit=${limit}`);
  }

  // Report seller
  async reportSeller(sellerId, reason, evidence = []) {
    const uploadPromises = evidence.map(file => 
      this.uploadFile('/reports/upload-evidence', file, { sellerId })
    );
    
    const uploadResults = await Promise.all(uploadPromises);
    
    return this.request('/reports/seller', {
      method: 'POST',
      body: JSON.stringify({
        sellerId,
        reason,
        evidence: uploadResults.map(result => result.data),
      }),
    });
  }

  // Get seller statistics
  async getSellerStats(sellerId) {
    return this.request(`/sellers/${sellerId}/stats`);
  }

  // ==================== ADMIN FUNCTIONS ====================

  // Get pending verifications (admin only)
  async getPendingVerifications(type = 'all') {
    return this.request(`/admin/verifications/pending?type=${type}`);
  }

  // Get dispute details (admin only)
  async getDispute(disputeId) {
    return this.request(`/admin/disputes/${disputeId}`);
  }

  // Resolve dispute (admin only)
  async resolveDispute(disputeId, resolution, refundAmount = 0) {
    return this.request(`/admin/disputes/${disputeId}/resolve`, {
      method: 'POST',
      body: JSON.stringify({ resolution, refundAmount }),
    });
  }

  // Get platform statistics (admin only)
  async getPlatformStats() {
    return this.request('/admin/stats');
  }

  // ==================== UTILITY FUNCTIONS ====================

  // Update auth token
  updateAuthToken(token) {
    this.token = token;
    localStorage.setItem('authToken', token);
  }

  // Clear auth token
  clearAuthToken() {
    this.token = null;
    localStorage.removeItem('authToken');
  }

  // Get supported document types
  async getSupportedDocumentTypes() {
    return this.request('/verification/document-types');
  }

  // Get verification requirements by country
  async getVerificationRequirements(country) {
    return this.request(`/verification/requirements/${country}`);
  }

  // Check if feature is available in user's region
  async checkFeatureAvailability(feature, country) {
    return this.request(`/features/availability?feature=${feature}&country=${country}`);
  }
}

// Create and export singleton instance
const verificationAPI = new VerificationAPI();

// Export individual methods for easier importing
export const {
  // Seller Verification
  submitSellerVerification,
  getSellerVerificationStatus,
  updateVerificationStatus,
  verifyPhone,
  confirmPhoneVerification,
  verifyEmail,
  confirmEmailVerification,
  
  // Tier Management
  getSellerTier,
  updateSellerTier,
  getTierRequirements,
  getTrustScore,
  
  // Product Authenticity
  submitProductAuthenticity,
  checkIMEI,
  verifySerialNumber,
  getProductAuthenticity,
  
  // Escrow
  createEscrowTransaction,
  getEscrowTransaction,
  updateEscrowStatus,
  confirmReceipt,
  releaseFunds,
  createDispute,
  getUserEscrowTransactions,
  
  // Trust & Reputation
  submitSellerReview,
  getSellerReviews,
  reportSeller,
  getSellerStats,
  
  // Admin
  getPendingVerifications,
  getDispute,
  resolveDispute,
  getPlatformStats,
  
  // Utility
  updateAuthToken,
  clearAuthToken,
  getSupportedDocumentTypes,
  getVerificationRequirements,
  checkFeatureAvailability,
} = verificationAPI;

export default verificationAPI;