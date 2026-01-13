import React, { useState } from 'react';
import { Typography, Box, Accordion, AccordionSummary, AccordionDetails, Card, CardContent, Grid } from '@mui/material';
import { useLocation } from 'react-router-dom';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import ContactSupportIcon from '@mui/icons-material/ContactSupport';
import InfoIcon from '@mui/icons-material/Info';
import SEOMeta from './components/SEOMeta.jsx';
import { getCanonicalUrl } from './utils/seoUtils.js';
import styles from './style';

const Help = () => {
  const location = useLocation();
  const [activeTitle, setActiveTitle] = useState('Help');
  const [toggle, setToggle] = useState(false);

  const faqData = [
    {
      category: "Orders & Shopping",
      questions: [
        {
          question: "How do I place an order on Xtrapush Gadgets?",
          answer: "Placing an order is simple and secure:\n\n1. **Browse Products**: Navigate through our extensive catalog of smartphones, tablets, laptops, and accessories using the search bar or category filters.\n\n2. **Select Your Device**: Click on any product to view detailed specifications, condition grades (New, Like New, Good, Fair), available storage variants, and pricing in both GBP (£) and MWK.\n\n3. **Choose Variants**: Select your preferred storage capacity, color, and device condition. Our system automatically adjusts pricing based on your selections.\n\n4. **Add to Cart**: Click 'Add to Cart' and continue shopping or proceed to checkout.\n\n5. **Review Cart**: View your cart, apply any discount codes, and verify shipping details.\n\n6. **Checkout**: Complete your purchase using our secure payment gateway (PayChangu for Malawi customers, or card payments for international orders).\n\n7. **Confirmation**: You'll receive an instant email confirmation with your order details, estimated delivery time, and tracking information."
        },
        {
          question: "Can I modify or cancel my order after placing it?",
          answer: "Order modifications depend on the processing status:\n\n**Before Dispatch** (within 2 hours of order):  \nContact our support team immediately at conrad@itsxtrapush.com or via WhatsApp. We can modify addresses, change delivery preferences, or cancel orders that haven't been processed yet.\n\n**After Dispatch**:  \nOrders cannot be modified once shipped. However, you can refuse delivery and request a return/refund following our 30-day return policy.\n\n**For Installment Orders**:  \nIf you're on an installment payment plan, cancellation requires settling any outstanding balance or returning the device. Please review our Installment Terms for complete details.\n\n**For Trade-In Orders**:  \nOnce a trade-in device has been shipped or picked up, the transaction cannot be cancelled. However, you can decline the final quote if the inspection differs from your assessment."
        },
        {
          question: "How does the condition grading system work?",
          answer: "We use a professional 4-tier grading system for pre-owned devices:\n\n**New**: Brand new, sealed in original packaging with full manufacturer warranty. Never used or opened.\n\n**Like New**: Professionally refurbished devices in pristine condition. May have been opened but show no signs of use. Includes all original accessories and comes with our warranty.\n\n**Good**: Gently used devices with minor cosmetic wear (light scratches on back/edges). Fully functional with no performance issues. Tested and certified. May have aftermarket accessories.\n\n**Fair**: Devices with visible cosmetic wear (scratches, dents, or scuffs) but 100% functional. All features work perfectly. Great value option. Includes charging cable.\n\nAll devices undergo rigorous testing including battery health checks, screen functionality, camera quality, connectivity, and software performance before listing."
        }
      ]
    },
    {
      category: "Payment & Pricing",
      questions: [
        {
          question: "What payment methods are available?",
          answer: "We offer flexible payment options to suit your needs:\n\n**For Malawi Customers**:  \n• **PayChangu**: Our primary payment gateway for MWK transactions. Supports mobile money (Airtel Money, TNM Mpamba) and bank transfers.  \n• **Currency**: Prices displayed in Malawian Kwacha (MWK) when accessing from Malawi.\n\n**For International Customers (UK/Global)**:  \n• **Card Payments**: Visa, Mastercard, and American Express accepted via our secure Square payment processor.  \n• **Currency**: Prices displayed in British Pounds (£ GBP) for international access.\n\n**Installment Payments**:  \nAvailable for orders above MWK 200,000 or £100. Choose from 4, 8, 12, or 24-week payment plans with competitive interest rates. Requires active subscription (Plus or Premium) for the best rates.\n\n**Security**: All transactions are encrypted with SSL/TLS. We never store your full card details on our servers."
        },
        {
          question: "How does installment payment work?",
          answer: "Our flexible installment system makes premium gadgets accessible:\n\n**Eligibility**:  \n• Order value must be at least MWK 200,000 (or £100 equivalent)  \n• Valid phone number required for SMS payment reminders  \n• Active email address for digital receipts\n\n**How It Works**:  \n1. **Select Duration**: Choose your payment period - 4, 8, 12, or 24 weeks  \n2. **Review Terms**: See your weekly payment amount, total interest, and final cost  \n3. **Down Payment**: Pay initial amount (typically 20-30% of total)  \n4. **Weekly Payments**: Receive SMS reminders before each payment due date  \n5. **Early Settlement**: Pay remaining balance anytime without penalties\n\n**Interest Rates** (variable based on period and subscription):  \n• 4 weeks: 5-8% total interest  \n• 8 weeks: 10-15% total interest  \n• 12 weeks: 15-22% total interest  \n• 24 weeks: 25-35% total interest\n\n**Subscription Benefits**:  \nXtraPush Plus or Premium members receive reduced interest rates (up to 40% discount).\n\n**Payment Methods**: Same as standard orders - PayChangu (MWK) or card payments (GBP)."
        },
        {
          question: "Why do prices show in both GBP and MWK?",
          answer: "Xtrapush Gadgets serves both Malawian and international customers:\n\n**Automatic Currency Detection**:  \nOur system uses geolocation to detect your location and display prices in your local currency automatically:\n\n• **Malawi Access**: Prices shown in MWK (Malawian Kwacha)  \n• **UK/International**: Prices shown in £ GBP (British Pounds)\n\n**Conversion Rates**:  \nWe use real-time exchange rates updated daily to ensure fair pricing across both currencies. The rate is locked at checkout to protect you from fluctuations during your transaction.\n\n**Manual Override**:  \nYou can manually switch currencies using the selector in the top navigation bar if needed (useful for travelers or comparison shopping).\n\n**Dual Pricing Benefits**:  \n• Transparent pricing for all customers  \n• No hidden conversion fees  \n• Pay in your preferred currency  \n• Consistent value across regions"
        },
        {
          question: "Do you offer discounts or promotional codes?",
          answer: "Yes! We regularly offer various discount opportunities:\n\n**Promotional Codes**:  \nEnter codes at checkout for instant discounts. Check your email, our social media, or homepage banners for active promotions.\n\n**Subscription Member Discounts**:  \n• **Plus Members**: 5-10% off all purchases  \n• **Premium Members**: 10-15% off all purchases  \nAutomatically applied when logged in.\n\n**Seasonal Sales**:  \n• Black Friday/Cyber Monday deals  \n• New Year clearance sales  \n• Back to school promotions  \n• Holiday specials\n\n**Trade-In Bonuses**:  \nGet additional 10-20% trade-in value when using credit toward a new purchase.\n\n**Newsletter Exclusives**:  \nSubscribe to our newsletter for exclusive first-access deals and member-only discount codes.\n\n**Referral Program**:  \nRefer friends and earn credit toward future purchases (coming soon)."
        }
      ]
    },
    {
      category: "Shipping & Delivery",
      questions: [
        {
          question: "What are your delivery times and coverage areas?",
          answer: "We offer reliable delivery across Malawi with expanding international options:\n\n**Lilongwe** (Same-Day Delivery):  \n• Orders placed before 5:00 PM are delivered the same day  \n• Orders after 5:00 PM are delivered next business day  \n• Free delivery for orders above MWK 150,000  \n• Standard delivery fee: MWK 5,000\n\n**Blantyre & Mzuzu** (Express Delivery):  \n• Same-day or next-day delivery via trusted courier partners  \n• Free delivery for orders above MWK 200,000  \n• Standard delivery fee: MWK 8,000\n\n**Other Malawi Cities**:  \n• 1-3 business days depending on location  \n• Delivery fee varies by distance (MWK 10,000-15,000)  \n• Courier tracking provided\n\n**International Shipping** (Coming Soon):  \nWe're expanding to UK, South Africa, and other African countries. Subscribe to our newsletter for updates.\n\n**Delivery Requirements**:  \n• Active phone number for delivery coordination  \n• Someone must be available to receive and sign for the package  \n• Photo ID verification for high-value orders (above MWK 500,000)"
        },
        {
          question: "How can I track my order?",
          answer: "Multiple ways to stay updated on your delivery:\n\n**Email Tracking**:  \n1. **Order Confirmation**: Instant email when order is placed  \n2. **Processing Update**: Email when payment is confirmed and order is being prepared  \n3. **Dispatch Notification**: Email with tracking details when item ships  \n4. **Delivery Confirmation**: Email receipt when delivered\n\n**Dashboard Tracking**:  \n1. Log into your ItsXtraPush account  \n2. Navigate to 'My Orders' in your dashboard  \n3. Click on any order to view real-time status:  \n   • Pending (payment processing)  \n   • Confirmed (order accepted)  \n   • Preparing (device being tested/packaged)  \n   • Dispatched (on the way)  \n   • Delivered (received by customer)\n\n**SMS Updates**:  \nReceive text messages at key stages if you've opted in for notifications.\n\n**Courier Tracking**:  \nFor Blantyre/Mzuzu deliveries, you'll receive a tracking number to follow your package through the courier's system.\n\n**Support Queries**:  \nContact conrad@itsxtrapush.com with your order number for manual tracking assistance."
        },
        {
          question: "What if I'm not available when delivery arrives?",
          answer: "We understand schedules can be unpredictable:\n\n**Rescheduling**:  \nOur delivery team will call you 30 minutes before arrival. If you're unavailable, you can reschedule for the same day (if before 3 PM) or next business day at no extra charge.\n\n**Alternative Recipient**:  \nYou can authorize someone else to receive your package by informing our support team in advance. They'll need:  \n• Your order number  \n• Their full name and phone number  \n• Photo ID matching the authorized name\n\n**Delivery Instructions**:  \nProvide specific instructions at checkout (e.g., 'Leave with security guard', 'Call upon arrival', 'Deliver to office address').\n\n**Failed Delivery Attempts**:  \n• 1st attempt: Free rescheduling  \n• 2nd attempt: Free rescheduling  \n• 3rd attempt: MWK 2,000 redelivery fee or arrange pickup from our office\n\n**Pickup Option**:  \nChoose to collect your order from our Lilongwe office (Area 47) at your convenience during business hours (Mon-Fri: 8 AM - 5 PM, Sat: 9 AM - 2 PM)."
        }
      ]
    },
    {
      category: "Subscriptions & Membership",
      questions: [
        {
          question: "What are XtraPush Plus and Premium subscriptions?",
          answer: "Our membership tiers unlock exclusive benefits and savings:\n\n**XtraPush Plus** (Entry-Level Membership):  \n**Price**: £5.99/month or MWK 9,999/month  \n**Benefits**:  \n• ✅ Unlimited free standard delivery (save MWK 5,000 per order)  \n• ✅ Single device insurance (one smartphone/tablet/laptop covered)  \n• ✅ 5-10% member discount on all purchases  \n• ✅ Reduced installment interest rates  \n• ✅ Priority email support (24-hour response time)  \n• ✅ Early access to new arrivals and flash sales\n\n**XtraPush Premium** (Ultimate Membership):  \n**Price**: £11.99/month or MWK 19,999/month  \n**Benefits**:  \nAll Plus benefits PLUS:  \n• ✅ Multiple device insurance (cover up to 3 devices simultaneously)  \n• ✅ 10-15% member discount (higher than Plus)  \n• ✅ Maximum installment interest rate reduction (up to 40% off standard rates)  \n• ✅ Free express delivery (Blantyre/Mzuzu same-day)  \n• ✅ Priority phone/WhatsApp support (1-hour response time)  \n• ✅ Extended warranty on all purchases (additional 6 months)  \n• ✅ Free device health checks and software support  \n• ✅ Exclusive Premium-only deals and bundles\n\n**Mutual Exclusivity**: You can only have one active subscription at a time. Upgrade from Plus to Premium anytime. Downgrade at next billing cycle.\n\n**No Commitment**: Cancel anytime before your next billing date. No cancellation fees."
        },
        {
          question: "How does device insurance work with subscriptions?",
          answer: "Our subscription-based insurance provides comprehensive protection:\n\n**Coverage Included**:  \n• **Accidental Damage**: Drops, cracks, liquid damage  \n• **Theft Protection**: Stolen devices (police report required)  \n• **Mechanical Breakdown**: Hardware failures outside warranty period  \n• **Battery Degradation**: Replacement if battery health drops below 70%\n\n**Device Linking Process**:  \n1. Subscribe to Plus (1 device) or Premium (3 devices)  \n2. Link your devices in the dashboard under 'Insurance > My Devices'  \n3. Provide device details: Brand, model, IMEI, purchase receipt  \n4. Insurance activates 24 hours after linking  \n5. Coverage remains active as long as subscription is paid\n\n**Claims Process**:  \n1. Report incident within 48 hours via dashboard or email  \n2. Provide photos/documentation (police report for theft)  \n3. Pay deductible (if applicable):  \n   • Accidental damage: MWK 25,000-50,000 depending on device value  \n   • Theft: MWK 75,000  \n   • Mechanical issues: No deductible  \n4. Receive replacement or repair within 5-7 business days\n\n**Claim Limits**:  \n• 2 claims per device per year  \n• Maximum claim value: MWK 2,000,000 per device\n\n**Device Requirements**:  \n• Must be purchased from ItsXtraPush or verified authentic  \n• Device age: Less than 3 years old  \n• Good working condition when linked\n\n**What's NOT Covered**: Intentional damage, unauthorized repairs, cosmetic damage only, lost (not stolen) devices."
        },
        {
          question: "Can I upgrade or downgrade my subscription?",
          answer: "Yes! Subscription changes are flexible:\n\n**Upgrading (Plus → Premium)**:  \n• **Immediate**: Upgrade takes effect instantly  \n• **Prorated Billing**: You're charged the difference between plans for the remaining billing period  \n• **Benefits**: All Premium benefits activate immediately, including additional device insurance slots  \n• **Process**: Go to Dashboard > Subscriptions > Upgrade to Premium\n\n**Downgrading (Premium → Plus)**:  \n• **Delayed**: Downgrade takes effect at the end of your current billing cycle  \n• **Refund**: No partial refunds for unused Premium time  \n• **Device Insurance**: If you have more than 1 device linked, you must remove extras before downgrading  \n• **Process**: Go to Dashboard > Subscriptions > Downgrade to Plus\n\n**Mutual Exclusivity Rule**:  \nYou can only have ONE active subscription (either Plus OR Premium) at any time. You cannot hold both simultaneously.\n\n**Cancellation**:  \n• Cancel anytime from your dashboard  \n• Benefits remain active until end of current billing period  \n• No early termination fees  \n• Reactivate anytime (previous settings restored if within 60 days)\n\n**Important Notes**:  \n• Device insurance coverage ends when subscription lapses  \n• Active installment plans require maintaining subscription for best rates  \n• Downgrading removes access to Premium-exclusive features immediately at billing cycle end"
        }
      ]
    },
    {
      category: "Returns & Warranty",
      questions: [
        {
          question: "What is your return policy?",
          answer: "We offer a comprehensive 30-day satisfaction guarantee:\n\n**Eligibility**:  \n• Returns accepted within 30 days of delivery  \n• Device must be in original condition  \n• Original packaging and all accessories included  \n• No signs of damage or excessive use  \n• Protective seals intact (for new devices)\n\n**Return Process**:  \n1. Contact conrad@itsxtrapush.com within 30 days  \n2. Provide order number and reason for return  \n3. Receive return authorization code (RMA)  \n4. Package device securely with all original items  \n5. Ship to our address or schedule pickup (Lilongwe only)  \n6. Inspection completed within 3 business days  \n7. Refund processed to original payment method\n\n**Refund Timeline**:  \n• PayChangu: 3-5 business days  \n• Card payments: 5-10 business days  \n• Installment orders: Outstanding balance cancelled, paid amount refunded\n\n**Return Shipping**:  \n• Buyer pays return shipping unless item is defective/wrong  \n• Free return pickup in Lilongwe for defective items  \n• Cost: MWK 8,000-15,000 depending on location\n\n**Restocking Fee**:  \n• No fee if device is defective or we sent wrong item  \n• 10% restocking fee for change of mind (non-defective returns)  \n• Fee waived for Plus/Premium members\n\n**Non-Returnable Items**:  \n• Opened software/digital products  \n• Accessories used/removed from packaging  \n• Devices with physical/liquid damage not present at delivery  \n• Clearance/final sale items (marked clearly)\n\n**Exchanges**: We accept exchanges for different variants (storage, color, condition grade) subject to availability and price adjustments."
        },
        {
          question: "What warranty do you provide?",
          answer: "Comprehensive warranty coverage for peace of mind:\n\n**New Devices**:  \n• **Manufacturer Warranty**: Full original warranty (usually 12 months)  \n• **XtraPush Extended**: Additional 6 months (Premium members get 12 extra months)  \n• **Coverage**: All manufacturing defects, hardware failures, software issues\n\n**Refurbished Devices (Like New, Good, Fair)**:  \n• **Standard Warranty**: 6 months from delivery date  \n• **Premium Extended**: Additional 6 months (total 12 months for Premium members)  \n• **Coverage**: Hardware functionality, battery, screen, cameras, connectivity\n\n**What's Covered**:  \n✅ Battery degradation (below 80% health within warranty)  \n✅ Screen defects (dead pixels, touch issues)  \n✅ Camera malfunctions  \n✅ Charging problems  \n✅ Connectivity issues (Wi-Fi, Bluetooth, cellular)  \n✅ Audio problems (speakers, microphone)  \n✅ Button/sensor failures  \n✅ Software crashes/boot loops\n\n**What's NOT Covered**:  \n❌ Physical damage (drops, cracks)  \n❌ Liquid damage  \n❌ Unauthorized repairs/modifications  \n❌ Normal wear and tear  \n❌ Lost or stolen devices  \n❌ Software you installed  \n❌ Data loss\n\n**Claim Process**:  \n1. Contact support with order number and issue description  \n2. Provide photos/videos if requested  \n3. Receive RMA and shipping instructions  \n4. Send device for inspection (free shipping for warranty claims)  \n5. Repair, replacement, or refund within 10-15 business days\n\n**Warranty Extensions**: Purchase extended warranty separately for up to 24 additional months at checkout or within 30 days of delivery."
        },
        {
          question: "How do I report a defective or damaged device?",
          answer: "We take quality seriously and act quickly on defects:\n\n**Immediate Action (Within 48 Hours)**:  \n1. **Document**: Take clear photos/videos of the defect or damage  \n2. **Don't Use**: Stop using the device to prevent further damage  \n3. **Report**:  \n   • Email: conrad@itsxtrapush.com  \n   • Subject: 'Defective Device - Order #[YOUR ORDER NUMBER]'  \n   • Include: Photos, description, order details\n\n**What to Include in Report**:  \n• Order number  \n• Device model and IMEI  \n• Detailed description of issue  \n• When issue was discovered  \n• Photos/videos showing the problem  \n• Packaging condition photos (for shipping damage claims)\n\n**Our Response**:  \n• **Acknowledgment**: Within 1 hour (Premium) or 24 hours (standard)  \n• **Assessment**: Review photos and determine cause  \n• **Resolution Options**:  \n  a) **Immediate Replacement**: Ship new device (1-2 days Lilongwe, 2-3 days other cities)  \n  b) **Repair**: Collect device, repair, return (7-10 days)  \n  c) **Full Refund**: If irreparable or if you prefer\n\n**Shipping Damage**:  \nIf damage occurred during delivery:  \n• Refuse delivery or note damage on delivery receipt  \n• Take photos immediately  \n• Contact support within 24 hours  \n• We handle courier claim and send replacement immediately\n\n**Manufacturing Defects**:  \nIf issue is manufacturing defect:  \n• Full replacement or refund  \n• No return shipping costs  \n• Express processing (24-48 hours)\n\n**No Hassle Guarantee**: If device fails within 7 days of delivery, instant replacement or refund - no questions asked."
        }
      ]
    },
    {
      category: "Trade-In & Device Upgrades",
      questions: [
        {
          question: "How does the trade-in program work?",
          answer: "Turn your old devices into value toward new purchases - get cash, swap for a new device, or do both!\n\n**Step-by-Step Process**:\n\n**1. Get Instant Quote**:  \n• Visit our Trade-In page at Xtrapush Gadgets  \n• Select device category (Smartphone, Laptop, Tablet, Gaming, Accessories)  \n• Choose your brand and model  \n• Provide device specifications (storage, RAM, condition)  \n• Answer condition questions honestly:  \n  - Does it power on?  \n  - Screen condition (cracks, scratches)  \n  - Body condition  \n  - Battery health  \n  - Functional issues (camera, buttons, etc.)  \n• Receive instant quote in GBP and MWK\n\n**2. Choose Your Offer Type**:  \n• **💵 Cash Only**: Get paid directly via mobile money, bank transfer, or cash pickup  \n• **🔄 Swap Only**: Exchange your device for a new gadget of equal or greater value (balance due if applicable)  \n• **🔄💵 Both**: Use trade-in credit toward a new device AND receive cash for the remaining value\n\n**3. Upload Device Photos** (Optional but Recommended):  \n• Front, back, screen condition  \n• Any damage or defects  \n• Photos help us provide accurate valuation  \n• AI-powered condition assessment for precision pricing\n\n**4. Ship Your Device or Schedule Pickup**:  \n• Lilongwe: Free pickup available  \n• Other cities: Prepaid shipping label provided  \n• Package device securely  \n• Remove SIM card and personal data (we'll wipe it again for security)\n\n**5. Professional Inspection**:  \n• Device arrives at our facility  \n• 50-point inspection within 24 hours  \n• Verify condition matches your assessment  \n• Final quote confirmed or adjusted (if condition differs)\n\n**6. Accept & Get Value**:  \n• Receive final quote via email/SMS  \n• Accept within 48 hours  \n• Choose payout method:  \n  a) **Trade-In Credit**: Instant credit toward new purchase (+10% bonus)  \n  b) **Direct Payment**: Mobile money (Airtel/TNM) or bank transfer (3-5 days)  \n  c) **Cash Pickup**: Lilongwe office only  \n  d) **Swap**: Exchange for new device (pay balance if needed)\n\n**Accepted Devices**:  \n✅ Smartphones (iPhone, Samsung, Huawei, Tecno, Infinix, etc.)  \n✅ Tablets (iPad, Samsung Tab, etc.)  \n✅ Laptops (MacBook, Dell, HP, Lenovo, Acer, etc.)  \n✅ Smartwatches (Apple Watch, Galaxy Watch)  \n✅ Gaming consoles (PlayStation, Xbox, Nintendo Switch)  \n✅ Accessories (AirPods, controllers, etc.)\n\n**Trade-In Values** (examples):  \n• iPhone 13: MWK 350,000 - 550,000  \n• Samsung S22: MWK 250,000 - 450,000  \n• MacBook Air M1: MWK 700,000 - 1,100,000  \n• PS5: MWK 350,000 - 450,000  \n*Actual values depend on condition, specifications, and market demand\n\n**Bonus Promotions**:  \n• +10% value when using credit toward purchase  \n• +5% for Plus/Premium members  \n• Seasonal promotions offer up to 20% extra value\n\n**Requirements**:  \n• Must be genuine device (no knockoffs)  \n• Find My iPhone/Android lock must be disabled  \n• Functional devices preferred but damaged devices accepted  \n• Minimum value: MWK 20,000 (£10)\n\n**Why Trade with Xtrapush Gadgets?**  \n• Competitive market-based pricing  \n• Flexible payout options (cash, swap, or both)  \n• Fast inspection and payment (24-48 hours)  \n• Free pickup in Lilongwe  \n• Secure data wiping  \n• Eco-friendly device recycling"
        },
        {
          question: "Can I trade in a damaged or non-functional device?",
          answer: "Yes! We accept devices in various conditions:\n\n**Functional with Cosmetic Damage**:  \n**Accepted**: Cracked back glass, scratches, dents, scuffs  \n**Value Impact**: 20-40% reduction depending on severity  \n**Example**: iPhone 12 Pro (Good: MWK 450,000) → (Cracked back: MWK 300,000)\n\n**Screen Damage**:  \n**Accepted**: Cracked/shattered screens if device still powers on and touch works  \n**Value Impact**: 40-60% reduction  \n**Example**: Samsung S22 (Good: MWK 380,000) → (Cracked screen: MWK 180,000)\n\n**Non-Functional Devices**:  \n**Accepted**: Won't power on, water damaged, completely dead  \n**Value**: Parts/recycling value only (typically 10-20% of working value)  \n**Example**: iPhone 11 (Working: MWK 350,000) → (Water damaged: MWK 50,000)\n\n**Locked/iCloud/Google Locked**:  \n**Not Accepted**: We cannot accept devices with activation locks unless you can remove them  \n**Solution**: Disable Find My iPhone or remove Google account before shipping\n\n**What We Can Repair & Refurbish**:  \n• Cracked screens  \n• Battery issues  \n• Charging port problems  \n• Camera issues  \n• Software problems\n\n**Assessment Process**:  \n1. Be honest in online assessment  \n2. If actual condition differs, we'll send revised quote  \n3. Accept new quote or request return (return shipping: MWK 5,000)\n\n**Best Value Tips**:  \n• Factory reset device  \n• Clean exterior  \n• Include original box and accessories (+5-10% value)  \n• Time it with promotional periods  \n• Use trade-in credit instead of cash (+10% bonus)"
        }
      ]
    },
    {
      category: "Account & Technical Support",
      questions: [
        {
          question: "How do I create an account or sign in?",
          answer: "Multiple convenient ways to access your account:\n\n**New Account Creation**:\n\n**Option 1 - Email/Password Sign Up**:  \n1. Click 'Sign Up' in top navigation  \n2. Enter email address and create password (min 8 characters, 1 uppercase, 1 number)  \n3. Complete onboarding:  \n   • Full name  \n   • Phone number (+265 for Malawi)  \n   • Delivery address  \n   • Town/city  \n   • Postcode  \n4. Verify email via confirmation link  \n5. Start shopping!\n\n**Option 2 - Google Sign In** (Recommended):  \n1. Click 'Sign in with Google'  \n2. Select your Google account  \n3. Grant permissions  \n4. Complete brief onboarding (phone, address)  \n5. Account ready instantly!\n\n**Benefits of Account**:  \n✅ Order tracking and history  \n✅ Faster checkout (saved addresses)  \n✅ Wishlist and saved items  \n✅ Subscription management  \n✅ Trade-in quotes and history  \n✅ Swap transaction tracking  \n✅ Insurance claims  \n✅ Support ticket tracking  \n✅ Exclusive member deals\n\n**Existing Users (Google Login)**:  \nIf you previously signed up with email/password, you can link your Google account:  \n1. Sign in with email/password  \n2. Go to Settings > Account  \n3. Click 'Link Google Account'  \n4. Use either method to sign in thereafter\n\n**Forgot Password**:  \n1. Click 'Forgot Password' on sign in page  \n2. Enter your email  \n3. Receive 6-digit OTP code via email  \n4. Enter code  \n5. Create new password  \n6. Sign in with new credentials\n\n**Security**: We use industry-standard encryption. Your password is hashed with bcrypt. We never share your data with third parties."
        },
        {
          question: "How can I contact customer support?",
          answer: "Multiple channels for quick assistance:\n\n**Email Support** (All Customers):  \n📧 **conrad@itsxtrapush.com**  \n• Response time: 24 hours (standard), 1 hour (Premium members)  \n• Best for: Order inquiries, returns, technical issues, general questions  \n• Include: Order number (if applicable), photos (if relevant), detailed description\n\n**WhatsApp Support** (Premium Members):  \n📱 **+265 XXX XXX XXX** *(number available in Premium dashboard)*  \n• Response time: 1-2 hours during business hours  \n• Best for: Urgent matters, delivery coordination, quick questions  \n• Business hours: Mon-Fri 8 AM - 6 PM, Sat 9 AM - 3 PM (CAT)\n\n**Phone Support** (Premium Members):  \n📞 **+265 XXX XXX XXX**  \n• Available: Mon-Fri 9 AM - 5 PM (CAT)  \n• Best for: Complex issues, immediate assistance\n\n**Live Chat** (Coming Soon):  \nReal-time chat support on website during business hours\n\n**Help Center Dashboard**:  \n1. Log into your account  \n2. Navigate to Help > Support Tickets  \n3. Create new ticket with category:  \n   • Order Issues  \n   • Payment Problems  \n   • Technical Support  \n   • Returns/Warranty  \n   • Subscription Help  \n   • Trade-In Inquiries  \n4. Track responses in real-time\n\n**Social Media**:  \n• Facebook: @XtrapushGadgets  \n• Instagram: @xtrapushgadgets  \n• Twitter: @xtrapushgadgets  \n*Social DMs monitored during business hours*\n\n**Office Visit** (Lilongwe Only):  \n📍 **Address**: Area 47, Capital City  \n🕒 **Hours**: Mon-Fri 8 AM - 5 PM, Sat 9 AM - 2 PM  \n**Services**: Device inspection, trade-in drop-off, payment assistance, pickup/returns\n\n**Response Priority**:  \n🔴 **Urgent** (1 hour): Payment failures, order cancellations, damaged deliveries  \n🟡 **High** (4 hours): Shipping delays, technical issues, warranty claims  \n🟢 **Normal** (24 hours): General inquiries, account questions\n\n**Tips for Faster Support**:  \n• Include order number in all communications  \n• Attach photos for physical issues  \n• Be specific about the problem  \n• Check your spam folder for our replies"
        },
        {
          question: "What should I do if I forgot my password?",
          answer: "Easy password reset process with our secure OTP system:\n\n**Reset Steps**:\n\n**1. Access Reset Form**:  \n• Go to Sign In page  \n• Click 'Forgot your password?' link  \n• Password reset modal opens\n\n**2. Request Reset Code**:  \n• Enter your registered email address  \n• Click 'Send Code'  \n• Check your email inbox for 6-digit OTP code  \n• Code valid for 10 minutes\n\n**3. Verify Code**:  \n• Enter the 6-digit code from email  \n• Click 'Verify Code'  \n• System validates your identity\n\n**4. Create New Password**:  \n• Enter new password (requirements: min 8 characters, 1 uppercase, 1 number, 1 special character)  \n• Confirm password  \n• Click 'Reset Password'  \n• Success! Sign in with new password\n\n**Troubleshooting**:\n\n**No Email Received?**  \n• Check spam/junk folder  \n• Wait 2-3 minutes (delivery can be delayed)  \n• Verify email address is correct  \n• Click 'Resend Code' (available after 30 seconds)\n\n**Code Expired?**  \n• Codes expire after 10 minutes  \n• Request a new code  \n• Complete process within time limit\n\n**Still Can't Reset?**  \n• Email conrad@itsxtrapush.com with:  \n  - Registered email  \n  - Account name  \n  - Phone number on account  \n• We'll manually verify and assist\n\n**Security Notes**:  \n• Codes are one-time use only  \n• Each request generates new code (previous invalid)  \n• Rate limited to prevent abuse (1 request per 30 seconds)  \n• Tokens are hashed with SHA-256 in database\n\n**Google Sign In Users**:  \nIf you signed up with Google, you don't have a password. Simply use 'Sign in with Google' button to access your account."
        }
      ]
    }
  ];

  return (
    <>
      <SEOMeta
        title="Help & FAQs - Xtrapush Gadgets Customer Support"
        description="Find answers to common questions about ordering, payments, shipping, returns, trade-ins (cash/swap/both), and more. Get help from Xtrapush Gadgets support team."
        keywords="help, FAQ, customer support, contact, shipping, returns, payment help, trade-in, device swap"
        canonical={getCanonicalUrl(location.pathname)}
        ogTitle="Help & FAQs"
        ogDescription="Xtrapush Gadgets Customer Support & FAQs"
        ogUrl={getCanonicalUrl(location.pathname)}
      />
      <div className="deep bg-primary w-full overflow-hidden">
      <div className={`${styles.paddingX} ${styles.flexCenter}`}>
        <div className={`${styles.boxWidth}`}>
          
          
          <section className="flex flex-col items-center text-center p-12">
            <Typography 
              variant="h3" 
              component="h1" 
              sx={{ 
                color: 'white', 
                textAlign: 'center', 
                mb: 4,
                fontWeight: 'bold',
                fontSize: { xs: '2.5rem', md: '3.5rem' }
              }}
            >
              🆘 Help & Support
            </Typography>
            
            <Typography 
              variant="h6" 
              sx={{ 
                color: 'rgba(255, 255, 255, 0.7)', 
                textAlign: 'center', 
                mb: 6,
                maxWidth: '600px'
              }}
            >
              Find answers to common questions and get the support you need
            </Typography>

            {/* Quick Help Cards */}
            <Grid container spacing={3} sx={{ mb: 6, maxWidth: '1200px', width: '100%' }}>
              <Grid item xs={12} sm={6} md={4}>
                <Card 
                  sx={{ 
                    bgcolor: 'rgba(5, 19, 35, 0.8)',
                    border: '1px solid rgba(72, 206, 219, 0.2)',
                    borderRadius: 3,
                    height: '100%',
                    transition: 'transform 0.3s, border-color 0.3s',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      borderColor: 'rgba(72, 206, 219, 0.5)'
                    },
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    p: 2,
                    textAlign: 'center'
                  }}
                  onClick={() => window.location.href = '#faq'}
                >
                  <CardContent sx={{ textAlign: 'center', py: 3, '&:last-child': { pb: 3 } }}>
                    <HelpOutlineIcon sx={{ fontSize: 48, color: '#48CEDB', mb: 2 }} />
                    <Typography 
                      variant="h6" 
                      sx={{ 
                        color: 'white', 
                        fontWeight: 600, 
                        mb: 1,
                        fontFamily: 'Poppins, sans-serif',
                        fontSize: '1rem'
                      }}
                    >
                      FAQ
                    </Typography>
                    <Typography 
                      variant="body2" 
                      sx={{ 
                        color: 'rgba(255, 255, 255, 0.7)',
                        fontFamily: 'Poppins, sans-serif',
                        fontSize: '0.85rem'
                      }}
                    >
                      Browse frequently asked questions
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              
              <Grid item xs={12} sm={6} md={4}>
                <Card 
                  sx={{ 
                    bgcolor: 'rgba(5, 19, 35, 0.8)',
                    border: '1px solid rgba(72, 206, 219, 0.2)',
                    borderRadius: 3,
                    height: '100%',
                    transition: 'transform 0.3s, border-color 0.3s',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      borderColor: 'rgba(72, 206, 219, 0.5)'
                    },
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    p: 2,
                    textAlign: 'center'
                  }}
                  onClick={() => window.location.href = '/contact'}
                >
                  <CardContent sx={{ textAlign: 'center', py: 3, '&:last-child': { pb: 3 } }}>
                    <ContactSupportIcon sx={{ fontSize: 48, color: '#48CEDB', mb: 2 }} />
                    <Typography 
                      variant="h6" 
                      sx={{ 
                        color: 'white', 
                        fontWeight: 600, 
                        mb: 1,
                        fontFamily: 'Poppins, sans-serif',
                        fontSize: '1rem'
                      }}
                    >
                      Contact Us
                    </Typography>
                    <Typography 
                      variant="body2" 
                      sx={{ 
                        color: 'rgba(255, 255, 255, 0.7)',
                        fontFamily: 'Poppins, sans-serif',
                        fontSize: '0.85rem'
                      }}
                    >
                      Get in touch with our support team
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              
              <Grid item xs={12} sm={12} md={4}>
                <Card 
                  sx={{ 
                    bgcolor: 'rgba(5, 19, 35, 0.8)',
                    border: '1px solid rgba(72, 206, 219, 0.2)',
                    borderRadius: 3,
                    height: '100%',
                    transition: 'transform 0.3s, border-color 0.3s',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      borderColor: 'rgba(72, 206, 219, 0.5)'
                    },
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    p: 2,
                    textAlign: 'center'
                  }}
                  onClick={() => window.location.href = '/warranty'}
                >
                  <CardContent sx={{ textAlign: 'center', py: 3, '&:last-child': { pb: 3 } }}>
                    <InfoIcon sx={{ fontSize: 48, color: '#48CEDB', mb: 2 }} />
                    <Typography 
                      variant="h6" 
                      sx={{ 
                        color: 'white', 
                        fontWeight: 600, 
                        mb: 1,
                        fontFamily: 'Poppins, sans-serif',
                        fontSize: '1rem'
                      }}
                    >
                      Policies
                    </Typography>
                    <Typography 
                      variant="body2" 
                      sx={{ 
                        color: 'rgba(255, 255, 255, 0.7)',
                        fontFamily: 'Poppins, sans-serif',
                        fontSize: '0.85rem'
                      }}
                    >
                      Learn about our warranty and return policies
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>

            {/* FAQ Section */}
            <Box sx={{ width: '100%', maxWidth: '900px' }} id="faq">
              <Typography 
                variant="h4" 
                sx={{ 
                  color: 'white', 
                  textAlign: 'center', 
                  mb: 2,
                  fontWeight: 'bold'
                }}
              >
                Frequently Asked Questions
              </Typography>
              <Typography 
                variant="body1" 
                sx={{ 
                  color: 'rgba(255, 255, 255, 0.8)', 
                  textAlign: 'center', 
                  mb: 5,
                  maxWidth: '700px',
                  mx: 'auto'
                }}
              >
                Browse through our comprehensive help sections below. All answers are detailed and professionally written to help you get the most out of Xtrapush Gadgets.
              </Typography>
              
              {faqData.map((category, catIndex) => (
                <Box key={catIndex} sx={{ mb: 5 }}>
                  {/* Category Header */}
                  <Typography 
                    variant="h5" 
                    sx={{ 
                      color: '#48CEDB', 
                      fontWeight: 700,
                      mb: 3,
                      pb: 1,
                      borderBottom: '2px solid rgba(72, 206, 219, 0.3)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1
                    }}
                  >
                    <Box 
                      component="span" 
                      sx={{ 
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: 32,
                        height: 32,
                        borderRadius: '50%',
                        bgcolor: 'rgba(72, 206, 219, 0.2)',
                        color: '#48CEDB',
                        fontSize: '0.9rem',
                        fontWeight: 'bold'
                      }}
                    >
                      {catIndex + 1}
                    </Box>
                    {category.category}
                  </Typography>
                  
                  {/* Questions in Category */}
                  {category.questions.map((faq, qIndex) => (
                    <Accordion 
                      key={qIndex}
                      sx={{ 
                        bgcolor: 'rgba(255, 255, 255, 0.08)', 
                        backdropFilter: 'blur(10px)',
                        mb: 2,
                        borderRadius: '12px !important',
                        border: '1px solid rgba(72, 206, 219, 0.1)',
                        '&:before': { display: 'none' },
                        '&:hover': {
                          bgcolor: 'rgba(255, 255, 255, 0.12)',
                          borderColor: 'rgba(72, 206, 219, 0.3)'
                        },
                        '&.Mui-expanded': {
                          bgcolor: 'rgba(72, 206, 219, 0.1)',
                          borderColor: 'rgba(72, 206, 219, 0.4)'
                        }
                      }}
                    >
                      <AccordionSummary
                        expandIcon={<ExpandMoreIcon sx={{ color: '#48CEDB', fontSize: 28 }} />}
                        sx={{ 
                          '& .MuiAccordionSummary-content': { 
                            margin: '16px 0',
                            pr: 2
                          },
                          minHeight: '64px'
                        }}
                      >
                        <Typography 
                          variant="h6" 
                          sx={{ 
                            color: 'white', 
                            fontWeight: 600,
                            fontSize: { xs: '1rem', md: '1.15rem' },
                            lineHeight: 1.4
                          }}
                        >
                          {faq.question}
                        </Typography>
                      </AccordionSummary>
                      <AccordionDetails sx={{ pt: 0, pb: 3, px: 3 }}>
                        <Typography 
                          sx={{ 
                            color: 'rgba(255, 255, 255, 0.9)',
                            lineHeight: 1.8,
                            fontSize: '0.95rem',
                            whiteSpace: 'pre-line',
                            '& strong': {
                              color: '#48CEDB',
                              fontWeight: 700
                            }
                          }}
                        >
                          {faq.answer}
                        </Typography>
                      </AccordionDetails>
                    </Accordion>
                  ))}
                </Box>
              ))}
            </Box>

            {/* Contact Information */}
            <Box sx={{ mt: 6, p: 4, bgcolor: 'rgba(255, 255, 255, 0.1)', borderRadius: 2, backdropFilter: 'blur(10px)' }}>
              <Typography variant="h5" sx={{ color: 'white', mb: 2, textAlign: 'center' }}>
                Still Need Help?
              </Typography>
              <Typography sx={{ color: 'rgba(255, 255, 255, 0.8)', textAlign: 'center', mb: 2 }}>
                Our support team is here to help you with any questions or concerns.
              </Typography>
              <Typography sx={{ color: '#48CEDB', textAlign: 'center' }}>
                Email: conrad@itsxtrapush.com
              </Typography>
            </Box>
          </section>
          
          
        </div>
      </div>
    </div>
    </>
  );
};

export default Help;