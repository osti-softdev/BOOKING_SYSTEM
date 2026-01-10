const express = require('express');
const router = express.Router();
const db = require('../models/database');

// Get all doctors
router.get('/doctors', (req, res) => {
  const query = 'SELECT id, name, specialty FROM doctors';
  db.query(query, (err, results) => {
    if (err) {
      res.status(500).json({ error: err });
      return;
    }
    res.json(results);
  });
});

// Register a client
router.post('/register', (req, res) => {
  const { name, email, phone } = req.body;
  const query = 'INSERT INTO clients (name, email, phone) VALUES (?, ?, ?)';
  db.query(query, [name, email, phone], (err, results) => {
    if (err) {
      res.status(500).json({ error: err });
      return;
    }
    res.json({ success: true, clientId: results.insertId });
  });
});

// Get client info
router.get('/:clientId', (req, res) => {
  const { clientId } = req.params;
  const query = 'SELECT * FROM clients WHERE id = ?';
  db.query(query, [clientId], (err, results) => {
    if (err) {
      res.status(500).json({ error: err });
      return;
    }
    res.json(results[0] || {});
  });
});

// Book an appointment
router.post('/book-appointment', (req, res) => {
  const { clientId, doctorId, appointmentDate, appointmentTime, reason } = req.body;
  
  // Check if date is unavailable
  const checkUnavailableQuery = 'SELECT * FROM unavailable_dates WHERE doctorId = ? AND unavailableDate = ?';
  db.query(checkUnavailableQuery, [doctorId, appointmentDate], (err, unavailableResults) => {
    if (err) {
      res.status(500).json({ error: err });
      return;
    }
    
    if (unavailableResults.length > 0) {
      res.status(400).json({ error: 'This date is unavailable for appointments' });
      return;
    }

    // Check if time slot is already booked
    const checkBookedQuery = 'SELECT * FROM appointments WHERE doctorId = ? AND appointmentDate = ? AND appointmentTime = ? AND status IN ("pending", "accepted")';
    db.query(checkBookedQuery, [doctorId, appointmentDate, appointmentTime], (err, bookedResults) => {
      if (err) {
        res.status(500).json({ error: err });
        return;
      }

      if (bookedResults.length > 0) {
        res.status(400).json({ error: 'This time slot is already booked' });
        return;
      }

      // Insert appointment
      const insertQuery = 'INSERT INTO appointments (clientId, doctorId, appointmentDate, appointmentTime, reason, status) VALUES (?, ?, ?, ?, ?, "pending")';
      db.query(insertQuery, [clientId, doctorId, appointmentDate, appointmentTime, reason], (err, results) => {
        if (err) {
          res.status(500).json({ error: err });
          return;
        }

        // Insert notification for doctor
        const notificationQuery = 'INSERT INTO notifications (doctorId, appointmentId, message) VALUES (?, ?, ?)';
        const message = `New appointment request from client on ${appointmentDate} at ${appointmentTime}`;
        db.query(notificationQuery, [doctorId, results.insertId, message], (err) => {
          if (err) console.error(err);
        });

        res.json({ success: true, appointmentId: results.insertId });
      });
    });
  });
});

// Get client appointments
router.get('/:clientId/appointments', (req, res) => {
  const { clientId } = req.params;
  const query = `
    SELECT a.*, d.name as doctorName, d.specialty
    FROM appointments a
    JOIN doctors d ON a.doctorId = d.id
    WHERE a.clientId = ?
    ORDER BY a.appointmentDate DESC, a.appointmentTime DESC
  `;
  db.query(query, [clientId], (err, results) => {
    if (err) {
      res.status(500).json({ error: err });
      return;
    }
    res.json(results);
  });
});

// Get unavailable dates for a doctor
router.get('/doctor/:doctorId/unavailable-dates', (req, res) => {
  const { doctorId } = req.params;
  const query = 'SELECT unavailableDate FROM unavailable_dates WHERE doctorId = ?';
  db.query(query, [doctorId], (err, results) => {
    if (err) {
      res.status(500).json({ error: err });
      return;
    }
    res.json(results.map(r => r.unavailableDate));
  });
});

// Cancel an appointment
router.post('/:appointmentId/cancel', (req, res) => {
  const { appointmentId } = req.params;
  const { reason } = req.body;
  
  // Update appointment status to cancelled
  const query = 'UPDATE appointments SET status = "cancelled" WHERE id = ?';
  db.query(query, [appointmentId], (err, results) => {
    if (err) {
      res.status(500).json({ error: err });
      return;
    }
    res.json({ success: true, message: 'Appointment cancelled successfully' });
  });
});

// Request appointment reschedule
router.post('/:appointmentId/reschedule', (req, res) => {
  const { appointmentId } = req.params;
  const { newDate, newTime, reason } = req.body;
  
  // Update appointment with reschedule request
  const query = 'UPDATE appointments SET rescheduleRequestedDate = ?, rescheduleRequestedTime = ?, rescheduleReason = ?, status = "reschedule_requested" WHERE id = ?';
  db.query(query, [newDate, newTime, reason, appointmentId], (err, results) => {
    if (err) {
      res.status(500).json({ error: err });
      return;
    }
    res.json({ success: true, message: 'Reschedule request submitted' });
  });
});

module.exports = router;
