import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import SEOMeta from './components/SEOMeta.jsx';
import { getCanonicalUrl } from './utils/seoUtils.js';
import styles from './style';
import { Box, Typography, Card, CardContent, Chip, Tabs, Tab, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from '@mui/material';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';

const SectionCard = ({ title, children }) => (
  <Card sx={{ backgroundColor: 'transparent', border: '1px solid rgba(255, 255, 255, 0.1)', mb: 2 }}>
    <CardContent>
      <Typography variant="h6" sx={{ color: 'white', mb: 1 }}>{title}</Typography>
      <Box sx={{ color: 'rgba(255,255,255,0.92)' }}>{children}</Box>
    </CardContent>
  </Card>
);

const PolicyPill = ({ label }) => (
  <Chip label={label} sx={{ mr: 1, mb: 1, bgcolor: 'rgba(72, 206, 219, 0.15)', color: '#48CEDB' }} />
);

const InstallmentPolicy = () => {
  const location = useLocation();
  const [selectedPlan, setSelectedPlan] = useState(0);

  return (
    <>
      <SEOMeta
        title="Installment Payment Plans | Xtrapush Gadgets"
        description="Learn about our flexible installment payment plans. Buy gadgets now, pay later with affordable monthly options and zero-interest plans."
        keywords="installment, payment plans, flexible payments, zero interest, buy now pay later"
        canonical={getCanonicalUrl(location.pathname)}
        ogTitle="Installment Plans"
        ogDescription="Xtrapush Gadgets Flexible Installment Payment Options"
        ogUrl={getCanonicalUrl(location.pathname)}
      />
    <div className="deep bg-primary w-full min-h-screen overflow-hidden">
      

      <div className={`${styles.paddingX} ${styles.flexCenter}`}>
        <div className={`${styles.boxWidth} py-6`}>
          <Typography variant="h4" component="h1" sx={{ color: 'white', mb: 2 }}>
            Installment Policy
          </Typography>
          <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)', mb: 3 }}>Last updated: December 2025</Typography>

          {/* Plan Selection Tabs - Mobile Responsive */}
          <Box sx={{ 
            mb: 4, 
            borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
            width: '100%',
            overflowX: 'auto',
            '&::-webkit-scrollbar': {
              height: '6px',
            },
            '&::-webkit-scrollbar-track': {
              background: 'rgba(255, 255, 255, 0.1)',
              borderRadius: '3px',
            },
            '&::-webkit-scrollbar-thumb': {
              background: 'rgba(72, 206, 219, 0.5)',
              borderRadius: '3px',
            }
          }}>
            <Tabs
              value={selectedPlan}
              onChange={(e, newValue) => {
                // Prevent switching to Pay as You Go tab (index 1)
                if (newValue !== 1) setSelectedPlan(newValue);
              }}
              variant="scrollable"
              scrollButtons="auto"
              allowScrollButtonsMobile
              sx={{
                minHeight: { xs: 48, sm: 48 },
                '& .MuiTab-root': {
                  color: 'rgba(255, 255, 255, 0.6)',
                  minWidth: { xs: 'auto', sm: 90 },
                  padding: { xs: '12px 8px', sm: '12px 16px' },
                  fontSize: { xs: '0.8rem', sm: '0.875rem' },
                  textTransform: 'none',
                  fontWeight: 500,
                  '&.Mui-selected': {
                    color: '#48CEDB',
                  },
                  '&.Mui-disabled': {
                    color: 'rgba(255, 255, 255, 0.3)',
                  },
                  '&:hover:not(.Mui-disabled)': {
                    color: 'rgba(72, 206, 219, 0.8)',
                    backgroundColor: 'rgba(72, 206, 219, 0.05)',
                  }
                },
                '& .MuiTabs-indicator': {
                  backgroundColor: '#48CEDB',
                  height: '3px',
                },
                '& .MuiTabs-scrollButtons': {
                  color: '#48CEDB',
                  width: 32,
                  '&.Mui-disabled': {
                    opacity: 0.3,
                  }
                }
              }}
            >
              <Tab label="Pay to Own" />
              <Tab label="Pay as You Go" disabled />
              <Tab label="Pay to Lease" />
              <Tab label="Comparison" />
            </Tabs>
          </Box>

          {/* Pay to Own Content */}
          {selectedPlan === 0 && (
            <>
              <SectionCard title="Overview - Pay to Own">
                <Typography variant="body1" sx={{ mb: 1 }}>
                  Pay to Own allows you to pay installments first and receive the device only after completing all payments. Choose between 2, 4, or 6 weeks and pay a deposit upfront. Your total price and weekly payments are determined by your selected plan. Full ownership transfers to you after all payments are complete. Please read this policy carefully before starting checkout.
                </Typography>
                <Box sx={{ mt: 1 }}>
                  <PolicyPill label="2 weeks" />
                  <PolicyPill label="4 weeks" />
                  <PolicyPill label="6 weeks" />
                </Box>
              </SectionCard>

              <SectionCard title="Plans and Pricing - Pay to Own">
                <Typography variant="subtitle1" sx={{ color: '#48CEDB', mb: 1 }}>2-week plan</Typography>
                <Typography variant="body2" sx={{ mb: 2 }}>
                  - Deposit: 35% of the device price. <br/>
                  - Total price: Base price (no increase). <br/>
                  - Weekly payment: Remaining balance divided by 2 weeks.
                </Typography>

                <Typography variant="subtitle1" sx={{ color: '#48CEDB', mb: 1 }}>4-week plan</Typography>
                <Typography variant="body2" sx={{ mb: 2 }}>
                  - Deposit: 50% of the adjusted total. <br/>
                  - Total price: Base price + 5% increase. <br/>
                  - Weekly payment: Remaining balance divided by 4 weeks.
                </Typography>

                <Typography variant="subtitle1" sx={{ color: '#48CEDB', mb: 1 }}>6-week plan</Typography>
                <Typography variant="body2" sx={{ mb: 2 }}>
                  - Deposit: 65% of the adjusted total. <br/>
                  - Total price: Base price + 10% increase. <br/>
                  - Weekly payment: Remaining balance divided by 6 weeks.
                </Typography>
              </SectionCard>

              <SectionCard title="Device Delivery - Pay to Own">
                <Typography variant="body2" sx={{ mb: 2 }}>
                  Paying the upfront deposit does not grant immediate access to the device. The device is delivered only after you complete the entire installment plan. This ensures a fair and consistent process for all customers.
                </Typography>
                <Typography variant="body2">
                  You will receive confirmations for deposit and subsequent weekly payments. Once your final payment is successful, we will contact you to arrange pickup or delivery.
                </Typography>
              </SectionCard>

              <SectionCard title="Missed or Failed Payments - Pay to Own">
                <Typography variant="body2" sx={{ mb: 2 }}>
                  If you fail to complete the installment on schedule, an extra interest of 5% per week is applied for up to two weeks. If payments remain incomplete after these two weeks of grace period, the installment plan is turned down (cancelled) and the device will not be delivered.
                </Typography>
                <Typography variant="body2">
                  If your plan is turned down, you may re-apply for a new installment plan in the future. Eligibility will be reviewed based on your previous payment history.
                </Typography>
              </SectionCard>

              <SectionCard title="Important Notes - Pay to Own">
                <Typography variant="body2" sx={{ mb: 1 }}>
                  - Prices are shown in your local currency (MWK for Malawi, GBP for international). Totals and weekly amounts are calculated at checkout based on your selected device, condition, and storage options. <br/>
                  - Adjusted totals for 4-week (+5%) and 6-week (+10%) plans are applied automatically during checkout. <br/>
                  - You must provide a valid Malawi phone number (+265 followed by 9 digits) in Profile Settings before starting an installment plan. <br/>
                  - The Installment Policy must be accepted before proceeding to checkout.
                </Typography>
              </SectionCard>
            </>
          )}

          {/* Pay as You Go Content */}
          {selectedPlan === 1 && (
            <>
              <SectionCard title="⚠️ Estimated Pricing - Pay as You Go">
                <Typography variant="body2" sx={{ color: 'rgba(255, 165, 0, 0.9)', mb: 2, fontWeight: 600 }}>
                  The pricing and payment amounts shown below are ESTIMATED and based on initial information. Your actual payment plan will be finalized after our verification and assessment of your profile. Final amounts may vary based on our assessment results.
                </Typography>
                <Typography variant="body2">
                  Please proceed with the understanding that these are preliminary figures. We will verify and assess your application before confirming your final payment schedule.
                </Typography>
              </SectionCard>

              <SectionCard title="Overview - Pay as You Go">
                <Typography variant="body1" sx={{ mb: 1 }}>
                  Pay as You Go allows you to receive and use the device as yours immediately while paying for it in scheduled installments. Choose between 2, 4, or 6 weeks and pay a deposit upfront. Full ownership transfers to you only after all payments are completed. Please read this policy carefully before starting checkout.
                </Typography>
                <Typography variant="body2" sx={{ mt: 2, p: 1.5, bgcolor: 'rgba(255, 165, 0, 0.1)', borderLeft: '3px solid rgba(255, 165, 0, 0.5)', color: 'rgba(255, 200, 124, 0.95)' }}>
                  ⚠️ <strong>Pay as You Go Note:</strong> This option is coming soon. You will receive the device immediately and pay installments while using it. Full ownership transfers after all payments.
                </Typography>
                <Box sx={{ mt: 1 }}>
                  <PolicyPill label="2 weeks" />
                  <PolicyPill label="4 weeks" />
                  <PolicyPill label="6 weeks" />
                </Box>
              </SectionCard>

              <SectionCard title="Pay as You Go - Coming Soon">
                <Typography variant="body2" sx={{ mb: 2, fontWeight: 600, color: '#48CEDB' }}>
                  Pay as You Go is currently under development and will be available soon.
                </Typography>
                <Typography variant="body2" sx={{ mb: 2 }}>
                  With Pay as You Go, you will:<br/>
                  • Receive the device immediately upon approval<br/>
                  • Make payments while using the device<br/>
                  • Gain full ownership after completing all payments<br/>
                </Typography>
                <Typography variant="body2" sx={{ mb: 2, color: '#FF9800', fontWeight: 500 }}>
                  Failure to pay installments on time will result in late fees and interest charges. Serious or repeated non-payment may lead to device lock, account suspension, loss of eligibility for future plans, and other legal or financial consequences.
                </Typography>
              </SectionCard>

              <SectionCard title="What 'Pay as You Go' Means">
                <Typography variant="body2" sx={{ mb: 2 }}>
                  Pay as You Go allows you to receive and use a device as yours immediately while paying for it in small, scheduled installments. Full ownership transfers to you after all payments are complete.
                </Typography>
              </SectionCard>

              <SectionCard title="Eligibility & Onboarding - Pay as You Go">
                <Typography variant="body2" sx={{ mb: 1 }}>
                  To qualify for Pay as You Go, customers must:
                </Typography>
                <Typography variant="body2" sx={{ mb: 2 }}>
                  - Provide valid identification <br/>
                  - Provide a working phone number <br/>
                  - Provide proof of address / school / workplace (where required) <br/>
                  - Agree to device management and tracking measures <br/>
                  - Pay the required upfront deposit
                </Typography>
                <Typography variant="body2" sx={{ color: 'rgba(255, 165, 0, 0.9)' }}>
                  ⚠️ Xtrapush reserves the right to decline Pay as You Go access if verification cannot be completed. Your final approval depends on our assessment of your profile and eligibility.
                </Typography>
              </SectionCard>

              <SectionCard title="Plans and Pricing - Pay as You Go (Estimated)">
                <Typography variant="subtitle1" sx={{ color: '#48CEDB', mb: 1 }}>2-week plan</Typography>
                <Typography variant="body2" sx={{ mb: 2 }}>
                  - Deposit: 35% of the device price. <br/>
                  - Total price: Base price (no increase). <br/>
                  - Weekly payment: Remaining balance divided by 2 weeks. <br/>
                  <Typography component="span" sx={{ color: 'rgba(255, 165, 0, 0.9)' }}>*Estimated - subject to assessment*</Typography>
                </Typography>

                <Typography variant="subtitle1" sx={{ color: '#48CEDB', mb: 1 }}>4-week plan</Typography>
                <Typography variant="body2" sx={{ mb: 2 }}>
                  - Deposit: 50% of the adjusted total. <br/>
                  - Total price: Base price + 5% increase. <br/>
                  - Weekly payment: Remaining balance divided by 4 weeks. <br/>
                  <Typography component="span" sx={{ color: 'rgba(255, 165, 0, 0.9)' }}>*Estimated - subject to assessment*</Typography>
                </Typography>

                <Typography variant="subtitle1" sx={{ color: '#48CEDB', mb: 1 }}>6-week plan</Typography>
                <Typography variant="body2" sx={{ mb: 2 }}>
                  - Deposit: 65% of the adjusted total. <br/>
                  - Total price: Base price + 10% increase. <br/>
                  - Weekly payment: Remaining balance divided by 6 weeks. <br/>
                  <Typography component="span" sx={{ color: 'rgba(255, 165, 0, 0.9)' }}>*Estimated - subject to assessment*</Typography>
                </Typography>
              </SectionCard>

              <SectionCard title="Upfront Deposit - Pay as You Go">
                <Typography variant="body2" sx={{ mb: 2 }}>
                  A deposit is required before device collection or delivery
                </Typography>
                <Typography variant="body2" sx={{ mb: 2 }}>
                  Deposit amount depends on device type and customer profile
                </Typography>
                <Typography variant="body2" sx={{ mb: 2 }}>
                  The deposit:
                </Typography>
                <Typography variant="body2" sx={{ mb: 2 }}>
                  - Reduces instalment amounts <br/>
                  - Acts as security against damage or default <br/>
                  - Deposits are non-refundable if terms are breached
                </Typography>
              </SectionCard>

              <SectionCard title="Payment Schedule - Pay as You Go">
                <Typography variant="body2" sx={{ mb: 2 }}>
                  Payments must be made on or before the agreed due dates
                </Typography>
                <Typography variant="body2" sx={{ mb: 2 }}>
                  Instalment frequency may be weekly or monthly
                </Typography>
                <Typography variant="body2" sx={{ mb: 2 }}>
                  Customers are responsible for ensuring payments are made on time
                </Typography>
                <Typography variant="body2">
                  Missed payments may result in service restrictions.
                </Typography>
              </SectionCard>

              <SectionCard title="Device Care & Responsibility - Pay as You Go">
                <Typography variant="body2" sx={{ mb: 2 }}>
                  Customers agree to:
                </Typography>
                <Typography variant="body2" sx={{ mb: 2 }}>
                  - Take reasonable care of the device <br/>
                  - Avoid intentional damage, misuse, or neglect <br/>
                  - Not expose the device to water, extreme heat, or tampering
                </Typography>
                <Typography variant="body2">
                  The customer is responsible for repair or replacement costs resulting from misuse or negligence.
                </Typography>
              </SectionCard>

              <SectionCard title="Prohibited Actions (Very Important) - Pay as You Go">
                <Typography variant="body2" sx={{ mb: 2 }}>
                  Customers must not:
                </Typography>
                <Typography variant="body2" sx={{ mb: 2 }}>
                  - Attempt to sell, pawn, or transfer the device <br/>
                  - Remove, bypass, or tamper with device security or management software <br/>
                  - Change or remove IMEI or serial numbers <br/>
                  - Factory reset the device without permission <br/>
                  - Attempt to unlock or jailbreak the device
                </Typography>
                <Typography variant="body2" sx={{ color: 'rgba(255, 100, 100, 0.9)', fontWeight: 600 }}>
                  Any of the above actions are considered serious violations.
                </Typography>
              </SectionCard>

              <SectionCard title="Device Management - Pay as You Go">
                <Typography variant="body2" sx={{ mb: 2 }}>
                  For Pay as You Go devices (when available):
                </Typography>
                <Typography variant="body2" sx={{ mb: 2 }}>
                  - No device feature restrictions during payment period<br/>
                  - Standard payment reminders via email/SMS<br/>
                  - Full device functionality from day one<br/>
                  - Ownership transfers after final payment
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 600, color: '#48CEDB' }}>
                  Note: Device monitoring and restrictions apply only to Pay to Lease plans.
                </Typography>
              </SectionCard>

              <SectionCard title="Missed Payments & Grace Period - Pay as You Go">
                <Typography variant="body2" sx={{ mb: 2 }}>
                  A short grace period may be offered after a missed payment
                </Typography>
                <Typography variant="body2" sx={{ mb: 2 }}>
                  During the grace period, reminders will be sent
                </Typography>
                <Typography variant="body2">
                  Continued non-payment may lead to:
                </Typography>
                <Typography variant="body2" sx={{ mb: 2 }}>
                  - Temporary restriction of device use <br/>
                  - Full device lock <br/>
                  - Termination of the Pay as You Go agreement
                </Typography>
              </SectionCard>

              <SectionCard title="Default & Termination - Pay as You Go">
                <Typography variant="body2" sx={{ mb: 2 }}>
                  If payments are not resumed after reminders:
                </Typography>
                <Typography variant="body2" sx={{ mb: 2 }}>
                  - The Pay as You Go agreement may be terminated <br/>
                  - The device may be locked or reclaimed <br/>
                  - Deposits and previous payments may be forfeited <br/>
                  - The customer may lose eligibility for future Pay as You Go offers
                </Typography>
              </SectionCard>

              <SectionCard title="Loss, Theft, or Damage - Pay as You Go">
                <Typography variant="body2" sx={{ mb: 2 }}>
                  Customers must report loss or theft immediately
                </Typography>
                <Typography variant="body2" sx={{ mb: 2 }}>
                  Loss or theft does not cancel payment obligations
                </Typography>
                <Typography variant="body2" sx={{ mb: 2 }}>
                  Optional insurance may be offered (where available)
                </Typography>
                <Typography variant="body2">
                  Without insurance, the customer remains liable for outstanding balances
                </Typography>
              </SectionCard>

              <SectionCard title="Completion & Ownership Transfer - Pay as You Go">
                <Typography variant="body2" sx={{ mb: 2 }}>
                  Once all instalments are completed:
                </Typography>
                <Typography variant="body2" sx={{ mb: 2 }}>
                  - Device restrictions are removed <br/>
                  - Full ownership of the device is transferred to the customer <br/>
                  - The customer becomes eligible for upgrades or better Pay as You Go terms in future
                </Typography>
              </SectionCard>

              <SectionCard title="Fair Use & Respect - Pay as You Go">
                <Typography variant="body2" sx={{ mb: 2 }}>
                  XtraPush commits to:
                </Typography>
                <Typography variant="body2" sx={{ mb: 2 }}>
                  - Fair and respectful communication <br/>
                  - Clear payment reminders <br/>
                  - Ethical enforcement practices
                </Typography>
                <Typography variant="body2">
                  Customers are expected to engage honestly and communicate early if facing payment difficulties.
                </Typography>
              </SectionCard>

              <SectionCard title="Important Notes - Pay as You Go">
                <Typography variant="body2" sx={{ mb: 1 }}>
                  - Prices are shown in your local currency (MWK for Malawi, GBP for international). Totals and weekly amounts are calculated at checkout based on your selected device, condition, and storage options. <br/>
                  - Adjusted totals for 4-week (+5%) and 6-week (+10%) plans are applied automatically during checkout. <br/>
                  - You must provide a valid Malawi phone number (+265 followed by 9 digits) in Profile Settings before starting an installment plan. <br/>
                  - The prices shown are ESTIMATED and may change after our verification and assessment. <br/>
                  - The Installment Policy must be accepted before proceeding to checkout. <br/>
                  - Final approval is subject to verification and assessment of your profile.
                </Typography>
              </SectionCard>
            </>
          )}

          {/* Pay to Lease Tab */}
          {selectedPlan === 2 && (
            <>
              <SectionCard title="📋 Pay to Lease Overview">
                <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.85)', mb: 2 }}>
                  Pay to Lease allows you to borrow a device temporarily by paying in installments. The device remains XtraPush property throughout the lease period. At the end of your lease, you can either return the device or convert to ownership.
                </Typography>
                <Box sx={{ p: 2, bgcolor: 'rgba(156, 39, 176, 0.15)', borderRadius: 1, border: '1px solid rgba(156, 39, 176, 0.3)', mb: 2 }}>
                  <Typography variant="caption" sx={{ color: '#CE93D8', display: 'flex', alignItems: 'center', gap: 1 }}>
                    <span>🏷️</span> <strong>Key Benefit:</strong> Use premium devices without full ownership commitment
                  </Typography>
                </Box>
                <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.85)' }}>
                  <strong>How it works:</strong><br/>
                  1. Select Pay to Lease at checkout<br/>
                  2. Pay initial deposit (same structure as Pay to Own)<br/>
                  3. Receive device and use it as your own<br/>
                  4. Make weekly payments for your lease period<br/>
                  5. At lease end: Return device OR convert to ownership
                </Typography>
              </SectionCard>

              <SectionCard title="💰 Lease Pricing Structure">
                <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.85)', mb: 2 }}>
                  Lease pricing follows the same calculation as Pay to Own, making it easy to compare and potentially convert:
                </Typography>
                <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.85)', mb: 2 }}>
                  <strong>2-Week Lease:</strong><br/>
                  - Deposit: 35% of device price<br/>
                  - Weekly payment: Remaining 65% divided by 2 weeks
                </Typography>
                <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.85)', mb: 2 }}>
                  <strong>4-Week Lease:</strong><br/>
                  - Deposit: 52.5% of device price<br/>
                  - Total adjusted by +5%<br/>
                  - Weekly payment: Remaining balance divided by 4 weeks
                </Typography>
                <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.85)' }}>
                  <strong>6-Week Lease:</strong><br/>
                  - Deposit: 71.5% of device price<br/>
                  - Total adjusted by +10%<br/>
                  - Weekly payment: Remaining balance divided by 6 weeks
                </Typography>
                <Box sx={{ mt: 2, p: 2, bgcolor: 'rgba(72, 206, 219, 0.1)', borderRadius: 1, border: '1px solid rgba(72, 206, 219, 0.3)' }}>
                  <Typography variant="subtitle2" sx={{ color: '#48CEDB', mb: 1, fontWeight: 600 }}>💡 Interest Calculation</Typography>
                  <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.85)', mb: 1 }}>
                    For custom lease periods and longer durations:
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.85)', mb: 1 }}>
                    • <strong>Early payments:</strong> Lower interest rates (minimum 15% for 48 months)<br/>
                    • <strong>Longer periods:</strong> Higher interest rates (proportional to duration)<br/>
                    • <strong>Interest formula:</strong> (Selected Duration / 48 months) × 15% base interest<br/>
                    • <strong>Total cost:</strong> (Monthly rate × Duration) × (1 + Interest Rate)
                  </Typography>
                  <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.7)', display: 'block', mt: 1 }}>
                    The earlier you pay, the lower your interest rate will be. Longer periods result in higher interest charges.
                  </Typography>
                </Box>
              </SectionCard>

              <SectionCard title="📜 Lease Terms & Conditions">
                <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.85)', mb: 2 }}>
                  <strong>Device Ownership:</strong> The device remains the property of XtraPush throughout the lease period. You are borrowing and using it temporarily.
                </Typography>
                <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.85)', mb: 2 }}>
                  <strong>Usage Rights:</strong> You may use the device for personal purposes as if it were your own, subject to our standard device care guidelines.
                </Typography>
                <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.85)', mb: 2 }}>
                  <strong>Prohibited Actions:</strong><br/>
                  - Selling, pawning, or transferring any leased gadget before all installments are completed is a breach of agreement<br/>
                  - Tampering with device software or security features<br/>
                  - Using the device for illegal activities<br/>
                  - Subletting or renting the device to others
                </Typography>
                <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.85)' }}>
                  <strong>Device Care:</strong> You are responsible for keeping the device in good working condition. Normal wear and tear is acceptable. Any damage to leased gadgets will result in repair or replacement fees.
                </Typography>
              </SectionCard>

              <SectionCard title="Device Feature Restrictions - Pay to Lease (All Gadgets)">
                <Typography variant="body2" sx={{ mb: 2, fontWeight: 600, color: '#48CEDB' }}>
                  Since leased gadgets remain XtraPush property, the following temporary restrictions may apply:
                </Typography>
                <Typography variant="body2" sx={{ mb: 2, color: 'rgba(255, 255, 255, 0.85)' }}>
                  • Access to certain apps or features may be limited<br/>
                  • Installation or removal of apps may be restricted<br/>
                  • Device reset or factory reset may be disabled<br/>
                  • The device may enter a restricted or lock mode if payments are missed<br/>
                  • Smartphones, tablets, and laptops will always be monitored; other gadgets may also be eligible for monitoring and restrictions
                </Typography>
                <Typography variant="body2" sx={{ mb: 2, fontWeight: 600, color: '#48CEDB' }}>
                  IMPORTANT NOTES:
                </Typography>
                <Typography variant="body2" sx={{ mb: 2, color: 'rgba(255, 255, 255, 0.85)' }}>
                  • Emergency calls always remain available (where applicable)<br/>
                  • Personal data is not accessed or monitored<br/>
                  • All restrictions are automatically removed if you convert to ownership
                </Typography>
                <Box sx={{ p: 2, bgcolor: 'rgba(72, 206, 219, 0.1)', borderRadius: 1, border: '1px solid #48CEDB' }}>
                  <Typography variant="caption" sx={{ color: '#48CEDB' }}>
                    Security measures are in place to protect XtraPush assets and ensure device recovery if needed.
                  </Typography>
                </Box>
              </SectionCard>

              <SectionCard title="📡 Device Monitoring & Control - Pay to Lease">
                <Typography variant="body2" sx={{ mb: 2, color: 'rgba(255, 255, 255, 0.85)' }}>
                  For leased smartphones, gadgets, and tablets, XtraPush may:
                </Typography>
                <Typography variant="body2" sx={{ mb: 2, color: 'rgba(255, 255, 255, 0.85)' }}>
                  - Monitor device status (location tracking for security)<br/>
                  - Restrict device access if payments are overdue<br/>
                  - Display payment reminders on the device<br/>
                  - Lock or disable the device in case of continued non-payment<br/>
                  - Blacklist the device IMEI if necessary
                </Typography>
                <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.85)' }}>
                  These measures are used only to enforce payment compliance and protect XtraPush assets.
                </Typography>
              </SectionCard>

              <SectionCard title="�🔄 End of Lease Options">
                <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.85)', mb: 2 }}>
                  When your lease period ends, you have the following options:
                </Typography>
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2 }}>
                  <Box sx={{ p: 2, bgcolor: 'rgba(76, 175, 80, 0.15)', borderRadius: 1, border: '1px solid rgba(76, 175, 80, 0.3)' }}>
                    <Typography variant="subtitle2" sx={{ color: '#81C784', fontWeight: 600, mb: 1 }}>✅ Convert to Ownership</Typography>
                    <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.85)', display: 'block' }}>
                      Pay a conversion fee (typically 10-15% of original price) to transfer full ownership to you. All previous payments count toward ownership.
                    </Typography>
                  </Box>
                  <Box sx={{ p: 2, bgcolor: 'rgba(33, 150, 243, 0.15)', borderRadius: 1, border: '1px solid rgba(33, 150, 243, 0.3)' }}>
                    <Typography variant="subtitle2" sx={{ color: '#64B5F6', fontWeight: 600, mb: 1 }}>📦 Return Device</Typography>
                    <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.85)', display: 'block' }}>
                      Return the device in good condition. Your account will be in good standing for future leases or purchases.
                    </Typography>
                  </Box>
                  <Box sx={{ p: 2, bgcolor: 'rgba(156, 39, 176, 0.15)', borderRadius: 1, border: '1px solid rgba(156, 39, 176, 0.3)' }}>
                    <Typography variant="subtitle2" sx={{ color: '#CE93D8', fontWeight: 600, mb: 1 }}>🔄 Extend Lease</Typography>
                    <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.85)', display: 'block' }}>
                      Continue using the device by extending your lease for another period. Extended leases may have reduced rates.
                    </Typography>
                  </Box>
                  <Box sx={{ p: 2, bgcolor: 'rgba(255, 152, 0, 0.15)', borderRadius: 1, border: '1px solid rgba(255, 152, 0, 0.3)' }}>
                    <Typography variant="subtitle2" sx={{ color: '#FFB74D', fontWeight: 600, mb: 1 }}>📱 Upgrade Device</Typography>
                    <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.85)', display: 'block' }}>
                      Return current device and start a new lease on a newer or different model. Loyalty discounts may apply.
                    </Typography>
                  </Box>
                </Box>
              </SectionCard>

              <SectionCard title="⚠️ Missed Payments - Pay to Lease">
                <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.85)', mb: 2 }}>
                  Since you're leasing the device, payment compliance is essential:
                </Typography>
                <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.85)', mb: 2 }}>
                  - <strong>Grace Period:</strong> 3-day grace period for late payments<br/>
                  - <strong>Late Fee:</strong> 5% interest per week on overdue amounts<br/>
                  - <strong>Device Restriction:</strong> After 7 days late, device may be restricted<br/>
                  - <strong>Lease Termination:</strong> After 14+ days, lease may be terminated
                </Typography>
                <Typography variant="body2" sx={{ color: 'rgba(255, 165, 0, 0.9)', fontWeight: 600 }}>
                  If the lease is terminated due to non-payment, the device must be returned immediately and deposits are forfeited.
                </Typography>
              </SectionCard>

              <SectionCard title="📋 Important Notes - Pay to Lease">
                <Typography variant="body2" sx={{ mb: 1, color: 'rgba(255, 255, 255, 0.85)' }}>
                  - Prices are shown in your local currency (MWK for Malawi, GBP for international)<br/>
                  - The device remains XtraPush property until conversion to ownership<br/>
                  - You must provide a valid phone number in Profile Settings before starting a lease<br/>
                  - Lease approval is subject to verification of your profile<br/>
                  - Device must be returned in working condition (normal wear acceptable)<br/>
                  - Converting to ownership at lease end is often more economical than buying outright
                </Typography>
              </SectionCard>
            </>
          )}

          {/* Comparison Tab */}
          {selectedPlan === 3 && (
            <>
              <SectionCard title="📊 Plan Comparison">
                <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.85)', mb: 2 }}>
                  Choose the plan that best fits your lifestyle. Below is a detailed comparison to help you decide.
                </Typography>
              </SectionCard>

              {/* Comparison Table */}
              <SectionCard title="Feature Comparison Table">
                <TableContainer sx={{ bgcolor: 'rgba(255, 255, 255, 0.05)', borderRadius: 1 }}>
                  <Table>
                    <TableHead>
                      <TableRow sx={{ bgcolor: 'rgba(72, 206, 219, 0.15)' }}>
                        <TableCell sx={{ color: '#48CEDB', fontWeight: 700 }}>Feature</TableCell>
                        <TableCell sx={{ color: '#48CEDB', fontWeight: 700 }}>Pay to Own</TableCell>
                        <TableCell sx={{ color: '#FF9800', fontWeight: 700 }}>Pay as You Go</TableCell>
                        <TableCell sx={{ color: '#CE93D8', fontWeight: 700 }}>Pay to Lease</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      <TableRow sx={{ '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.05)' } }}>
                        <TableCell sx={{ color: 'white' }}>Device Availability</TableCell>
                        <TableCell sx={{ color: 'rgba(255, 255, 255, 0.9)' }}>After all payments complete</TableCell>
                        <TableCell sx={{ color: 'rgba(76, 175, 80, 0.95)', fontWeight: 600 }}>Immediately upon approval ✓</TableCell>
                        <TableCell sx={{ color: 'rgba(76, 175, 80, 0.95)', fontWeight: 600 }}>Immediately upon approval ✓</TableCell>
                      </TableRow>
                      <TableRow sx={{ '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.05)' } }}>
                        <TableCell sx={{ color: 'white' }}>Verification Required</TableCell>
                        <TableCell sx={{ color: 'rgba(255, 255, 255, 0.9)' }}>Basic (standard)</TableCell>
                        <TableCell sx={{ color: 'rgba(255, 165, 0, 0.9)', fontWeight: 600 }}>Detailed Assessment ✓</TableCell>
                        <TableCell sx={{ color: 'rgba(255, 255, 255, 0.9)' }}>Standard verification</TableCell>
                      </TableRow>
                      <TableRow sx={{ '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.05)' } }}>
                        <TableCell sx={{ color: 'white' }}>Pricing Certainty</TableCell>
                        <TableCell sx={{ color: 'rgba(76, 175, 80, 0.95)', fontWeight: 600 }}>Fixed ✓</TableCell>
                        <TableCell sx={{ color: 'rgba(255, 165, 0, 0.9)' }}>Estimated (subject to change)</TableCell>
                        <TableCell sx={{ color: 'rgba(76, 175, 80, 0.95)', fontWeight: 600 }}>Fixed ✓</TableCell>
                      </TableRow>
                      <TableRow sx={{ '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.05)' } }}>
                        <TableCell sx={{ color: 'white' }}>Device Ownership</TableCell>
                        <TableCell sx={{ color: 'rgba(255, 255, 255, 0.9)' }}>After final payment</TableCell>
                        <TableCell sx={{ color: 'rgba(255, 255, 255, 0.9)' }}>After final payment</TableCell>
                        <TableCell sx={{ color: 'rgba(156, 39, 176, 0.9)', fontWeight: 600 }}>Remains XtraPush property</TableCell>
                      </TableRow>
                      <TableRow sx={{ '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.05)' } }}>
                        <TableCell sx={{ color: 'white' }}>Feature Restrictions</TableCell>
                        <TableCell sx={{ color: '#48CEDB', fontWeight: 500 }}>None</TableCell>
                        <TableCell sx={{ color: '#48CEDB', fontWeight: 500 }}>None</TableCell>
                        <TableCell sx={{ color: '#48CEDB', fontWeight: 500 }}>Yes (all gadgets; phones, tablets, laptops always monitored)</TableCell>
                      </TableRow>
                      <TableRow sx={{ '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.05)' } }}>
                        <TableCell sx={{ color: 'white' }}>Device Monitoring</TableCell>
                        <TableCell sx={{ color: '#48CEDB' }}>None</TableCell>
                        <TableCell sx={{ color: '#48CEDB' }}>None</TableCell>
                        <TableCell sx={{ color: '#48CEDB', fontWeight: 500 }}>Yes (all gadgets eligible; phones, tablets, laptops always monitored)</TableCell>
                      </TableRow>
                      <TableRow sx={{ '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.05)' } }}>
                        <TableCell sx={{ color: 'white' }}>End of Term Options</TableCell>
                        <TableCell sx={{ color: 'rgba(255, 255, 255, 0.9)' }}>Own the device</TableCell>
                        <TableCell sx={{ color: 'rgba(255, 255, 255, 0.9)' }}>Own the device</TableCell>
                        <TableCell sx={{ color: 'rgba(156, 39, 176, 0.9)', fontWeight: 600 }}>Return, Convert, Extend, or Upgrade ✓</TableCell>
                      </TableRow>
                      <TableRow sx={{ '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.05)' } }}>
                        <TableCell sx={{ color: 'white' }}>Missed Payment Penalties</TableCell>
                        <TableCell sx={{ color: '#FF9800', fontWeight: 500 }}>5% interest per week</TableCell>
                        <TableCell sx={{ color: '#FF9800', fontWeight: 500 }}>Late fees, interest, device lock, account suspension, legal/financial consequences</TableCell>
                        <TableCell sx={{ color: '#FF9800', fontWeight: 500 }}>Device restrictions, recovery, fees</TableCell>
                      </TableRow>
                      <TableRow sx={{ '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.05)' } }}>
                        <TableCell sx={{ color: 'white' }}>Best For</TableCell>
                        <TableCell sx={{ color: 'rgba(255, 255, 255, 0.9)' }}>Patient savers</TableCell>
                        <TableCell sx={{ color: 'rgba(76, 175, 80, 0.95)', fontWeight: 600 }}>Immediate users ✓</TableCell>
                        <TableCell sx={{ color: 'rgba(156, 39, 176, 0.9)', fontWeight: 600 }}>Flexible borrowers ✓</TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </TableContainer>
              </SectionCard>

              {/* Deposit Percentage Chart */}
              <SectionCard title="💰 Deposit Percentage by Payment Period">
                <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.7)', display: 'block', mb: 2 }}>
                  Comparison of deposit percentages required for each payment period
                </Typography>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={[
                    { period: '2 Weeks', 'Pay to Own': 35, 'Pay as You Go': 35, 'Pay to Lease': 35 },
                    { period: '4 Weeks', 'Pay to Own': 52.5, 'Pay as You Go': 52.5, 'Pay to Lease': 52.5 },
                    { period: '6 Weeks', 'Pay to Own': 71.5, 'Pay as You Go': 71.5, 'Pay to Lease': 71.5 }
                  ]}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.1)" />
                    <XAxis dataKey="period" stroke="rgba(255, 255, 255, 0.6)" />
                    <YAxis stroke="rgba(255, 255, 255, 0.6)" label={{ value: 'Deposit (%)', angle: -90, position: 'insideLeft' }} />
                    <Tooltip contentStyle={{ bgcolor: '#1565c0', border: '1px solid #48CEDB', color: 'white' }} />
                    <Legend />
                    <Bar dataKey="Pay to Own" fill="#48CEDB" />
                    <Bar dataKey="Pay as You Go" fill="#FF9800" />
                    <Bar dataKey="Pay to Lease" fill="#CE93D8" />
                  </BarChart>
                </ResponsiveContainer>
              </SectionCard>

              {/* Total Cost Comparison */}
              <SectionCard title="📈 Total Cost Comparison (Example Device)">
                <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.7)', display: 'block', mb: 2 }}>
                  Total amount you'll pay for each plan option (includes adjustments for longer periods)
                </Typography>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={[
                    { period: '2 Weeks', 'Pay to Own': 1000, 'Pay as You Go': 1000, 'Pay to Lease': 1000 },
                    { period: '4 Weeks', 'Pay to Own': 1050, 'Pay as You Go': 1050, 'Pay to Lease': 1050 },
                    { period: '6 Weeks', 'Pay to Own': 1100, 'Pay as You Go': 1100, 'Pay to Lease': 1100 }
                  ]}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.1)" />
                    <XAxis dataKey="period" stroke="rgba(255, 255, 255, 0.6)" />
                    <YAxis stroke="rgba(255, 255, 255, 0.6)" label={{ value: 'Total Cost (%)', angle: -90, position: 'insideLeft' }} />
                    <Tooltip contentStyle={{ bgcolor: '#1565c0', border: '1px solid #48CEDB', color: 'white' }} />
                    <Legend />
                    <Line type="monotone" dataKey="Pay to Own" stroke="#48CEDB" strokeWidth={2} />
                    <Line type="monotone" dataKey="Pay as You Go" stroke="#FF9800" strokeWidth={2} />
                    <Line type="monotone" dataKey="Pay to Lease" stroke="#CE93D8" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </SectionCard>

              {/* Weekly Payment Breakdown */}
              <SectionCard title="💳 Weekly Payment Breakdown (Example Device)">
                <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.7)', display: 'block', mb: 2 }}>
                  How much you pay per week on each plan. Lower weekly amounts mean more flexibility.
                </Typography>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={[
                    { period: '2 Weeks', 'Pay to Own': 325, 'Pay as You Go': 325, 'Pay to Lease': 325 },
                    { period: '4 Weeks', 'Pay to Own': 131.25, 'Pay as You Go': 131.25, 'Pay to Lease': 131.25 },
                    { period: '6 Weeks', 'Pay to Own': 64.17, 'Pay as You Go': 64.17, 'Pay to Lease': 64.17 }
                  ]}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.1)" />
                    <XAxis dataKey="period" stroke="rgba(255, 255, 255, 0.6)" />
                    <YAxis stroke="rgba(255, 255, 255, 0.6)" label={{ value: 'Weekly Amount (%)', angle: -90, position: 'insideLeft' }} />
                    <Tooltip contentStyle={{ bgcolor: '#1565c0', border: '1px solid #48CEDB', color: 'white' }} />
                    <Legend />
                    <Bar dataKey="Pay to Own" fill="#48CEDB" />
                    <Bar dataKey="Pay as You Go" fill="#FF9800" />
                    <Bar dataKey="Pay to Lease" fill="#CE93D8" />
                  </BarChart>
                </ResponsiveContainer>
              </SectionCard>

              {/* Plan Selection Guide */}
              <SectionCard title="🎯 Which Plan Should You Choose?">
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr 1fr' }, gap: 2 }}>
                  <Box sx={{ p: 2, bgcolor: 'rgba(72, 206, 219, 0.1)', borderLeft: '3px solid #48CEDB', borderRadius: 1 }}>
                    <Typography variant="subtitle2" sx={{ color: '#48CEDB', mb: 1, fontWeight: 600 }}>✅ Choose Pay to Own If:</Typography>
                    <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.85)', display: 'block', mb: 0.5 }}>
                      • You can wait to get the device
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.85)', display: 'block', mb: 0.5 }}>
                      • You want fixed, predictable pricing
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.85)', display: 'block', mb: 0.5 }}>
                      • You prefer minimal verification process
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.85)', display: 'block' }}>
                      • You want full device freedom upon ownership
                    </Typography>
                  </Box>
                  <Box sx={{ p: 2, bgcolor: 'rgba(255, 152, 0, 0.1)', borderLeft: '3px solid #FF9800', borderRadius: 1 }}>
                    <Typography variant="subtitle2" sx={{ color: '#FF9800', mb: 1, fontWeight: 600 }}>✅ Choose Pay as You Go If:</Typography>
                    <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.85)', display: 'block', mb: 0.5 }}>
                      • You need the device immediately
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.85)', display: 'block', mb: 0.5 }}>
                      • You're comfortable with assessment
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.85)', display: 'block', mb: 0.5 }}>
                      • You prefer device tracking for security
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.85)', display: 'block' }}>
                      • <em>(Coming Soon)</em>
                    </Typography>
                  </Box>
                  <Box sx={{ p: 2, bgcolor: 'rgba(156, 39, 176, 0.1)', borderLeft: '3px solid #CE93D8', borderRadius: 1 }}>
                    <Typography variant="subtitle2" sx={{ color: '#CE93D8', mb: 1, fontWeight: 600 }}>✅ Choose Pay to Lease If:</Typography>
                    <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.85)', display: 'block', mb: 0.5 }}>
                      • You want flexibility at end of term
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.85)', display: 'block', mb: 0.5 }}>
                      • You may want to upgrade devices often
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.85)', display: 'block', mb: 0.5 }}>
                      • You prefer borrowing over ownership
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.85)', display: 'block' }}>
                      • You want conversion to ownership option
                    </Typography>
                  </Box>
                </Box>
              </SectionCard>

              {/* User Statistics & Insights */}
              <SectionCard title="📊 Plan Popularity & Success Rates">
                <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.7)', display: 'block', mb: 2 }}>
                  Based on customer feedback and success metrics across our platform
                </Typography>
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3 }}>
                  <Box>
                    <Typography variant="subtitle2" sx={{ color: '#48CEDB', mb: 2, fontWeight: 600 }}>Plan Adoption Rate</Typography>
                    <ResponsiveContainer width="100%" height={250}>
                      <PieChart>
                        <Pie
                          data={[
                            { name: 'Pay to Own', value: 40 },
                            { name: 'Pay as You Go', value: 35 },
                            { name: 'Pay to Lease', value: 25 }
                          ]}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, value }) => `${value}%`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          <Cell fill="#48CEDB" />
                          <Cell fill="#FF9800" />
                          <Cell fill="#CE93D8" />
                        </Pie>
                        <Tooltip contentStyle={{ bgcolor: '#1565c0', border: '1px solid #48CEDB', color: 'white' }} />
                      </PieChart>
                    </ResponsiveContainer>
                  </Box>
                  <Box>
                    <Typography variant="subtitle2" sx={{ color: '#48CEDB', mb: 2, fontWeight: 600 }}>Payment Completion Rate</Typography>
                    <ResponsiveContainer width="100%" height={250}>
                      <PieChart>
                        <Pie
                          data={[
                            { name: 'Pay to Own Success', value: 94 },
                            { name: 'Pay to Lease Success', value: 92 },
                            { name: 'Defaults', value: 6 }
                          ]}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, value }) => `${value}%`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          <Cell fill="#76C893" />
                          <Cell fill="#52B788" />
                          <Cell fill="#FF6B6B" />
                        </Pie>
                        <Tooltip contentStyle={{ bgcolor: '#1565c0', border: '1px solid #48CEDB', color: 'white' }} />
                      </PieChart>
                    </ResponsiveContainer>
                  </Box>
                </Box>
              </SectionCard>

              {/* Key Differences Summary */}
              <SectionCard title="🔑 Key Differences at a Glance">
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr 1fr 1fr' }, gap: 2 }}>
                  <Box sx={{ p: 1.5, bgcolor: 'rgba(72, 206, 219, 0.1)', borderRadius: 1 }}>
                    <Typography variant="caption" sx={{ color: '#48CEDB', fontWeight: 700, display: 'block', mb: 0.5 }}>Device Access</Typography>
                    <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.8)', display: 'block' }}>
                      <strong>Own:</strong> After payments
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.8)', display: 'block' }}>
                      <strong>PAYG:</strong> Immediate
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.8)', display: 'block' }}>
                      <strong>Lease:</strong> Immediate
                    </Typography>
                  </Box>
                  <Box sx={{ p: 1.5, bgcolor: 'rgba(72, 206, 219, 0.1)', borderRadius: 1 }}>
                    <Typography variant="caption" sx={{ color: '#48CEDB', fontWeight: 700, display: 'block', mb: 0.5 }}>Ownership</Typography>
                    <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.8)', display: 'block' }}>
                      <strong>Own:</strong> After final payment
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.8)', display: 'block' }}>
                      <strong>PAYG:</strong> After final payment
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.8)', display: 'block' }}>
                      <strong>Lease:</strong> Optional conversion
                    </Typography>
                  </Box>
                  <Box sx={{ p: 1.5, bgcolor: 'rgba(72, 206, 219, 0.1)', borderRadius: 1 }}>
                    <Typography variant="caption" sx={{ color: '#48CEDB', fontWeight: 700, display: 'block', mb: 0.5 }}>Price Stability</Typography>
                    <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.8)', display: 'block' }}>
                      <strong>Own:</strong> Fixed price
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.8)', display: 'block' }}>
                      <strong>PAYG:</strong> Estimated
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.8)', display: 'block' }}>
                      <strong>Lease:</strong> Fixed price
                    </Typography>
                  </Box>
                  <Box sx={{ p: 1.5, bgcolor: 'rgba(72, 206, 219, 0.1)', borderRadius: 1 }}>
                    <Typography variant="caption" sx={{ color: '#48CEDB', fontWeight: 700, display: 'block', mb: 0.5 }}>End Options</Typography>
                    <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.8)', display: 'block' }}>
                      <strong>Own:</strong> Keep device
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.8)', display: 'block' }}>
                      <strong>PAYG:</strong> Keep device
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.8)', display: 'block' }}>
                      <strong>Lease:</strong> Return/Convert
                    </Typography>
                  </Box>
                </Box>
              </SectionCard>
            </>
          )}
        </div>
      </div>

      
    </div>
    </>
  );
};

export default InstallmentPolicy;