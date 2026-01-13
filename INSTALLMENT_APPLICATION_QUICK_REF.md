# INSTALLMENT APPLICATION - QUICK REFERENCE

## 🚀 Quick Start

### 1. Upload Database Migration
```bash
# Go to: https://sparkle-pro.co.uk/phpmyadmin
# Database: itsxtrapush_db
# Tab: SQL
# File: sparkle-pro-api/migrations/2026-01-07_installment_applications.sql
# Execute: Click "Go"
```

### 2. Test the Flow
```bash
# Start dev server
npm start

# Navigate to any gadget
# Click "Pay with Installments"
# Fill out application form
# Upload documents
# Submit
```

### 3. Check Admin Notifications
```bash
# API endpoint:
GET /admin/installments/notifications

# Check email inbox:
admin@itsxtrapush.com
```

## 📋 Key Files

| File | Purpose | Lines |
|------|---------|-------|
| `src/components/InstallmentApplicationForm.jsx` | Main application form | 1182 |
| `sparkle-pro-api/index.php` | Backend API endpoints | +1500 |
| `sparkle-pro-api/migrations/2026-01-07_installment_applications.sql` | Database schema | 450 |
| `src/services/api.js` | Frontend API integration | +100 |

## 🎯 User Flow

```mermaid
User → Select Gadget → Click "Installments" → Fill Form (4 steps) → Upload Docs → Submit → Get Reference → Track in Dashboard
```

## 🔐 Admin Flow

```mermaid
Admin → Receive Notification → Review Application → Approve/Deny/Request Docs → User Notified → Track History
```

## 📊 Application Statuses

| Status | Description | User Actions | Admin Actions |
|--------|-------------|--------------|---------------|
| `pending` | Just submitted | View, Cancel | Review, Approve, Deny |
| `under_review` | Being reviewed | View, Cancel | Approve, Deny, Request Docs |
| `documents_requested` | More docs needed | Upload, Cancel | Approve, Deny |
| `approved` | ✅ Approved | Pay Deposit | View History |
| `denied` | ❌ Not approved | View Reason | View History |
| `cancelled` | User cancelled | View | View History |

## 🔗 API Endpoints

### User Endpoints
```javascript
// Submit application
POST /api/installments/apply
Content-Type: multipart/form-data
Body: { applicationData, documents }

// Get my applications
GET /api/installments/applications?uid={userUid}

// Get application details
GET /api/installments/applications/{id}

// Cancel application
POST /api/installments/applications/{id}/cancel
```

### Admin Endpoints
```javascript
// List applications
GET /admin/installments/applications?status=pending

// Approve
POST /admin/installments/applications/{id}/approve
Body: { adminNotes: "Approved", adminEmail: "admin@example.com" }

// Deny
POST /admin/installments/applications/{id}/deny
Body: { reason: "Insufficient income", adminEmail: "admin@example.com" }

// Request documents
POST /admin/installments/applications/{id}/request-docs
Body: { documentsNeeded: ["Updated ID", "Bank statement"] }

// Get notifications
GET /admin/installments/notifications

// Mark notification read
PUT /admin/installments/notifications/{id}/read
```

## 📧 Email Templates

### User: Application Received
```
Subject: Installment Application Received - APP-XXXXXXXX-20260107

Hi {name},
Your application has been received.
Reference: APP-XXXXXXXX-20260107
Product: iPhone 16 Pro Max
Status: Under Review
Expected time: 24-48 hours
```

### User: Application Approved 🎉
```
Subject: Application Approved! - APP-XXXXXXXX-20260107

Congratulations! Your application has been approved.
Deposit: MWK 150,000
Weekly: MWK 37,500
Duration: 4 weeks

Next: Pay deposit in your dashboard
```

### Admin: New Application
```
Subject: New Installment Application - APP-XXXXXXXX-20260107

New application from John Doe
Product: iPhone 16 Pro Max
Plan: 4 weeks, MWK 300,000
Employment: Full-time, MWK 250,000-500,000/mo
Documents: 5 uploaded

Review: https://itsxtrapush.com/admin/applications/42
```

## 🗄️ Database Schema Quick View

```sql
-- Main table
installment_applications (
  id, reference, user_uid, 
  gadget_id, gadget_name, variant_*,
  plan_type, plan_weeks, deposit_amount, weekly_amount, total_amount,
  full_name, email, phone, date_of_birth, national_id,
  address, town, postcode, country,
  employment_status, employer_name, monthly_income,
  status, admin_notes, denial_reason,
  created_at, updated_at
)

-- Documents
application_documents (
  id, application_id, document_type,
  original_filename, stored_filename, file_path,
  verified, uploaded_at
)

-- History
application_status_history (
  id, application_id, previous_status, new_status,
  changed_by, notes, created_at
)

-- Notifications
application_admin_notifications (...)
application_user_notifications (...)
```

## 📁 File Upload Structure

```
/sparkle-pro-api/uploads/applications/
├── 42/
│   ├── nationalIdFront_1736271234_id.jpg
│   ├── nationalIdBack_1736271235_id.jpg
│   ├── proofOfAddress_1736271236_bill.pdf
│   ├── proofOfIncome_1736271237_slip.pdf
│   └── selfie_1736271238_selfie.jpg
├── 43/
│   └── ...
```

## 🧪 Testing Commands

### Test Application Submission
```javascript
// Using api.js
import { installmentsAPI } from './services/api';

const formData = new FormData();
formData.append('applicationData', JSON.stringify({
  userUid: 'user123',
  gadgetId: 1,
  gadgetName: 'iPhone 16',
  personalInfo: { fullName: 'John Doe', email: 'john@example.com', phone: '+265999123456' },
  employmentInfo: { employmentStatus: 'Full-time', monthlyIncome: 'MWK 250,000-500,000' },
  installmentPlan: { type: 'pay-to-own', weeks: 4, depositAmount: 150000, weeklyAmount: 37500, totalAmount: 300000 }
}));
formData.append('nationalIdFront', file1);
formData.append('nationalIdBack', file2);
// ... more documents

const result = await installmentsAPI.submitApplication(formData);
console.log(result.reference); // APP-XXXXXXXX-20260107
```

### Test Admin Approval
```javascript
const result = await installmentsAPI.approveApplication(42, 'Application looks good');
console.log(result.message); // "Application approved successfully"
```

## 🎨 UI Components

### InstallmentApplicationForm Props
```javascript
<InstallmentApplicationForm
  gadget={{ id, name, category, image }}
  variant={{ id, storage, color, condition }}
  installmentPlan={{ type, weeks, depositAmount, weeklyAmount, totalAmount }}
  user={userProfile}
  formatPrice={(amount) => `MWK ${amount.toLocaleString()}`}
  onSubmit={(response) => console.log('Submitted:', response.reference)}
  onCancel={() => console.log('Cancelled')}
/>
```

### Form Steps
1. **Personal Info** - Name, email, phone, DOB, ID, address
2. **Employment** - Status, employer, income, duration
3. **Documents** - 5 document uploads with progress
4. **Review** - Complete summary with all data

## 🔧 Configuration

### PHP Constants (index.php)
```php
define('ADMIN_EMAIL', 'admin@itsxtrapush.com');
define('MAIL_FROM', 'no-reply@support.itsxtrapush.com');
define('MAIL_FROM_NAME', 'Xtrapush Support');
```

### Upload Settings
```php
// Max file size: 5MB
$maxFileSize = 5 * 1024 * 1024;

// Allowed types
$allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
```

## 🐛 Common Issues & Fixes

### Issue: Files not uploading
```bash
# Check PHP upload settings
upload_max_filesize = 10M
post_max_size = 10M

# Check directory permissions
chmod 755 /sparkle-pro-api/uploads
chmod 755 /sparkle-pro-api/uploads/applications
```

### Issue: Email not sending
```bash
# Check PHPMailer configuration
# Verify SMTP settings in config/mail.php
# Check email logs: tail -f /var/log/mail.log
```

### Issue: Database connection failed
```bash
# Check database credentials in config/database.php
# Verify database exists: itsxtrapush_db
# Run migration SQL again
```

## 📈 Monitoring

### Check Application Statistics
```sql
-- Total applications
SELECT COUNT(*) FROM installment_applications;

-- By status
SELECT status, COUNT(*) FROM installment_applications GROUP BY status;

-- Pending applications
SELECT * FROM v_pending_applications;

-- Approval rate
SELECT 
  (SELECT COUNT(*) FROM installment_applications WHERE status='approved') / 
  COUNT(*) * 100 as approval_rate
FROM installment_applications WHERE status IN ('approved', 'denied');
```

### Check Notifications
```sql
-- Unread admin notifications
SELECT COUNT(*) FROM application_admin_notifications WHERE is_read = FALSE;

-- Recent notifications
SELECT * FROM application_admin_notifications ORDER BY created_at DESC LIMIT 10;
```

## 🚦 Status Codes

| Code | Status | Meaning |
|------|--------|---------|
| 200 | OK | Success |
| 201 | Created | Application created |
| 400 | Bad Request | Validation error |
| 401 | Unauthorized | Not authenticated |
| 403 | Forbidden | Not authorized |
| 404 | Not Found | Application not found |
| 422 | Unprocessable | Invalid data |
| 500 | Server Error | Database/server error |
| 503 | Unavailable | Database unavailable |

## 🔐 Security Checklist

- [x] SQL injection prevention (prepared statements)
- [x] XSS protection (htmlspecialchars)
- [x] File type validation
- [x] File size limits
- [x] User authentication required
- [x] Ownership verification
- [x] Admin-only endpoints
- [x] Unique references
- [x] Status validation
- [x] CSRF protection (if needed)

## 📞 Support

### For Issues:
1. Check browser console for errors
2. Check PHP error logs: `tail -f /var/log/php-errors.log`
3. Check database connection
4. Verify migration ran successfully
5. Check file permissions

### Contact:
- Technical Support: dev@itsxtrapush.com
- Admin Support: admin@itsxtrapush.com

---

**Last Updated:** 2026-01-07
**Version:** 1.0.0
**Status:** ✅ Production Ready
