# INSTALLMENT APPLICATION - DEPLOYMENT CHECKLIST

## 📋 Pre-Deployment Checks

### 1. Database Setup
- [ ] **Upload Migration File**
  - File: `sparkle-pro-api/migrations/2026-01-07_installment_applications.sql`
  - Location: phpMyAdmin → itsxtrapush_db → SQL tab
  - Action: Copy entire file contents and execute
  - Verify: All 5 tables created successfully
  
- [ ] **Verify Tables Created**
  ```sql
  SHOW TABLES LIKE 'installment_applications';
  SHOW TABLES LIKE 'application_documents';
  SHOW TABLES LIKE 'application_status_history';
  SHOW TABLES LIKE 'application_admin_notifications';
  SHOW TABLES LIKE 'application_user_notifications';
  ```

- [ ] **Check Views and Stored Procedures**
  ```sql
  SELECT * FROM v_pending_applications LIMIT 1;
  SHOW PROCEDURE STATUS WHERE Db = 'itsxtrapush_db';
  ```

### 2. File Permissions
- [ ] **Create Upload Directory**
  ```bash
  cd /path/to/sparkle-pro-api
  mkdir -p uploads/applications
  chmod 755 uploads
  chmod 755 uploads/applications
  ```

- [ ] **Verify Write Permissions**
  ```bash
  ls -la uploads/
  # Should show: drwxr-xr-x
  ```

### 3. Backend Files
- [ ] **Upload index.php**
  - Contains all new installment endpoints
  - Verify file size increased (~1500 lines added)
  - Check no syntax errors

- [ ] **Verify Endpoint Registration**
  ```bash
  curl -X GET https://sparkle-pro.co.uk/api/installments/applications?uid=test
  # Should return: {"success":true,"applications":[]}
  ```

### 4. Frontend Files
- [ ] **Upload InstallmentApplicationForm.jsx**
  - Location: `src/components/`
  - File size: ~1182 lines
  - No import errors

- [ ] **Update InstallmentModal.jsx**
  - Import added
  - State added
  - Render logic updated

- [ ] **Update api.js**
  - New methods in installmentsAPI
  - Import axios for multipart

### 5. Build & Deploy Frontend
- [ ] **Run Build**
  ```bash
  npm run build
  ```

- [ ] **Upload Build Files**
  - Upload entire `build/` directory
  - Verify `static/js/` contains new bundles
  - Check `index.html` updated

### 6. Configuration
- [ ] **Check PHP Constants**
  ```php
  // In index.php or config file
  define('ADMIN_EMAIL', 'admin@itsxtrapush.com');
  define('MAIL_FROM', 'no-reply@support.itsxtrapush.com');
  define('MAIL_FROM_NAME', 'Xtrapush Support');
  ```

- [ ] **PHP Upload Settings**
  ```ini
  ; In php.ini
  upload_max_filesize = 10M
  post_max_size = 10M
  max_file_uploads = 20
  ```

- [ ] **Email Configuration**
  - PHPMailer configured
  - SMTP settings correct
  - Test email sending

## 🧪 Post-Deployment Testing

### 1. User Flow Tests

#### Test Case 1: Submit Application
- [ ] Navigate to a gadget page
- [ ] Click "Pay with Installments"
- [ ] Fill Step 1: Personal Info
  - Full name, email, phone
  - Date of birth, national ID
  - Address details
  - All fields validate correctly
- [ ] Fill Step 2: Employment
  - Employment status dropdown works
  - Income range selection works
  - Conditional fields show/hide correctly
- [ ] Fill Step 3: Documents
  - Upload National ID front ✓
  - Upload National ID back ✓
  - Upload Proof of Address ✓
  - Upload Proof of Income ✓
  - Upload Selfie with ID ✓
  - Progress bars show
  - File names display
  - Delete button works
- [ ] Step 4: Review
  - All data displays correctly
  - Product info correct
  - Plan details correct
  - Personal info correct
  - Employment info correct
  - All 5 documents listed
- [ ] Submit
  - Loading indicator shows
  - Success screen appears
  - Reference number generated (APP-XXXXXXXX-20260107)
  - Email sent confirmation

#### Test Case 2: View Applications
- [ ] Go to Dashboard
- [ ] Navigate to "My Applications" (or relevant section)
- [ ] Application appears in list
- [ ] Status shows "pending"
- [ ] Click application to view details
- [ ] All information displays correctly
- [ ] Document count shows 5

#### Test Case 3: Cancel Application
- [ ] In application details
- [ ] Click "Cancel Application"
- [ ] Confirmation dialog appears
- [ ] Confirm cancellation
- [ ] Status updates to "cancelled"
- [ ] Cannot cancel again

### 2. Admin Flow Tests

#### Test Case 4: View Applications (Admin)
- [ ] Access admin panel
- [ ] Navigate to applications section
- [ ] Use URL: `/admin/installments/applications`
- [ ] All applications list appears
- [ ] Filter by status works
  - [ ] All
  - [ ] Pending
  - [ ] Under Review
  - [ ] Approved
  - [ ] Denied
- [ ] Unread notification count shows

#### Test Case 5: Review Application (Admin)
- [ ] Click on pending application
- [ ] All details display:
  - [ ] Customer information
  - [ ] Product details
  - [ ] Payment plan
  - [ ] Employment info
  - [ ] Document list
- [ ] Can view uploaded documents (if viewer implemented)

#### Test Case 6: Approve Application (Admin)
- [ ] Click "Approve" button
- [ ] Enter admin notes
- [ ] Confirm approval
- [ ] Status updates to "approved"
- [ ] Email sent to user
- [ ] Dashboard notification created
- [ ] Status history updated
- [ ] Cannot approve again

#### Test Case 7: Deny Application (Admin)
- [ ] Select different pending application
- [ ] Click "Deny" button
- [ ] Enter denial reason
- [ ] Confirm denial
- [ ] Status updates to "denied"
- [ ] Email sent to user
- [ ] Dashboard notification created
- [ ] Status history updated

#### Test Case 8: Request Documents (Admin)
- [ ] Select pending application
- [ ] Click "Request Documents"
- [ ] Select documents needed
- [ ] Submit request
- [ ] Status updates to "documents_requested"
- [ ] Email sent to user
- [ ] Dashboard notification created
- [ ] JSON array stored in database

### 3. API Tests

#### Test Case 9: Submit Application API
```bash
curl -X POST https://sparkle-pro.co.uk/api/installments/apply \
  -F 'applicationData={"userUid":"test123","gadgetId":1,"gadgetName":"iPhone 16","personalInfo":{"fullName":"John Doe","email":"john@test.com","phone":"+265999123456"},"employmentInfo":{"employmentStatus":"Full-time","monthlyIncome":"MWK 250,000-500,000"},"installmentPlan":{"type":"pay-to-own","weeks":4,"depositAmount":150000,"weeklyAmount":37500,"totalAmount":300000}}' \
  -F 'nationalIdFront=@/path/to/id-front.jpg' \
  -F 'nationalIdBack=@/path/to/id-back.jpg'
```
Expected Response:
```json
{
  "success": true,
  "reference": "APP-XXXXXXXX-20260107",
  "applicationId": 1,
  "documentsUploaded": 2,
  "message": "Application submitted successfully"
}
```

#### Test Case 10: Get Applications API
```bash
curl -X GET "https://sparkle-pro.co.uk/api/installments/applications?uid=test123"
```
Expected: List of user's applications

#### Test Case 11: Get Single Application
```bash
curl -X GET "https://sparkle-pro.co.uk/api/installments/applications/1"
```
Expected: Full application details with documents and history

#### Test Case 12: Approve Application API
```bash
curl -X POST "https://sparkle-pro.co.uk/admin/installments/applications/1/approve" \
  -H "Content-Type: application/json" \
  -d '{"adminNotes":"Approved","adminEmail":"admin@test.com"}'
```
Expected: `{"success":true,"message":"Application approved successfully"}`

### 4. Email Tests

#### Test Case 13: User Emails
- [ ] Application Received email received
  - [ ] Subject line correct
  - [ ] Reference number displayed
  - [ ] Product details shown
  - [ ] Tracking link works
- [ ] Approval Email
  - [ ] Congratulations message
  - [ ] Payment details
  - [ ] Dashboard link
- [ ] Denial Email (if tested)
  - [ ] Reason displayed
  - [ ] Contact support info

#### Test Case 14: Admin Emails
- [ ] New Application email received
  - [ ] Customer details
  - [ ] Product info
  - [ ] Review link works
  - [ ] Document count correct

### 5. Database Tests

#### Test Case 15: Data Integrity
```sql
-- Check application created
SELECT * FROM installment_applications ORDER BY created_at DESC LIMIT 1;

-- Check documents uploaded
SELECT * FROM application_documents WHERE application_id = 1;

-- Check status history
SELECT * FROM application_status_history WHERE application_id = 1 ORDER BY created_at;

-- Check notifications created
SELECT * FROM application_admin_notifications WHERE application_id = 1;
SELECT * FROM application_user_notifications WHERE application_id = 1;

-- Check general user notifications
SELECT * FROM user_notifications WHERE user_uid = 'test123' ORDER BY created_at DESC LIMIT 5;
```

#### Test Case 16: Views Working
```sql
-- Pending applications view
SELECT * FROM v_pending_applications;

-- Application summary view
SELECT * FROM v_application_summary;
```

### 6. File Upload Tests

#### Test Case 17: File Storage
- [ ] Navigate to `/uploads/applications/{id}/`
- [ ] Verify 5 files exist
- [ ] Check file naming: `{type}_{timestamp}_{original}.ext`
- [ ] Verify file permissions: 644
- [ ] Verify files are accessible via HTTP (with proper auth)

#### Test Case 18: File Validation
- [ ] Try uploading file > 5MB (should fail)
- [ ] Try uploading .exe file (should fail)
- [ ] Try uploading .txt file (should fail)
- [ ] Upload .jpg (should succeed)
- [ ] Upload .png (should succeed)
- [ ] Upload .pdf (should succeed)

### 7. Security Tests

#### Test Case 19: Authentication
- [ ] Try accessing admin endpoints without auth (should fail 401)
- [ ] Try submitting application without user uid (should fail 422)
- [ ] Try viewing another user's application (should fail 403/404)

#### Test Case 20: Input Validation
- [ ] Submit with missing required fields (should show errors)
- [ ] Submit with invalid email (should validate)
- [ ] Submit with invalid phone (should validate)
- [ ] Submit with SQL injection attempt (should escape)
- [ ] Submit with XSS attempt (should sanitize)

### 8. Mobile Tests

#### Test Case 21: Mobile Responsive
- [ ] Open on mobile device
- [ ] Form displays correctly
- [ ] Stepper works
- [ ] File upload works
- [ ] All buttons accessible
- [ ] Text readable
- [ ] No horizontal scroll

### 9. Performance Tests

#### Test Case 22: Load Times
- [ ] Application list loads < 2 seconds
- [ ] Form submission < 5 seconds
- [ ] File upload progress shows immediately
- [ ] Admin list loads < 3 seconds

## 🐛 Known Issues & Limitations

### Current Limitations:
1. **No inline document viewer** - Admin cannot view documents without download
2. **No edit application** - User cannot edit after submission
3. **No payment integration** - Approved applications don't auto-create payment plans
4. **Email relies on PHPMailer** - Needs SMTP configuration
5. **No SMS notifications** - Only email notifications implemented

### Future Enhancements:
1. Document viewer modal for admin
2. Edit/resubmit functionality
3. Direct payment integration
4. SMS via Twilio/Africa's Talking
5. Automated credit checks
6. Real-time status updates (WebSockets)
7. Export to Excel/CSV
8. Bulk admin actions

## 📊 Monitoring & Logs

### What to Monitor:
- [ ] Application submission rate
- [ ] Approval/denial ratio
- [ ] Document upload success rate
- [ ] Email delivery rate
- [ ] Average processing time
- [ ] Error logs

### Log Locations:
```bash
# PHP Errors
tail -f /var/log/php-errors.log

# Apache/Nginx Access
tail -f /var/log/apache2/access.log
tail -f /var/log/nginx/access.log

# Application Logs (if logging implemented)
tail -f /var/log/itsxtrapush/applications.log
```

## 🎯 Success Criteria

### Deployment Successful When:
- [ ] All database tables created
- [ ] All API endpoints responding
- [ ] Frontend form loads without errors
- [ ] User can submit application
- [ ] Files upload successfully
- [ ] Emails send correctly
- [ ] Admin can view applications
- [ ] Admin can approve/deny
- [ ] Status updates work
- [ ] Notifications created
- [ ] No console errors
- [ ] No PHP errors
- [ ] Mobile responsive works

## 🚨 Rollback Plan

### If Issues Occur:

1. **Database Issues**
   ```sql
   -- Drop tables if needed
   DROP TABLE IF EXISTS application_user_notifications;
   DROP TABLE IF EXISTS application_admin_notifications;
   DROP TABLE IF EXISTS application_status_history;
   DROP TABLE IF EXISTS application_documents;
   DROP TABLE IF EXISTS installment_applications;
   ```

2. **Backend Issues**
   - Revert index.php to previous version
   - Restore from git: `git checkout HEAD~1 sparkle-pro-api/index.php`

3. **Frontend Issues**
   - Remove new component
   - Revert api.js changes
   - Rebuild: `npm run build`

## 📞 Support Contacts

### Technical Issues:
- **Developer:** dev@itsxtrapush.com
- **Database Admin:** dba@itsxtrapush.com
- **Server Admin:** sysadmin@itsxtrapush.com

### Business Issues:
- **Product Manager:** pm@itsxtrapush.com
- **Customer Support:** support@itsxtrapush.com

## ✅ Final Sign-Off

### Pre-Production:
- [ ] All tests passed
- [ ] Code reviewed
- [ ] Security audit completed
- [ ] Performance acceptable
- [ ] Documentation complete

### Production Deployment:
- [ ] Database migrated
- [ ] Files uploaded
- [ ] Services restarted
- [ ] Smoke tests passed
- [ ] Monitoring active
- [ ] Team notified

### Post-Deployment:
- [ ] User announcement sent
- [ ] Support team trained
- [ ] Monitor for 24 hours
- [ ] Gather feedback
- [ ] Plan improvements

---

**Deployment Date:** _____________
**Deployed By:** _____________
**Verified By:** _____________
**Status:** ☐ Success  ☐ Issues  ☐ Rollback

**Notes:**
_______________________________________________________
_______________________________________________________
_______________________________________________________
