const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');
const db = require('./models/database');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Routes
const clientRoutes = require('./routes/client');
const doctorRoutes = require('./routes/doctor');

app.use('/api/client', clientRoutes);
app.use('/api/doctor', doctorRoutes);

// Serve HTML files
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'index.html'));
});

app.get('/client', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'client.html'));
});

app.get('/doctor', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'doctor.html'));
});

// Socket.io connections
const doctors = {}; // Store active doctor connections
const clients = {}; // Store active client connections

io.on('connection', (socket) => {
  console.log('New user connected:', socket.id);

  socket.on('register-doctor', (doctorId) => {
    doctors[doctorId] = socket.id;
    console.log('Doctor registered:', doctorId);
  });

  socket.on('register-client', (clientId) => {
    clients[clientId] = socket.id;
    console.log('Client registered:', clientId);
  });

  // When a new appointment is booked
  socket.on('appointment-booked', (appointmentData) => {
    const doctorSocketId = doctors[appointmentData.doctorId];
    if (doctorSocketId) {
      io.to(doctorSocketId).emit('new-appointment-notification', appointmentData);
    }
    // Broadcast to all connected users
    io.emit('appointment-update', appointmentData);
  });

  // When doctor accepts appointment
  socket.on('appointment-accepted', (appointmentData) => {
    const clientSocketId = clients[appointmentData.clientId];
    if (clientSocketId) {
      io.to(clientSocketId).emit('appointment-status-changed', appointmentData);
    }
    io.emit('appointment-update', appointmentData);
  });

  // When doctor declines appointment
  socket.on('appointment-declined', (appointmentData) => {
    const clientSocketId = clients[appointmentData.clientId];
    if (clientSocketId) {
      io.to(clientSocketId).emit('appointment-status-changed', appointmentData);
    }
    io.emit('appointment-update', appointmentData);
  });

  // When doctor marks date unavailable
  socket.on('date-unavailable', (data) => {
    io.emit('unavailable-date-update', data);
  });

  // When appointment is marked as done
  socket.on('appointment-completed', (appointmentData) => {
    io.emit('appointment-update', appointmentData);
  });

  // When doctor approves reschedule
  socket.on('reschedule-approved', (data) => {
    const clientSocketId = clients[data.clientId];
    if (clientSocketId) {
      io.to(clientSocketId).emit('reschedule-approved-notification', {
        appointmentId: data.appointmentId,
        message: data.message,
        newDate: data.newDate,
        newTime: data.newTime
      });
    }
    io.emit('appointment-update', data);
  });

  // When doctor rejects reschedule
  socket.on('reschedule-rejected', (data) => {
    const clientSocketId = clients[data.clientId];
    if (clientSocketId) {
      io.to(clientSocketId).emit('reschedule-rejected-notification', {
        appointmentId: data.appointmentId,
        message: data.message,
        reason: data.reason
      });
    }
    io.emit('appointment-update', data);
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
    // Remove from doctors and clients
    for (let id in doctors) {
      if (doctors[id] === socket.id) delete doctors[id];
    }
    for (let id in clients) {
      if (clients[id] === socket.id) delete clients[id];
    }
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
