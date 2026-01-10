# Online Appointment Booking System

A comprehensive appointment booking system built with Node.js, Express, jQuery, MySQL, and Socket.io for real-time notifications.

## Features

### For Patients/Clients
- 📅 Interactive calendar to select appointment dates
- 👨‍⚕️ Browse and select doctors
- 🕐 Choose preferred appointment time
- 📝 Provide reason for visit
- 📊 View all booked appointments with status
- 🔔 Real-time appointment status updates

### For Doctors
- 📅 Calendar view of all appointments
- ✅ Accept or decline patient appointments
- ❌ Mark specific dates as unavailable
- 📋 View pending appointments
- ✔️ Mark completed appointments
- 🔔 Real-time notifications for new bookings
- 📊 View appointment history

### General Features
- ⚡ Real-time communication using Socket.io
- 🗄️ MySQL database for persistent storage
- 🎨 Clean, responsive UI
- 💻 Works on desktop and mobile devices
- 🔒 Session management with localStorage

## Tech Stack

- **Backend**: Node.js, Express.js
- **Frontend**: HTML5, jQuery, CSS3
- **Database**: MySQL
- **Real-time**: Socket.io
- **Package Manager**: npm

## Prerequisites

- Node.js (v12 or higher)
- MySQL Server running
- npm (comes with Node.js)
- XAMPP or any MySQL client

## Installation & Setup

### 1. Create Database

Open MySQL and run the following commands:

```sql
CREATE DATABASE booking_system;
USE booking_system;
```

The application will automatically create the required tables on first run.

### 2. Install Dependencies

```bash
cd path/to/BOOKING_SYSTEM_1.1
npm install
```

### 3. Configure Database Connection

If needed, edit the database connection in `models/database.js`:

```javascript
const connection = mysql.createConnection({
  host: 'localhost',
  user: 'root',           // Your MySQL username
  password: '',           // Your MySQL password
  database: 'booking_system'
});
```

### 4. Start the Server

```bash
npm start
```

Or for development with auto-reload:

```bash
npm run dev
```

The server will start on `http://localhost:3000`

## File Structure

```
BOOKING_SYSTEM_1.1/
├── server.js                 # Main server file with Socket.io setup
├── package.json             # Project dependencies
├── models/
│   └── database.js          # Database connection & table creation
├── routes/
│   ├── client.js            # Patient-side API routes
│   └── doctor.js            # Doctor-side API routes
├── public/
│   ├── css/
│   │   └── style.css        # Shared styles for both interfaces
│   └── js/
│       ├── client.js        # Patient-side JavaScript (calendar, booking)
│       └── doctor.js        # Doctor-side JavaScript (management, notifications)
└── views/
    ├── index.html           # Home page
    ├── client.html          # Patient dashboard
    └── doctor.html          # Doctor dashboard
```

## Database Tables

### doctors
- `id`: Doctor ID
- `name`: Doctor's name
- `email`: Doctor's email
- `specialty`: Medical specialty
- `created_at`: Registration timestamp

### clients
- `id`: Client/Patient ID
- `name`: Patient's name
- `email`: Patient's email
- `phone`: Phone number
- `created_at`: Registration timestamp

### appointments
- `id`: Appointment ID
- `clientId`: Reference to client
- `doctorId`: Reference to doctor
- `appointmentDate`: Date of appointment
- `appointmentTime`: Time of appointment
- `reason`: Reason for visit
- `status`: pending, accepted, declined, completed
- `created_at`: Booking timestamp

### unavailable_dates
- `id`: ID
- `doctorId`: Reference to doctor
- `unavailableDate`: Date marked unavailable
- `reason`: Reason for unavailability
- `created_at`: Timestamp

### notifications
- `id`: Notification ID
- `doctorId`: Reference to doctor
- `appointmentId`: Reference to appointment
- `message`: Notification message
- `isRead`: Read status
- `created_at`: Notification timestamp

## API Endpoints

### Client Routes (`/api/client`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/doctors` | Get all doctors |
| POST | `/register` | Register new patient |
| GET | `/:clientId` | Get patient info |
| POST | `/book-appointment` | Book appointment |
| GET | `/:clientId/appointments` | Get patient's appointments |
| GET | `/doctor/:doctorId/unavailable-dates` | Get doctor's unavailable dates |

### Doctor Routes (`/api/doctor`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/register` | Register new doctor |
| GET | `/:doctorId` | Get doctor info |
| GET | `/:doctorId/appointments` | Get all appointments |
| GET | `/:doctorId/appointments/pending` | Get pending appointments |
| GET | `/:doctorId/appointments/completed` | Get completed appointments |
| POST | `/:appointmentId/accept` | Accept appointment |
| POST | `/:appointmentId/decline` | Decline appointment |
| POST | `/:appointmentId/complete` | Mark as completed |
| POST | `/:doctorId/unavailable-date` | Mark date unavailable |
| GET | `/:doctorId/unavailable-dates` | Get unavailable dates |
| DELETE | `/:unavailableDateId/unavailable-date` | Remove unavailable date |
| GET | `/:doctorId/notifications` | Get doctor's notifications |
| POST | `/:notificationId/read` | Mark notification as read |

## Socket.io Events

### Client Events
- `register-client`: Register client connection
- `appointment-booked`: Emit when appointment is booked
- `appointment-status-changed`: Listen for status updates

### Doctor Events
- `register-doctor`: Register doctor connection
- `new-appointment-notification`: Listen for new bookings
- `appointment-accepted`: Emit when appointment accepted
- `appointment-declined`: Emit when appointment declined
- `date-unavailable`: Emit when marking date unavailable
- `appointment-completed`: Emit when marking complete
- `appointment-update`: Listen for any appointment updates

## Usage Guide

### For Patients

1. Visit `http://localhost:3000`
2. Click "I'm a Patient"
3. Select a doctor from the list
4. Click on a date in the calendar
5. Choose preferred time
6. Enter reason for visit
7. Click "Book Appointment"
8. View appointment status in "My Appointments"

### For Doctors

1. Visit `http://localhost:3000`
2. Click "I'm a Doctor"
3. View pending appointments in "Pending Appointments" tab
4. Accept or decline appointments
5. Mark dates as unavailable in the left panel
6. Click 🔔 to view notifications
7. View completed appointments in "Completed Appointments" tab

## Key Features Explained

### Calendar Functionality
- Green highlight: Today's date
- Disabled (red): Past dates or unavailable dates
- Orange border: Dates with appointments (Doctor view)
- Click any available date to select

### Real-time Notifications
- Patients receive instant updates when appointment is accepted/declined
- Doctors receive instant notifications when new appointments are booked
- Notification badge shows unread count

### Unavailable Dates
- Doctors can mark multiple dates as unavailable
- Patients cannot book on unavailable dates
- Can be removed by the doctor anytime

### Appointment Status
- **Pending**: Awaiting doctor's response
- **Accepted**: Doctor approved the appointment
- **Declined**: Doctor rejected the appointment
- **Completed**: Appointment has been finished

## Troubleshooting

### Database Connection Error
- Ensure MySQL server is running
- Check credentials in `models/database.js`
- Verify database `booking_system` exists

### Port Already in Use
- Change port in `server.js`: `const PORT = 3001;`
- Or kill the process using port 3000

### Socket.io Not Working
- Ensure Socket.io library is loaded in HTML
- Check browser console for errors
- Verify server is running

### Appointments Not Showing
- Refresh the page
- Check browser's localStorage (clear if issues persist)
- Verify MySQL data with: `SELECT * FROM appointments;`

## Security Notes

⚠️ **For Production Use:**
- Add authentication/login system
- Implement password hashing (bcrypt)
- Add input validation
- Use HTTPS instead of HTTP
- Add rate limiting
- Implement CORS properly
- Add role-based access control

## Future Enhancements

- Email notifications
- SMS reminders
- Payment integration
- Doctor ratings and reviews
- Appointment rescheduling
- Prescription management
- Patient medical history
- Admin dashboard
- Multi-language support

## License

This project is open source and available under the ISC License.

## Support

For issues or questions, refer to the console logs and ensure all services are running properly.
