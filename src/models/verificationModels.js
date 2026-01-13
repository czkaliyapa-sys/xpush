// Verification Data Models and Schemas for Xtrapush
// Defines the structure for all verification-related data

// ==================== SELLER VERIFICATION MODELS ====================

export const SellerVerificationStatus = {
  PENDING: 'pending',
  IN_REVIEW: 'in_review',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  SUSPENDED: 'suspended',
  EXPIRED: 'expired'
};

export const DocumentType = {
  ID_DOCUMENT: 'id_document',
  SELFIE: 'selfie',
  ADDRESS_PROOF: 'address_proof',
  BUSINESS_LICENSE: 'business_license',
  TAX_CERTIFICATE: 'tax_certificate'
};

export const SellerVerificationSchema = {
  id: 'string',
  sellerId: 'string',
  status: 'SellerVerificationStatus',
  submittedAt: 'Date',
  reviewedAt: 'Date',
  expiresAt: 'Date',
  
  // Personal Information
  personalInfo: {
    firstName: 'string',
    lastName: 'string',
    dateOfBirth: 'Date',
    nationality: 'string',
    idNumber: 'string',
    idType: 'string', // passport, driver_license, national_id
  },
  
  // Contact Information
  contactInfo: {
    email: 'string',
    emailVerified: 'boolean',
    phone: 'string',
    phoneVerified: 'boolean',
    address: {
      street: 'string',
      city: 'string',
      state: 'string',
      postalCode: 'string',
      country: 'string'
    }
  },
  
  // Documents
  documents: [{
    type: 'DocumentType',
    url: 'string',
    uploadedAt: 'Date',
    verified: 'boolean',
    notes: 'string'
  }],
  
  // Verification Results
  verificationResults: {
    idVerification: {
      status: 'string', // passed, failed, pending
      confidence: 'number', // 0-100
      notes: 'string'
    },
    selfieMatch: {
      status: 'string',
      confidence: 'number',
      notes: 'string'
    },
    addressVerification: {
      status: 'string',
      notes: 'string'
    }
  },
  
  // Review Information
  reviewNotes: 'string',
  reviewedBy: 'string',
  rejectionReason: 'string'
};

// ==================== SELLER TIER MODELS ====================

export const SellerTier = {
  NEW: 'new',
  VERIFIED: 'verified',
  TRUSTED: 'trusted',
  PREMIUM: 'premium'
};

export const SellerTierSchema = {
  sellerId: 'string',
  currentTier: 'SellerTier',
  tierAchievedAt: 'Date',
  nextTierEligibleAt: 'Date',
  
  // Tier Metrics
  metrics: {
    totalSales: 'number',
    successfulTransactions: 'number',
    averageRating: 'number',
    totalReviews: 'number',
    disputeRate: 'number',
    responseTime: 'number', // hours
    accountAge: 'number', // days
    verificationLevel: 'number' // 0-100
  },
  
  // Tier Benefits
  benefits: {
    maxListings: 'number',
    featuredListings: 'number',
    lowerFees: 'boolean',
    prioritySupport: 'boolean',
    customBadge: 'boolean',
    advancedAnalytics: 'boolean'
  },
  
  // Requirements for next tier
  nextTierRequirements: {
    minSales: 'number',
    minRating: 'number',
    minTransactions: 'number',
    maxDisputeRate: 'number',
    verificationRequired: 'boolean'
  }
};

// ==================== PRODUCT AUTHENTICITY MODELS ====================

export const AuthenticityStatus = {
  PENDING: 'pending',
  VERIFIED: 'verified',
  SUSPICIOUS: 'suspicious',
  REJECTED: 'rejected'
};

export const ProductAuthenticitySchema = {
  id: 'string',
  productId: 'string',
  sellerId: 'string',
  status: 'AuthenticityStatus',
  submittedAt: 'Date',
  verifiedAt: 'Date',
  
  // Product Information
  productInfo: {
    brand: 'string',
    model: 'string',
    serialNumber: 'string',
    imeiNumber: 'string',
    purchaseDate: 'Date',
    purchasePrice: 'number',
    condition: 'string' // new, like_new, good, fair
  },
  
  // Verification Documents
  documents: [{
    type: 'string', // proof_of_purchase, warranty, manual, box
    url: 'string',
    uploadedAt: 'Date',
    verified: 'boolean'
  }],
  
  // Verification Checks
  verificationChecks: {
    imeiCheck: {
      status: 'string', // clean, blacklisted, unknown
      checkedAt: 'Date',
      source: 'string'
    },
    serialCheck: {
      status: 'string',
      checkedAt: 'Date',
      manufacturerVerified: 'boolean'
    },
    photoAnalysis: {
      status: 'string',
      stockPhotoDetected: 'boolean',
      watermarkPresent: 'boolean',
      qualityScore: 'number'
    }
  },
  
  // Risk Assessment
  riskAssessment: {
    overallRisk: 'string', // low, medium, high
    riskFactors: ['string'],
    confidenceScore: 'number' // 0-100
  },
  
  verificationNotes: 'string'
};

// ==================== ESCROW TRANSACTION MODELS ====================

export const EscrowStatus = {
  CREATED: 'created',
  FUNDED: 'funded',
  SHIPPED: 'shipped',
  DELIVERED: 'delivered',
  COMPLETED: 'completed',
  DISPUTED: 'disputed',
  CANCELLED: 'cancelled',
  REFUNDED: 'refunded'
};

export const EscrowTransactionSchema = {
  id: 'string',
  buyerId: 'string',
  sellerId: 'string',
  productId: 'string',
  orderId: 'string',
  
  // Transaction Details
  amount: 'number',
  currency: 'string',
  platformFee: 'number',
  sellerAmount: 'number', // amount - platformFee
  
  // Status and Timing
  status: 'EscrowStatus',
  createdAt: 'Date',
  fundedAt: 'Date',
  shippedAt: 'Date',
  deliveredAt: 'Date',
  completedAt: 'Date',
  autoReleaseAt: 'Date', // automatic release date
  
  // Shipping Information
  shippingInfo: {
    trackingNumber: 'string',
    carrier: 'string',
    shippingMethod: 'string',
    estimatedDelivery: 'Date',
    shippingAddress: {
      name: 'string',
      street: 'string',
      city: 'string',
      state: 'string',
      postalCode: 'string',
      country: 'string'
    }
  },
  
  // Timeline Events
  timeline: [{
    event: 'string',
    timestamp: 'Date',
    actor: 'string', // buyer, seller, system, admin
    notes: 'string'
  }],
  
  // Dispute Information (if applicable)
  dispute: {
    id: 'string',
    reason: 'string',
    createdAt: 'Date',
    evidence: ['string'], // URLs to evidence files
    resolution: 'string',
    resolvedAt: 'Date',
    refundAmount: 'number'
  }
};

// ==================== TRUST & REPUTATION MODELS ====================

export const TrustScore = {
  EXCELLENT: { min: 90, max: 100, label: 'Excellent', color: '#10B981' },
  VERY_GOOD: { min: 80, max: 89, label: 'Very Good', color: '#059669' },
  GOOD: { min: 70, max: 79, label: 'Good', color: '#34D399' },
  FAIR: { min: 60, max: 69, label: 'Fair', color: '#FCD34D' },
  POOR: { min: 0, max: 59, label: 'Poor', color: '#EF4444' }
};

export const SellerReviewSchema = {
  id: 'string',
  sellerId: 'string',
  buyerId: 'string',
  transactionId: 'string',
  productId: 'string',
  
  // Review Details
  rating: 'number', // 1-5
  title: 'string',
  comment: 'string',
  createdAt: 'Date',
  
  // Review Categories
  ratings: {
    communication: 'number', // 1-5
    shipping: 'number',
    itemAsDescribed: 'number',
    overall: 'number'
  },
  
  // Verification
  verified: 'boolean', // verified purchase
  helpful: 'number', // helpful votes
  reported: 'boolean',
  
  // Seller Response
  sellerResponse: {
    comment: 'string',
    respondedAt: 'Date'
  }
};

export const SellerStatsSchema = {
  sellerId: 'string',
  lastUpdated: 'Date',
  
  // Basic Stats
  totalSales: 'number',
  totalRevenue: 'number',
  totalListings: 'number',
  activeListings: 'number',
  
  // Performance Metrics
  averageRating: 'number',
  totalReviews: 'number',
  responseRate: 'number', // percentage
  averageResponseTime: 'number', // hours
  onTimeShippingRate: 'number', // percentage
  
  // Trust Metrics
  trustScore: 'number', // 0-100
  verificationLevel: 'number', // 0-100
  disputeRate: 'number', // percentage
  successfulTransactions: 'number',
  
  // Time-based Stats
  stats30Days: {
    sales: 'number',
    revenue: 'number',
    newReviews: 'number',
    averageRating: 'number'
  },
  
  stats90Days: {
    sales: 'number',
    revenue: 'number',
    newReviews: 'number',
    averageRating: 'number'
  },
  
  // Category Performance
  topCategories: [{
    category: 'string',
    sales: 'number',
    revenue: 'number',
    averageRating: 'number'
  }]
};

// ==================== DISPUTE MODELS ====================

export const DisputeStatus = {
  OPEN: 'open',
  IN_REVIEW: 'in_review',
  RESOLVED: 'resolved',
  CLOSED: 'closed'
};

export const DisputeReason = {
  ITEM_NOT_RECEIVED: 'item_not_received',
  ITEM_NOT_AS_DESCRIBED: 'item_not_as_described',
  DAMAGED_ITEM: 'damaged_item',
  WRONG_ITEM: 'wrong_item',
  SELLER_UNRESPONSIVE: 'seller_unresponsive',
  SHIPPING_ISSUES: 'shipping_issues',
  OTHER: 'other'
};

export const DisputeSchema = {
  id: 'string',
  transactionId: 'string',
  buyerId: 'string',
  sellerId: 'string',
  
  // Dispute Details
  reason: 'DisputeReason',
  description: 'string',
  status: 'DisputeStatus',
  createdAt: 'Date',
  resolvedAt: 'Date',
  
  // Evidence
  evidence: [{
    type: 'string', // photo, document, message
    url: 'string',
    description: 'string',
    uploadedBy: 'string',
    uploadedAt: 'Date'
  }],
  
  // Communication
  messages: [{
    from: 'string', // buyer, seller, admin
    message: 'string',
    timestamp: 'Date',
    attachments: ['string']
  }],
  
  // Resolution
  resolution: {
    type: 'string', // refund, partial_refund, no_action, seller_favor
    amount: 'number',
    reason: 'string',
    resolvedBy: 'string',
    resolvedAt: 'Date'
  },
  
  // Admin Notes
  adminNotes: 'string',
  priority: 'string' // low, medium, high, urgent
};

// ==================== UTILITY FUNCTIONS ====================

// Calculate trust score based on various factors
export function calculateTrustScore(sellerStats, verificationLevel, tierLevel) {
  const weights = {
    averageRating: 0.25,
    totalReviews: 0.15,
    successfulTransactions: 0.20,
    disputeRate: 0.15,
    verificationLevel: 0.15,
    responseTime: 0.10
  };
  
  let score = 0;
  
  // Rating component (0-25 points)
  score += (sellerStats.averageRating / 5) * 100 * weights.averageRating;
  
  // Review volume component (0-15 points)
  const reviewScore = Math.min(sellerStats.totalReviews / 100, 1) * 100;
  score += reviewScore * weights.totalReviews;
  
  // Transaction success component (0-20 points)
  const transactionScore = Math.min(sellerStats.successfulTransactions / 50, 1) * 100;
  score += transactionScore * weights.successfulTransactions;
  
  // Dispute rate component (0-15 points, inverted)
  const disputeScore = Math.max(0, (1 - sellerStats.disputeRate / 10)) * 100;
  score += disputeScore * weights.disputeRate;
  
  // Verification component (0-15 points)
  score += verificationLevel * weights.verificationLevel;
  
  // Response time component (0-10 points, inverted)
  const responseScore = Math.max(0, (1 - sellerStats.averageResponseTime / 48)) * 100;
  score += responseScore * weights.responseTime;
  
  // Tier bonus
  const tierBonus = {
    [SellerTier.NEW]: 0,
    [SellerTier.VERIFIED]: 5,
    [SellerTier.TRUSTED]: 10,
    [SellerTier.PREMIUM]: 15
  };
  
  score += tierBonus[tierLevel] || 0;
  
  return Math.min(Math.max(Math.round(score), 0), 100);
}

// Get trust score category
export function getTrustScoreCategory(score) {
  for (const [category, range] of Object.entries(TrustScore)) {
    if (score >= range.min && score <= range.max) {
      return { category, ...range };
    }
  }
  return TrustScore.POOR;
}

// Determine seller tier based on metrics
export function determineSellerTier(metrics, verificationLevel) {
  const {
    totalSales,
    successfulTransactions,
    averageRating,
    totalReviews,
    disputeRate,
    accountAge
  } = metrics;
  
  // Premium Tier Requirements
  if (
    totalSales >= 100 &&
    successfulTransactions >= 50 &&
    averageRating >= 4.7 &&
    totalReviews >= 50 &&
    disputeRate <= 2 &&
    accountAge >= 365 &&
    verificationLevel >= 90
  ) {
    return SellerTier.PREMIUM;
  }
  
  // Trusted Tier Requirements
  if (
    totalSales >= 25 &&
    successfulTransactions >= 20 &&
    averageRating >= 4.5 &&
    totalReviews >= 20 &&
    disputeRate <= 5 &&
    accountAge >= 90 &&
    verificationLevel >= 80
  ) {
    return SellerTier.TRUSTED;
  }
  
  // Verified Tier Requirements
  if (
    totalSales >= 5 &&
    successfulTransactions >= 3 &&
    averageRating >= 4.0 &&
    totalReviews >= 3 &&
    disputeRate <= 10 &&
    accountAge >= 30 &&
    verificationLevel >= 60
  ) {
    return SellerTier.VERIFIED;
  }
  
  // Default to New
  return SellerTier.NEW;
}

// Validate verification document
export function validateDocument(document, type) {
  const validations = {
    [DocumentType.ID_DOCUMENT]: {
      maxSize: 10 * 1024 * 1024, // 10MB
      allowedTypes: ['image/jpeg', 'image/png', 'application/pdf'],
      required: true
    },
    [DocumentType.SELFIE]: {
      maxSize: 5 * 1024 * 1024, // 5MB
      allowedTypes: ['image/jpeg', 'image/png'],
      required: true
    },
    [DocumentType.ADDRESS_PROOF]: {
      maxSize: 10 * 1024 * 1024, // 10MB
      allowedTypes: ['image/jpeg', 'image/png', 'application/pdf'],
      required: true
    }
  };
  
  const validation = validations[type];
  if (!validation) return { valid: false, error: 'Unknown document type' };
  
  if (!document) {
    return { valid: !validation.required, error: 'Document is required' };
  }
  
  if (document.size > validation.maxSize) {
    return { valid: false, error: 'File size too large' };
  }
  
  if (!validation.allowedTypes.includes(document.type)) {
    return { valid: false, error: 'Invalid file type' };
  }
  
  return { valid: true };
}

// Export all models and utilities
export default {
  // Status Enums
  SellerVerificationStatus,
  DocumentType,
  SellerTier,
  AuthenticityStatus,
  EscrowStatus,
  DisputeStatus,
  DisputeReason,
  TrustScore,
  
  // Schemas
  SellerVerificationSchema,
  SellerTierSchema,
  ProductAuthenticitySchema,
  EscrowTransactionSchema,
  SellerReviewSchema,
  SellerStatsSchema,
  DisputeSchema,
  
  // Utility Functions
  calculateTrustScore,
  getTrustScoreCategory,
  determineSellerTier,
  validateDocument
};