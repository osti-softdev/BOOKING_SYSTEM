# Doctor Side: Reschedule Request Management

## ✅ Features Implemented

### 1. View Reschedule Requests
- New "Reschedule Requests" tab in the doctor dashboard
- Displays all pending reschedule requests from patients
- Shows:
  - Patient name and email
  - Current appointment date and time
  - **Requested new date and time** (highlighted)
  - Reason for reschedule request
  - Original appointment reason

### 2. Approve Reschedule
- **Button**: "Approve" button on each reschedule request
- **Action**: Approves the reschedule request
- **Updates**: 
  - Changes appointment to new date/time
  - Sets appointment status to "accepted"
  - Clears reschedule request fields
- **Auto-Notification**: Patient receives instant notification with new appointment details

### 3. Reject Reschedule
- **Button**: "Reject" button on each reschedule request
- **Action**: Rejects the reschedule request
- **Dialog**: Prompts doctor for optional rejection reason
- **Updates**:
  - Keeps original appointment date/time
  - Resets reschedule request fields
  - Status back to "accepted"
- **Auto-Notification**: Patient receives instant notification with rejection reason

## 🔔 Real-Time Notifications (Socket.io)

### Doctor-Side Events:
- `reschedule-requested`: Triggered when patient requests reschedule
  - Automatically increments notification badge
  - Shows success notification to doctor
  - Reloads reschedule requests list

### Reschedule Approval Event:
- `reschedule-approved`: Sent by doctor when approving
  - Patient receives instant notification
  - Appointment automatically updated in patient's list
  - Shows new date/time to patient

### Reschedule Rejection Event:
- `reschedule-rejected`: Sent by doctor when rejecting
  - Patient receives instant notification
  - Shows rejection reason (if provided)
  - Original appointment remains in place

## 📊 Database Updates

### New Columns in `appointments` table:
```sql
- rescheduleRequestedDate DATE
- rescheduleRequestedTime TIME
- rescheduleReason VARCHAR(500)
```

### New Status Values:
```
- 'reschedule_requested': Waiting for doctor approval
- 'cancelled': Patient cancelled appointment
```

## 🔧 API Endpoints Added

### Get Reschedule Requests:
```
GET /api/doctor/:doctorId/appointments/reschedule-requests
Returns: Array of appointments with status 'reschedule_requested'
```

### Approve Reschedule:
```
POST /api/doctor/:appointmentId/approve-reschedule
Body: {
  newDate: "2026-01-15",
  newTime: "14:30"
}
Returns: { success: true, message: 'Reschedule approved' }
Updates: appointmentDate, appointmentTime, status to 'accepted'
```

### Reject Reschedule:
```
POST /api/doctor/:appointmentId/reject-reschedule
Body: {
  reason: "Doctor not available at requested time"
}
Returns: { success: true, message: 'Reschedule rejected' }
Updates: status back to 'accepted', clears reschedule fields
```

## 📁 Files Modified

### Frontend:
1. **views/doctor.html**
   - Added "Reschedule Requests" tab
   - New div with id="rescheduleRequests"

2. **public/js/doctor.js**
   - `loadRescheduleRequests()`: Loads and displays reschedule requests
   - `approveReschedule()`: Approves reschedule with Socket.io notification
   - `rejectReschedule()`: Rejects reschedule with optional reason
   - Updated `switchTab()`: Added reschedule requests handling
   - Updated initialization: Added `loadRescheduleRequests()`
   - Added Socket.io listener: `reschedule-requested`

### Backend:
1. **routes/doctor.js**
   - Added GET endpoint: `/appointments/reschedule-requests`
   - Added POST endpoint: `/approve-reschedule`
   - Added POST endpoint: `/reject-reschedule`

2. **server.js**
   - Added Socket.io event: `reschedule-approved`
   - Added Socket.io event: `reschedule-rejected`
   - Both events auto-notify patients

### Client-Side Updates:
1. **public/js/client.js**
   - Added Socket.io listeners:
     - `reschedule-approved-notification`
     - `reschedule-rejected-notification`
   - Both update appointments and show notifications

2. **models/database.js**
   - Added new columns to appointments table
   - Updated status ENUM to include new values

## 🎯 User Flow

### Patient Initiates:
1. Patient clicks "Reschedule" button on their appointment
2. Opens modal with new date/time selection
3. Submits reschedule request with reason

### Doctor Responds:
1. Doctor sees "Reschedule Requests" tab notification badge
2. Opens "Reschedule Requests" tab
3. Reviews patient request with current and requested date/time
4. Either:
   - **Approves**: Patient gets instant notification with new date/time
   - **Rejects**: Patient gets instant notification with rejection reason

### Patient Receives:
1. Instant Socket.io notification of approval/rejection
2. Appointment details updated in their dashboard
3. Can view the new appointment time or retry rescheduling if rejected

## 🔐 Validation & Constraints

- Reschedule requests only available for pending/accepted appointments
- Cannot reschedule past appointments
- New date must be in the future
- Doctor can approve/reject at any time
- Multiple reschedule attempts allowed (up to 3 per policy)

## 🚀 Testing Checklist

- [ ] Doctor receives notification when patient requests reschedule
- [ ] Reschedule requests tab shows with correct details
- [ ] Approving reschedule updates appointment date/time
- [ ] Patient receives instant notification of approval
- [ ] Rejecting reschedule with reason notifies patient
- [ ] Appointment status correctly updated to 'accepted' after approval
- [ ] Original appointment details preserved if rejected
- [ ] Notification badge increments on reschedule request
- [ ] All Socket.io events emitted correctly
- [ ] Database entries correctly updated

## 💡 Notes

- Auto-notifications use Socket.io for real-time delivery
- Doctor approval doesn't require additional patient action
- Rejection reason is optional but recommended for communication
- All time-sensitive operations use server timestamps
- Reschedule requests don't count against cancellation policy

