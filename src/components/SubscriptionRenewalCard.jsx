import React, { useEffect, useState } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Alert,
  AlertTitle,
  AlertDescription,
  Button,
  Badge,
  Progress,
  Spinner,
} from '@/components/ui/card';
import { Calendar, Clock, AlertTriangle, CheckCircle, Zap } from 'lucide-react';

/**
 * SubscriptionRenewalCard Component
 * Displays subscription status, renewal dates, and grace period information
 * Shows renewal reminders and payment action buttons
 */
export function SubscriptionRenewalCard({ subscription, onPaymentClick, onReactivateClick }) {
  const [daysUntilRenewal, setDaysUntilRenewal] = useState(null);
  const [gracePeriodDaysRemaining, setGracePeriodDaysRemaining] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Calculate days until renewal
    if (subscription.subscription_renewal_date) {
      const renewalDate = new Date(subscription.subscription_renewal_date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      renewalDate.setHours(0, 0, 0, 0);
      
      const daysUntil = Math.ceil((renewalDate - today) / (1000 * 60 * 60 * 24));
      setDaysUntilRenewal(daysUntil);
    }

    // Calculate grace period days remaining
    if (subscription.subscription_grace_period_end) {
      const graceEnd = new Date(subscription.subscription_grace_period_end);
      const today = new Date();
      
      const daysRemaining = Math.ceil((graceEnd - today) / (1000 * 60 * 60 * 24));
      setGracePeriodDaysRemaining(daysRemaining);
    }
  }, [subscription]);

  const getStatusBadgeColor = () => {
    switch (subscription.subscription_status) {
      case 'ACTIVE':
        return 'bg-green-100 text-green-800';
      case 'PENDING_PAYMENT':
        return 'bg-yellow-100 text-yellow-800';
      case 'SUSPENDED':
        return 'bg-red-100 text-red-800';
      case 'CANCELED':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-blue-100 text-blue-800';
    }
  };

  const getGatewayLabel = () => {
    const gateway = subscription.subscription_payment_gateway;
    if (gateway === 'square') {
      return 'Square (Auto-Renews)';
    } else if (gateway === 'paychangu') {
      return 'Paychangu (Manual + Grace Period)';
    }
    return 'Unknown Gateway';
  };

  return (
    <Card className="w-full border-l-4 border-l-blue-500">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-xl">{subscription.subscription_tier?.toUpperCase()} Plan</CardTitle>
            <p className="text-sm text-gray-600 mt-1">Payment Gateway: {getGatewayLabel()}</p>
          </div>
          <Badge className={`${getStatusBadgeColor()}`}>
            {subscription.subscription_status}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Active Status - Show Renewal Date */}
        {subscription.subscription_status === 'ACTIVE' && daysUntilRenewal !== null && (
          <>
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <div className="flex items-start gap-3">
                <Calendar className="text-blue-600 mt-1 flex-shrink-0" size={20} />
                <div className="flex-grow">
                  <p className="font-semibold text-blue-900">Renewal Date</p>
                  <p className="text-sm text-blue-700">
                    {new Date(subscription.subscription_renewal_date).toLocaleDateString('en-US', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </p>
                  {daysUntilRenewal <= 5 && daysUntilRenewal > 0 && (
                    <div className="mt-2 p-2 bg-yellow-100 rounded border border-yellow-300">
                      <p className="text-sm font-semibold text-yellow-800">
                        ⚠️ Renews in {daysUntilRenewal} day{daysUntilRenewal !== 1 ? 's' : ''}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-600 font-semibold">SUBSCRIPTION START</p>
                <p className="text-sm font-bold text-gray-900 mt-1">
                  {new Date(subscription.subscription_start_date).toLocaleDateString()}
                </p>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-600 font-semibold">PLAN TIER</p>
                <p className="text-sm font-bold text-gray-900 mt-1 capitalize">
                  {subscription.subscription_tier}
                </p>
              </div>
            </div>
          </>
        )}

        {/* Pending Payment / Grace Period */}
        {subscription.subscription_status === 'PENDING_PAYMENT' && gracePeriodDaysRemaining !== null && (
          <>
            {gracePeriodDaysRemaining > 0 ? (
              <Alert className="border-yellow-400 bg-yellow-50">
                <AlertTriangle className="h-4 w-4 text-yellow-600" />
                <AlertTitle>Payment Required</AlertTitle>
                <AlertDescription className="mt-2">
                  <p className="text-sm text-yellow-800 mb-3">
                    Your subscription renewal payment is due. You have <strong>{gracePeriodDaysRemaining} days</strong> to complete the payment before your subscription is suspended.
                  </p>
                  <p className="text-xs text-yellow-700">
                    Grace Period Ends: {new Date(subscription.subscription_grace_period_end).toLocaleDateString()}
                  </p>
                </AlertDescription>
              </Alert>
            ) : (
              <Alert className="border-red-400 bg-red-50">
                <AlertTriangle className="h-4 w-4 text-red-600" />
                <AlertTitle>Grace Period Expired</AlertTitle>
                <AlertDescription>
                  Your grace period has expired. Please make payment immediately to reactivate your subscription.
                </AlertDescription>
              </Alert>
            )}

            {gracePeriodDaysRemaining > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold text-gray-700">Time Remaining</span>
                  <span className="text-sm font-bold text-yellow-600">{gracePeriodDaysRemaining} days</span>
                </div>
                <Progress value={(7 - gracePeriodDaysRemaining) / 7 * 100} className="h-2" />
              </div>
            )}

            <Button
              onClick={onPaymentClick}
              className="w-full bg-blue-600 hover:bg-blue-700"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Spinner className="mr-2 h-4 w-4" />
                  Processing...
                </>
              ) : (
                <>
                  <Zap className="mr-2 h-4 w-4" />
                  Make Payment Now
                </>
              )}
            </Button>
          </>
        )}

        {/* Suspended Status */}
        {subscription.subscription_status === 'SUSPENDED' && (
          <>
            <Alert className="border-red-400 bg-red-50">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <AlertTitle>Subscription Suspended</AlertTitle>
              <AlertDescription>
                Your subscription has been suspended due to non-payment. Your benefits are currently inactive.
              </AlertDescription>
            </Alert>

            <div className="bg-red-50 p-4 rounded-lg border border-red-200 space-y-2">
              <p className="text-sm font-semibold text-red-900">Suspended Benefits:</p>
              <ul className="text-xs text-red-800 space-y-1 ml-4 list-disc">
                <li>Free delivery</li>
                <li>Device insurance</li>
                <li>Extended warranty</li>
                <li>Priority support</li>
              </ul>
            </div>

            <Button
              onClick={onReactivateClick}
              className="w-full bg-green-600 hover:bg-green-700"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Spinner className="mr-2 h-4 w-4" />
                  Processing...
                </>
              ) : (
                <>
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Reactivate Subscription
                </>
              )}
            </Button>
          </>
        )}

        {/* Canceled Status */}
        {subscription.subscription_status === 'CANCELED' && (
          <>
            <Alert className="border-gray-400 bg-gray-50">
              <AlertTitle>Subscription Canceled</AlertTitle>
              <AlertDescription>
                Your subscription was canceled on {new Date(subscription.subscription_end_date).toLocaleDateString()}.
                You can resubscribe anytime to enjoy our benefits.
              </AlertDescription>
            </Alert>
          </>
        )}

        {/* Auto-Renewal Info (Square) */}
        {subscription.subscription_payment_gateway === 'square' && subscription.subscription_status === 'ACTIVE' && (
          <div className="bg-green-50 p-3 rounded-lg border border-green-200">
            <div className="flex items-center gap-2">
              <CheckCircle className="text-green-600" size={18} />
              <p className="text-sm text-green-800">
                <strong>Auto-Renewal Enabled:</strong> Your subscription will automatically renew on the renewal date.
              </p>
            </div>
          </div>
        )}

        {/* Last Updated Info */}
        {subscription.subscription_updated_at && (
          <div className="text-xs text-gray-500 flex items-center gap-2 pt-2 border-t border-gray-200">
            <Clock size={14} />
            Last updated: {new Date(subscription.subscription_updated_at).toLocaleDateString()} at{' '}
            {new Date(subscription.subscription_updated_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/**
 * SubscriptionHistoryPanel Component
 * Shows audit trail of subscription events
 */
export function SubscriptionHistoryPanel({ events = [] }) {
  const getEventIcon = (eventType) => {
    switch (eventType) {
      case 'renewal_processed':
        return '✓';
      case 'renewal_initiated':
        return '📧';
      case 'renewal_reminder':
        return '⏰';
      case 'subscription_suspended':
        return '⛔';
      case 'subscription_activated':
        return '✨';
      case 'subscription_canceled':
        return '✕';
      default:
        return '•';
    }
  };

  const getEventColor = (eventType) => {
    switch (eventType) {
      case 'renewal_processed':
        return 'text-green-600 bg-green-50';
      case 'renewal_initiated':
        return 'text-blue-600 bg-blue-50';
      case 'renewal_reminder':
        return 'text-yellow-600 bg-yellow-50';
      case 'subscription_suspended':
        return 'text-red-600 bg-red-50';
      case 'subscription_activated':
        return 'text-purple-600 bg-purple-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const formatEventType = (type) => {
    return type.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Subscription History</CardTitle>
      </CardHeader>
      <CardContent>
        {events.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-8">No subscription events yet</p>
        ) : (
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {events.map((event, idx) => (
              <div key={idx} className={`p-3 rounded-lg ${getEventColor(event.event_type)}`}>
                <div className="flex items-start gap-3">
                  <span className="text-xl mt-0.5">{getEventIcon(event.event_type)}</span>
                  <div className="flex-grow">
                    <p className="font-semibold text-sm">{formatEventType(event.event_type)}</p>
                    {event.notes && <p className="text-xs mt-1 opacity-80">{event.notes}</p>}
                    <p className="text-xs mt-2 opacity-60">
                      {new Date(event.created_at).toLocaleDateString()} at{' '}
                      {new Date(event.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default SubscriptionRenewalCard;
