# Book Viewing Feature - Architecture & Flow Diagram

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    GadgetsPage / WishlistPage               │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │              ItemCard3D (Gadget Card)               │   │
│  │                                                      │   │
│  │  ┌────────────────────────────────────────────────┐ │   │
│  │  │  [Share] [Add to Cart] [✓ Add]                │ │   │
│  │  └────────────────────────────────────────────────┘ │   │
│  │  ┌────────────────────────────────────────────────┐ │   │
│  │  │  [$ Pay in Installments]                      │ │   │
│  │  └────────────────────────────────────────────────┘ │   │
│  │  ┌────────────────────────────────────────────────┐ │   │
│  │  │  [📅 Book Viewing] ◄── NEW BUTTON            │ │   │
│  │  └────────┬───────────────────────────────────────┘ │   │
│  │           │                                         │   │
│  │           │ onClick → setBookingOpen(true)         │   │
│  │           │                                         │   │
│  └───────────┼─────────────────────────────────────────┘   │
│              │                                              │
└──────────────┼──────────────────────────────────────────────┘
               │
               │ Opens Modal
               ▼
       ┌──────────────────────┐
       │ QuickBookingModal    │
       └──────────────────────┘
```

## Modal Workflow

```
START: User clicks "📅 Book Viewing"
   │
   ▼
┌─────────────────────────────────────────┐
│ Modal Opens                             │
│ - Check if user is authenticated        │
│ - Check if user has active appointment  │
└────────┬────────────────────────────────┘
         │
         ├─► NOT AUTHENTICATED
         │   └─► Show: "Please sign in"
         │
         ├─► HAS ACTIVE APPOINTMENT
         │   └─► Show: "You have an active..."
         │       Disable all inputs
         │
         └─► OK TO PROCEED
             │
             ▼
      ┌──────────────────────┐
      │ STEP 1: Select Date  │
      ├──────────────────────┤
      │ Date Picker          │
      │ (1-90 days ahead)    │
      └────────┬─────────────┘
               │
               │ onChange
               ▼
      ┌──────────────────────────────┐
      │ Check if Sunday              │
      ├──────────────────────────────┤
      │ YES ─► Show warning         │
      │ NO  ─► Fetch time slots     │
      └────────┬─────────────────────┘
               │
               │ Date selected
               ▼
      ┌──────────────────────┐
      │ STEP 2: Select Time  │
      ├──────────────────────┤
      │ Location dropdown    │
      │ Time slot dropdown   │
      └────────┬─────────────┘
               │
               │ Time selected
               ▼
      ┌──────────────────────────────┐
      │ CLICK: ✓ Book Viewing        │
      ├──────────────────────────────┤
      │ Validate all fields          │
      │ POST to /appointments        │
      └────────┬─────────────────────┘
               │
               ├─► ERROR
               │   └─► Show alert
               │       Keep modal open
               │
               └─► SUCCESS
                   └─► Show success message
                       Close modal (2 sec delay)
                       Update userHasActive = true

END
```

## Component Communication

```
┌──────────────────────┐
│   ItemCard3D         │
│                      │
│  State:              │
│  - bookingOpen       │
│  - gadgetId          │
│  - gadgetName        │
│  - gadgetImage       │
└──────────┬───────────┘
           │
           │ Props:
           │ - open={bookingOpen}
           │ - onClose={close fn}
           │ - gadgetId, gadgetName, image
           │
           ▼
┌──────────────────────────────┐
│   QuickBookingModal          │
│                              │
│  State:                      │
│  - selectedDateStr           │
│  - selectedTime              │
│  - selectedLocationId        │
│  - availableSlots[]          │
│  - loading                   │
│  - error                     │
│  - userHasActive             │
│  - success                   │
│                              │
│  Contexts:                   │
│  - useAuth()                 │
│  - usePricing()              │
│                              │
│  API Calls:                  │
│  - appointmentsAPI.create()  │
│  - appointmentsAPI.getAvailableSlots()
│  - appointmentsAPI.getUserActive()
│  - locations from data       │
└──────────────────────────────┘
```

## Data Flow

```
USER INTERACTION                COMPONENT STATE          API / DATA

Click "Book Viewing"
    │
    ▼
Modal Opens ─────────────────► bookingOpen = true
    │
    ├─► useAuth() ────────────► { isAuthenticated, user }
    │
    ├─► Check Active ─────────► appointmentsAPI.getUserActive()
    │
    ▼
User Selects Date
    │
    ├─► Check Sunday ─────────► dayjs calculation
    │
    ├─► Fetch Slots ─────────► appointmentsAPI.getAvailableSlots()
    │                          (date, locationId)
    │
    ▼                          availableSlots = [...]
User Selects Location
    │
    ├─► Update Slots ────────► appointmentsAPI.getAvailableSlots()
    │                          (selectedDate, newLocation)
    │
    ▼                          availableSlots = [...]
User Selects Time
    │
    ▼                          selectedTime = "14:30"
User Clicks "Book Viewing"
    │
    ├─► Validate ───────────► Check all required fields
    │
    ▼
Create Booking ─────────────► appointmentsAPI.create({
                              gadgetId, appointmentDate,
                              appointmentTime, locationId,
                              userId, userName, userEmail
                            })
    │
    ├─► SUCCESS ────────────► Show confirmation
    │                          Send email
    │                          Close modal
    │                          userHasActive = true
    │
    └─► ERROR ──────────────► Show error message
                              Keep modal open
```

## Location Data Structure

```
locations.js
├── {
│   id: 'lilongwe-service',
│   name: 'Lilongwe Service Area',
│   emoji: '🇲🇼',
│   address: 'Lilongwe, Malawi (Mobile Service)',
│   hours: ['Monday - Saturday: 9:00 AM - 5:00 PM'],
│   region: 'Malawi'
├── }
│
└── {
    id: 'northamptonshire-service',
    name: 'Northamptonshire Service Area',
    emoji: '🇬🇧',
    address: 'Northamptonshire, UK (Mobile Service)',
    hours: ['Monday - Saturday: 9:00 AM - 5:00 PM'],
    region: 'UK'
}
```

## Available API Endpoints

```
POST /appointments
├── Params: {
│   gadgetId, gadgetName, appointmentDate, appointmentTime,
│   locationId, locationName, userId, userName, userEmail
├── Response: { success, message, appointmentId?, error? }
└── Headers: Content-Type: application/json

GET /appointments/available-slots?date=YYYY-MM-DD&locationId=id
├── Params: date (YYYY-MM-DD), locationId
├── Response: { success, slots: [], message? }
└── Example Slots: ['09:00', '10:00', '11:00', ...]

GET /appointments/user-active?userId=id
├── Params: userId
├── Response: { success, hasActive: boolean, message? }
└── Used for validation
```

## State Management Flow

```
Initial State
├── bookingOpen = false
├── selectedDateStr = tomorrow
├── selectedTime = ''
├── selectedLocationId = 'lilongwe-service'
├── availableSlots = []
├── loading = false
├── slotsLoading = false
├── error = null
├── success = false
├── activeStep = 0
└── userHasActive = false

User Actions & State Updates:
┌─────────────────────────────┬──────────────────────────┐
│ ACTION                      │ STATE UPDATE             │
├─────────────────────────────┼──────────────────────────┤
│ Click "Book Viewing"        │ bookingOpen = true       │
│ Modal mounts                │ Check userHasActive      │
│ Select date                 │ selectedDateStr = newDate│
│                             │ Fetch availableSlots     │
│ Date is Sunday              │ error = "Not available"  │
│ Select location             │ selectedLocationId = id  │
│                             │ Fetch availableSlots     │
│ Slots load                  │ availableSlots = [...]   │
│ Select time                 │ selectedTime = time      │
│                             │ activeStep = 1           │
│ Click "Book Viewing"        │ loading = true           │
│ Booking succeeds            │ success = true           │
│                             │ Auto-close modal         │
│                             │ userHasActive = true     │
│ Booking fails               │ error = message          │
│ Click Cancel/Close          │ bookingOpen = false      │
└─────────────────────────────┴──────────────────────────┘
```

## Error Handling Strategy

```
ERROR TYPE                          HANDLING
──────────────────────────────────────────────────────────
Not Authenticated                   → Block with message
Active Appointment Exists           → Block with message
Sunday Selected                     → Show warning
No Slots Available                  → Show info message
Slot Loading Failed                 → Show error alert
Validation Failed                   → Show specific error
API Error on Creation               → Show error message & retry
Network Error                       → Show connection error
Unknown Error                       → Generic error message
```

---

This architecture ensures:
✅ Clean separation of concerns
✅ Proper error handling
✅ Responsive user experience
✅ Data consistency
✅ Production-ready code quality
