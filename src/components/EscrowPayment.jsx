import React, { useState, useEffect } from 'react';
import { Shield, Clock, CheckCircle, AlertTriangle, DollarSign, Package, MessageSquare, RefreshCw, Eye, Calendar } from 'lucide-react';

const EscrowPayment = ({ transaction, userRole, onStatusUpdate }) => {
  const [escrowStatus, setEscrowStatus] = useState(transaction?.escrowStatus || 'pending');
  const [timeRemaining, setTimeRemaining] = useState(null);
  const [disputeReason, setDisputeReason] = useState('');
  const [showDispute, setShowDispute] = useState(false);
  const [trackingNumber, setTrackingNumber] = useState('');
  const [deliveryConfirmation, setDeliveryConfirmation] = useState(null);

  // Escrow timeline steps
  const escrowSteps = [
    { id: 'payment', label: 'Payment Received', status: 'completed', icon: DollarSign },
    { id: 'funds_held', label: 'Funds Secured', status: escrowStatus === 'pending' ? 'pending' : 'completed', icon: Shield },
    { id: 'item_shipped', label: 'Item Shipped', status: escrowStatus === 'shipped' || escrowStatus === 'delivered' || escrowStatus === 'completed' ? 'completed' : 'pending', icon: Package },
    { id: 'delivery_confirmed', label: 'Delivery Confirmed', status: escrowStatus === 'delivered' || escrowStatus === 'completed' ? 'completed' : 'pending', icon: CheckCircle },
    { id: 'funds_released', label: 'Funds Released', status: escrowStatus === 'completed' ? 'completed' : 'pending', icon: DollarSign }
  ];

  // Auto-release timer (7 days after delivery)
  useEffect(() => {
    if (escrowStatus === 'delivered') {
      const deliveryDate = new Date(transaction.deliveryDate || Date.now());
      const releaseDate = new Date(deliveryDate.getTime() + (7 * 24 * 60 * 60 * 1000)); // 7 days
      const now = new Date();
      
      if (now < releaseDate) {
        const remaining = releaseDate.getTime() - now.getTime();
        setTimeRemaining(remaining);
        
        const timer = setInterval(() => {
          const newRemaining = releaseDate.getTime() - new Date().getTime();
          if (newRemaining <= 0) {
            setEscrowStatus('completed');
            setTimeRemaining(null);
            clearInterval(timer);
          } else {
            setTimeRemaining(newRemaining);
          }
        }, 1000);
        
        return () => clearInterval(timer);
      }
    }
  }, [escrowStatus, transaction.deliveryDate]);

  const formatTimeRemaining = (ms) => {
    if (!ms) return '';
    const days = Math.floor(ms / (24 * 60 * 60 * 1000));
    const hours = Math.floor((ms % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
    const minutes = Math.floor((ms % (60 * 60 * 1000)) / (60 * 1000));
    
    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  const handleConfirmDelivery = () => {
    setEscrowStatus('completed');
    onStatusUpdate && onStatusUpdate('completed');
  };

  const handleMarkShipped = () => {
    if (!trackingNumber.trim()) {
      alert('Please provide a tracking number');
      return;
    }
    setEscrowStatus('shipped');
    onStatusUpdate && onStatusUpdate('shipped', { trackingNumber });
  };

  const handleConfirmReceived = () => {
    setEscrowStatus('delivered');
    onStatusUpdate && onStatusUpdate('delivered');
  };

  const handleDispute = () => {
    if (!disputeReason.trim()) {
      alert('Please provide a reason for the dispute');
      return;
    }
    setEscrowStatus('disputed');
    onStatusUpdate && onStatusUpdate('disputed', { reason: disputeReason });
    setShowDispute(false);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'text-green-600 bg-green-100';
      case 'pending': return 'text-yellow-600 bg-yellow-100';
      case 'disputed': return 'text-red-600 bg-red-100';
      case 'shipped': return 'text-blue-600 bg-blue-100';
      case 'delivered': return 'text-purple-600 bg-purple-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusMessage = () => {
    switch (escrowStatus) {
      case 'pending':
        return userRole === 'seller' 
          ? 'Waiting for you to ship the item'
          : 'Seller is preparing your order';
      case 'shipped':
        return userRole === 'buyer'
          ? 'Item shipped! Confirm when you receive it'
          : 'Item shipped. Waiting for buyer confirmation';
      case 'delivered':
        return userRole === 'buyer'
          ? 'Confirm delivery to release funds to seller'
          : `Funds will auto-release in ${formatTimeRemaining(timeRemaining)}`;
      case 'completed':
        return 'Transaction completed successfully!';
      case 'disputed':
        return 'Dispute in progress. Xtrapush team will review';
      default:
        return 'Processing payment...';
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      {/* Header */}
      <div className="text-center mb-8">
        <Shield className="mx-auto h-12 w-12 text-blue-600" />
        <h2 className="mt-2 text-2xl font-bold text-gray-900">Escrow Protection</h2>
        <p className="text-sm text-gray-500">Your payment is safely held until delivery is confirmed</p>
      </div>

      {/* Transaction Summary */}
      <div className="bg-gray-50 rounded-lg p-6 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center">
            <DollarSign className="mx-auto h-8 w-8 text-green-600 mb-2" />
            <p className="text-sm text-gray-500">Amount Held</p>
            <p className="text-xl font-bold text-gray-900">${transaction?.amount || '0.00'}</p>
          </div>
          <div className="text-center">
            <Clock className="mx-auto h-8 w-8 text-blue-600 mb-2" />
            <p className="text-sm text-gray-500">Status</p>
            <span className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(escrowStatus)}`}>
              {escrowStatus.charAt(0).toUpperCase() + escrowStatus.slice(1).replace('_', ' ')}
            </span>
          </div>
          <div className="text-center">
            <Package className="mx-auto h-8 w-8 text-purple-600 mb-2" />
            <p className="text-sm text-gray-500">Protection</p>
            <p className="text-lg font-semibold text-gray-900">100% Secure</p>
          </div>
        </div>
      </div>

      {/* Status Message */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-8">
        <div className="flex items-center space-x-3">
          <div className="flex-shrink-0">
            {escrowStatus === 'completed' ? (
              <CheckCircle className="h-6 w-6 text-green-600" />
            ) : escrowStatus === 'disputed' ? (
              <AlertTriangle className="h-6 w-6 text-red-600" />
            ) : (
              <Clock className="h-6 w-6 text-blue-600" />
            )}
          </div>
          <div>
            <p className="text-blue-800 font-medium">{getStatusMessage()}</p>
            {timeRemaining && (
              <p className="text-blue-600 text-sm">
                Auto-release in: {formatTimeRemaining(timeRemaining)}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Progress Timeline */}
      <div className="mb-8">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Transaction Progress</h3>
        <div className="space-y-4">
          {escrowSteps.map((step, index) => {
            const Icon = step.icon;
            const isCompleted = step.status === 'completed';
            const isCurrent = step.status === 'pending' && (index === 0 || escrowSteps[index - 1].status === 'completed');
            
            return (
              <div key={step.id} className="flex items-center space-x-4">
                <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
                  isCompleted ? 'bg-green-100 text-green-600' :
                  isCurrent ? 'bg-blue-100 text-blue-600' :
                  'bg-gray-100 text-gray-400'
                }`}>
                  {isCompleted ? (
                    <CheckCircle className="h-5 w-5" />
                  ) : (
                    <Icon className="h-5 w-5" />
                  )}
                </div>
                <div className="flex-1">
                  <p className={`font-medium ${
                    isCompleted ? 'text-green-800' :
                    isCurrent ? 'text-blue-800' :
                    'text-gray-500'
                  }`}>
                    {step.label}
                  </p>
                  {step.id === 'item_shipped' && trackingNumber && (
                    <p className="text-sm text-gray-600">Tracking: {trackingNumber}</p>
                  )}
                </div>
                {index < escrowSteps.length - 1 && (
                  <div className={`w-px h-8 ${isCompleted ? 'bg-green-300' : 'bg-gray-300'}`} />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="space-y-4">
        {userRole === 'seller' && escrowStatus === 'pending' && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h4 className="font-medium text-yellow-800 mb-3">Mark Item as Shipped</h4>
            <div className="space-y-3">
              <input
                type="text"
                placeholder="Enter tracking number"
                value={trackingNumber}
                onChange={(e) => setTrackingNumber(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={handleMarkShipped}
                className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                Mark as Shipped
              </button>
            </div>
          </div>
        )}

        {userRole === 'buyer' && escrowStatus === 'shipped' && (
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
            <h4 className="font-medium text-purple-800 mb-3">Confirm Receipt</h4>
            <p className="text-sm text-purple-600 mb-3">
              Have you received your item and verified it matches the description?
            </p>
            <button
              onClick={handleConfirmReceived}
              className="w-full bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              Yes, I Received My Item
            </button>
          </div>
        )}

        {userRole === 'buyer' && escrowStatus === 'delivered' && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <h4 className="font-medium text-green-800 mb-3">Release Funds to Seller</h4>
            <p className="text-sm text-green-600 mb-3">
              Everything looks good? Release the funds to complete the transaction.
            </p>
            <button
              onClick={handleConfirmDelivery}
              className="w-full bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              Release Funds
            </button>
          </div>
        )}

        {/* Dispute Button */}
        {(escrowStatus === 'shipped' || escrowStatus === 'delivered') && userRole === 'buyer' && (
          <div className="border-t pt-4">
            {!showDispute ? (
              <button
                onClick={() => setShowDispute(true)}
                className="w-full bg-red-100 text-red-700 px-4 py-2 rounded-md hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-red-500 flex items-center justify-center space-x-2"
              >
                <AlertTriangle className="h-4 w-4" />
                <span>Report an Issue</span>
              </button>
            ) : (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <h4 className="font-medium text-red-800 mb-3">Report Issue</h4>
                <textarea
                  placeholder="Describe the issue with your order..."
                  value={disputeReason}
                  onChange={(e) => setDisputeReason(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 h-24 resize-none"
                />
                <div className="flex space-x-3 mt-3">
                  <button
                    onClick={handleDispute}
                    className="flex-1 bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
                  >
                    Submit Dispute
                  </button>
                  <button
                    onClick={() => setShowDispute(false)}
                    className="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Protection Info */}
      <div className="mt-8 bg-blue-50 rounded-lg p-6">
        <h3 className="text-lg font-medium text-blue-900 mb-4 flex items-center">
          <Shield className="mr-2 h-5 w-5" />
          How Escrow Protection Works
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-blue-800">
          <div>
            <h4 className="font-medium mb-2">For Buyers:</h4>
            <ul className="space-y-1">
              <li>• Your payment is held securely</li>
              <li>• Funds only released after delivery</li>
              <li>• 7-day inspection period</li>
              <li>• Dispute protection available</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium mb-2">For Sellers:</h4>
            <ul className="space-y-1">
              <li>• Payment guaranteed once shipped</li>
              <li>• Automatic release after 7 days</li>
              <li>• Protection against false claims</li>
              <li>• Tracking number required</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EscrowPayment;