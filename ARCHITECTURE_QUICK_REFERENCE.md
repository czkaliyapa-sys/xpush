# 🏗️ XtraPush Application Architecture - Quick Reference

## 🎯 High-Level Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                    USER (Browser/Mobile App)                    │
└─────────────────────────────────────────────────────────────────┘
                                │
                    ┌─────────────────────┐
                    │   REACT FRONTEND    │
                    │   (Port 3000-3002)  │
                    └─────────────────────┘
                                │
                    ┌─────────────────────┐
                    │   API SERVICE LAYER │
                    │   (REST Clients)    │
                    └─────────────────────┘
                                │
                    ┌─────────────────────┐
                    │   BACKEND ROUTER    │
                    │   (PHP index.php)   │
                    └─────────────────────┘
                                │
         ┌──────────────────────┼──────────────────────┐
         │                      │                      │
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│   DATABASE      │  │   PAYMENT       │  │   EMAIL/SMS     │
│   (MySQL)       │  │   GATEWAYS      │  │   SERVICES      │
└─────────────────┘  └─────────────────┘  └─────────────────┘
```

## 🔁 Key Data Flows

### 1. **User Browsing Products**
```
User → React Components → API Service → Backend → MySQL → Return Products
```

### 2. **Adding to Cart**
```
User Click → Context State → Local Storage → Cart Modal Display
```

### 3. **Checkout Process**
```
Cart Modal → API Call → Backend Session → Payment Gateway → Webhook → Database Update
```

### 4. **Payment Verification**
```
Payment Gateway → Webhook → Backend → Database Update → Email Notification
```

## 🏗️ Core Components

### Frontend (React)
- **Main Pages**: HomePage, GadgetsPage, GadgetDetail, UserDashboard
- **Modals**: CartModal, CheckoutForm, Installment Modals
- **Context**: AuthContext, LocationContext, PaymentContext
- **Services**: API clients, payment utilities

### Backend (PHP)
- **Router**: `index.php` - Handles all API endpoints
- **Controllers**: Payment processing, user management, order handling
- **Models**: Database interaction classes
- **Middleware**: Authentication, validation, security

### External Services
- **Payment**: Square (GBP), PayChangu (MWK)
- **Authentication**: Firebase Auth
- **Communication**: Twilio (SMS), AWS SES (Email)
- **Analytics**: Google Analytics

## 🌐 Network Flow

```
CLIENT
   ↓ (HTTPS Request)
LOAD BALANCER
   ↓ (Distribute Traffic)
WEB SERVER (Apache/Nginx)
   ↓ (Process PHP)
APPLICATION (index.php)
   ↓ (Database Query)
DATABASE (MySQL)
   ↓ (Return Data)
APPLICATION
   ↓ (Format Response)
WEB SERVER
   ↓ (HTTPS Response)
CLIENT
```

## 🔐 Security Layers

1. **Network Level**: Cloudflare CDN, Firewall, SSL/TLS
2. **Application Level**: Input validation, SQL injection prevention
3. **Authentication**: JWT tokens, session management
4. **Authorization**: Role-based access control
5. **Data Level**: Database encryption, backup procedures

## 📊 Scalability Points

- **Horizontal**: Multiple web servers behind load balancer
- **Vertical**: Database read replicas for scaling reads
- **Caching**: Redis/Memcached for session and query caching
- **CDN**: Cloudflare for static asset distribution

## 🚀 Deployment Architecture

```
Development: localhost:3000 → Local PHP Server
Staging: staging.itsxtrapush.com → Test Server
Production: itsxtrapush.com → Live Servers
```

## 📱 Mobile Responsiveness

- **Responsive Design**: Material-UI breakpoints
- **Touch Optimization**: Mobile-first components
- **Performance**: Lazy loading, code splitting
- **Offline Support**: Service workers (planned)

## 🔧 Monitoring & Logging

- **Frontend**: Console logging, error boundaries
- **Backend**: Error logs, access logs
- **Performance**: Page load times, API response times
- **Analytics**: User behavior, conversion tracking

---

**Quick Facts:**
- 📍 **Frontend**: React + Material-UI on ports 3000-3002
- ⚙️ **Backend**: PHP 8.1+ with Apache/Nginx
- 💾 **Database**: MySQL 8.0 with master-slave replication
- 💰 **Payments**: Square (International) + PayChangu (Malawi)
- 🔒 **Security**: Multi-layer protection with JWT authentication
- 🌐 **Hosting**: Cloud-based infrastructure with CDN
- 📈 **Scalability**: Horizontally scalable with load balancing