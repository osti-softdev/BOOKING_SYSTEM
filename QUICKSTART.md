# Quick Start Guide

## Step 1: Install Dependencies

Open PowerShell in the project folder and run:

```powershell
npm install
```

## Step 2: Create Database

1. Open XAMPP Control Panel
2. Start MySQL Server
3. Open phpMyAdmin at `http://localhost/phpmyadmin`
4. Create a new database called `booking_system`
5. No need to import anything - tables will be created automatically

## Step 3: Start the Server

In PowerShell, run:

```powershell
npm start
```

Or for development with auto-reload:

```powershell
npm run dev
```

## Step 4: Access the Application

Open your browser and go to:

- **Home**: http://localhost:3000
- **Patient Dashboard**: http://localhost:3000/client
- **Doctor Dashboard**: http://localhost:3000/doctor

## Testing the System

### Create Sample Doctors (Run in browser console on any page)

```javascript
// In browser console on http://localhost:3000
fetch('/api/doctor/register', {
  method: 'POST',
  headers: {'Content-Type': 'application/json'},
  body: JSON.stringify({
    name: 'Dr. John Smith',
    email: 'john@example.com',
    specialty: 'Cardiology'
  })
}).then(r => r.json()).then(d => console.log(d));

// Repeat for more doctors
```

Or add sample data directly to MySQL:

```sql
INSERT INTO doctors (name, email, specialty) VALUES 
('Dr. John Smith', 'john@example.com', 'Cardiology'),
('Dr. Sarah Johnson', 'sarah@example.com', 'Dermatology'),
('Dr. Mike Williams', 'mike@example.com', 'Neurology');

INSERT INTO clients (name, email, phone) VALUES 
('Alice Brown', 'alice@example.com', '555-0001'),
('Bob Wilson', 'bob@example.com', '555-0002');
```

## Accessing Different Roles

- Each user is identified by a unique ID stored in browser's localStorage
- Patient: Uses `clientId` 
- Doctor: Uses `doctorId`
- To test different users, use Incognito Window or clear localStorage

### Clear localStorage (in browser console):

```javascript
// For patient view
localStorage.removeItem('clientId');

// For doctor view
localStorage.removeItem('doctorId');

// Or clear everything
localStorage.clear();
```

## Common Issues & Solutions

| Issue | Solution |
|-------|----------|
| "Cannot GET /api/client/doctors" | Restart server with `npm start` |
| MySQL error | Ensure MySQL is running in XAMPP |
| Calendar not showing | Refresh page F5 |
| Real-time updates not working | Check browser console for errors |
| Port 3000 already in use | Change PORT in server.js or use `netstat -ano` to kill process |

## File Locations

```
D:\programs\xampp\htdocs\therese_docs\TOYOTA\BOOKING_SYSTEM_1.1\
├── package.json          ← npm dependencies
├── server.js             ← Main server (run this)
├── README.md             ← Full documentation
├── QUICKSTART.md         ← This file
├── models/
│   └── database.js       ← MySQL connection
├── routes/
│   ├── client.js         ← Patient API
│   └── doctor.js         ← Doctor API
├── public/
│   ├── css/style.css     ← All styling
│   └── js/
│       ├── client.js     ← Patient logic
│       └── doctor.js     ← Doctor logic
└── views/
    ├── index.html        ← Home page
    ├── client.html       ← Patient dashboard
    └── doctor.html       ← Doctor dashboard
```

## What's Included

✅ Full patient booking interface with calendar
✅ Full doctor management interface with notifications
✅ Real-time Socket.io communication
✅ MySQL database with 5 tables
✅ API routes for all operations
✅ Responsive design for mobile & desktop
✅ Status tracking (pending, accepted, declined, completed)
✅ Unavailable date management
✅ Appointment notifications with badge counter

## Next Steps

1. Test patient booking flow
2. Test doctor accepting/declining
3. Check real-time notifications
4. Mark dates as unavailable
5. View completed appointments
6. Check notification panel for updates

---

**Need help?** Check README.md for detailed documentation and API reference.
