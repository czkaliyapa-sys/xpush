# Professional Gadget Viewing Appointment Scheduling System

## Overview
A comprehensive appointment scheduling system for the Xtrapush Gadgets platform that enables customers to book viewing appointments for specific gadgets. The system includes advanced conflict detection, stock validation, time slot management, and professional email notifications for both customers and administrators.

## System Features

### 1. **Database Schema** (`migrations/2025-12-14_create_appointments_table.sql`)
- **Table**: `appointments`
- **Key Fields**:
  - `id`: Primary key (auto-increment)
  - `gadget_id`: Foreign key to gadgets table (prevents booking out-of-stock items)
  - `user_id`: Foreign key to users table (tracks customer)
  - `appointment_date`: Date in YYYY-MM-DD format
  - `appointment_time`: Time in HH:MM 24-hour format
  - `location_id`: Mobile van location identifier
  - `location_name`: Human-readable location name
  - `status`: Enum (scheduled|completed|cancelled|no-show)
  - `created_at` / `updated_at`: Timestamps

- **Constraints**:
  - Unique constraint on `(user_id, gadget_id, status)` prevents double-booking
  - Foreign key constraints cascade on deletion
  - Indexes on frequently queried fields

### 2. **Backend API Endpoints** (`sparkle-pro-api/index.php`)

#### Create Appointment
- **Route**: POST `/appointments`
- **Validation**:
  - Gadget must be in stock
  - User can only have ONE active appointment at a time
  - Date must be in future (not past dates)
  - Date must be within 90 days
  - Time must be during business hours (9:00 AM - 5:00 PM)
  - Day must be Monday-Saturday (no Sundays)
  - No time slot conflicts with other users (30-minute buffer)
  
- **Response**: 
  - Success: `{success: true, appointmentId: <id>}`
  - Includes automatic email notifications

#### Get Available Slots
- **Route**: GET `/appointments/available-slots?date=YYYY-MM-DD&locationId=<id>`
- **Returns**: Array of available 30-minute time slots (9:00-17:00)
- **Excludes**: Already booked slots for that date/location

#### Check User Active Appointment
- **Route**: GET `/appointments/user-active?userId=<id>`
- **Returns**: `{success: true, hasActive: boolean}`
- **Purpose**: Prevent users from double-booking

#### Get User Appointments
- **Route**: GET `/appointments/user?userId=<id>`
- **Returns**: All appointments for user (past and future)

#### Cancel Appointment
- **Route**: POST `/appointments/cancel`
- **Validates**: User ownership before cancellation
- **Updates**: Status to 'cancelled'

### 3. **Frontend Integration**

#### BookingCalendar Component (`src/components/BookingCalendar.jsx`)
**Features**:
- Multi-step stepper UI (Date → Time → Confirm)
- Real-time available slot fetching from backend
- Location selector with "Find Us" link
- User active appointment checking
- Sunday/holiday blocking
- Business hours display (Mon-Sat, 9am-5pm)
- Confirmation dialog with booking summary
- Email confirmation display
- Success alerts with appointment details

**State Management**:
- `selectedDateStr`: Selected appointment date
- `selectedTime`: Selected time slot
- `selectedLocationId`: Chosen location
- `availableSlots`: Real-time available slots
- `userHasActive`: User's active appointment status
- `activeStep`: Stepper progress tracking

#### GadgetDetail Integration (`src/GadgetDetail.jsx`)
**Features**:
- Stock availability check before showing booking UI
- Different alerts based on stock status:
  - ✓ In stock: Show full booking form
  - ❌ Out of stock: Show unavailability message
- Success snackbar with customer email confirmation
- Tab organization (Product Details | Schedule Viewing | Van Location)

### 4. **Email Notifications**

#### Customer Confirmation Email
- **Subject**: "Appointment Confirmed — Xtrapush Gadget Viewing"
- **Contents**:
  - Appointment date & time
  - Location details
  - Gadget name
  - Confirmation number
  - Cancellation policy (24-hour notice)

#### Admin Notification Email
- **Subject**: "New Appointment Booking: [Gadget Name] ([Date] [Time])"
- **Recipients**: Admin email + CC to customer (so they have record)
- **Contents**:
  - Appointment ID
  - Customer details (name, email)
  - Gadget information
  - Date, time, location
  - Appointment status

### 5. **Validation & Conflict Detection**

#### Double-Booking Prevention
- Unique constraint on `(user_id, gadget_id, status)` ensures one active appointment per user per gadget
- Checks database before creating appointment

#### Time Slot Conflict Detection
- 30-minute buffer zone around each booking
- If user books 2:00-2:30, others can't book:
  - 1:30-2:00 (slot before)
  - 2:00-2:30 (the slot)
  - 2:30-3:00 (slot after)
- Prevents back-to-back double bookings

#### Stock Availability
- Checks `gadgets.stock_quantity` before allowing appointment
- Prevents booking non-existent items

#### Date/Time Constraints
- **Minimum**: Tomorrow (can't book for today)
- **Maximum**: 90 days in future
- **Days**: Monday-Saturday only (no Sundays)
- **Hours**: 9:00 AM - 5:00 PM (17:00 in 24hr format)
- **Granularity**: 30-minute slots (9:00, 9:30, 10:00, etc.)

### 6. **API Integration** (`src/services/api.js`)

```javascript
appointmentsAPI = {
  create(appointment),           // Create new appointment
  getAvailableSlots(date, locationId), // Fetch available times
  getUserActive(userId),         // Check active appointment
  getUserAppointments(userId),   // Get user's history
  cancel(appointmentId, userId, reason) // Cancel appointment
}
```

## User Flow

### Booking an Appointment
1. User navigates to gadget detail page
2. Clicks "Schedule Viewing" tab
3. System checks if gadget is in stock
   - ✓ If in stock: Show booking form
   - ❌ If out of stock: Show unavailability notice
4. User selects date (with calendar constraints)
5. System fetches available slots for that date/location
6. User selects time from available options
7. User reviews booking summary in confirmation dialog
8. System creates appointment with validations
9. Both customer & admin receive confirmation emails
10. User sees success message with appointment details

## Technical Architecture

### Data Flow
```
Frontend BookingCalendar
    ↓ (appointmentDate, appointmentTime, locationId)
Backend /appointments [POST]
    ├→ Validate inputs
    ├→ Check gadget stock
    ├→ Check user's active appointments
    ├→ Check time conflicts
    ├→ Check date/time constraints
    └→ Insert to database
        ├→ Send customer email
        └→ Send admin email (CC customer)
            ↓
        Return appointmentId + success
    ↓
Frontend: Show success message
```

### Concurrent Request Safety
- Database constraints prevent race conditions
- Unique constraint ensures atomicity
- Queries check before insert (double-check pattern)

## Production-Ready Features

✅ **Scalable**: Indexed database queries for performance
✅ **Secure**: Email validation before sending
✅ **Accessible**: Clear error messages and UI feedback
✅ **Reliable**: Email notifications don't block appointment creation
✅ **Professional**: Formatted emails with branding
✅ **Testable**: Clean API endpoints with clear responses
✅ **Maintainable**: Well-commented code with clear separation of concerns

## Testing Checklist

- [ ] User can book appointment for in-stock gadget
- [ ] User cannot book for out-of-stock gadget
- [ ] User cannot have two active appointments simultaneously
- [ ] Past dates are blocked from selection
- [ ] Sunday dates show no available slots
- [ ] Booked slots don't appear for other users
- [ ] 30-minute buffer prevents overlapping bookings
- [ ] Customer receives confirmation email
- [ ] Admin receives notification email with customer CC
- [ ] Cancellation works and prevents user from re-booking immediately
- [ ] Date limit (90 days) is enforced
- [ ] Business hours (9am-5pm) are enforced
- [ ] Database constraints prevent duplicate bookings

## Future Enhancements

- SMS notifications for appointment reminders
- Appointment rescheduling feature
- Admin dashboard to manage appointments
- Calendar view for appointment tracking
- Customer appointment history page
- Automated reminder emails (24hr before)
- No-show tracking and follow-up
- Appointment confirmation via SMS
