const express = require('express');
const router = express.Router();
const db = require('../models/database');

// Register a doctor
router.post('/register', (req, res) => {
  const { name, email, specialty } = req.body;
  const query = 'INSERT INTO doctors (name, email, specialty) VALUES (?, ?, ?)';
  db.query(query, [name, email, specialty], (err, results) => {
    if (err) {
      res.status(500).json({ error: err });
      return;
    }
    res.json({ success: true, doctorId: results.insertId });
  });
});

// Get doctor info
router.get('/:doctorId', (req, res) => {
  const { doctorId } = req.params;
  const query = 'SELECT * FROM doctors WHERE id = ?';
  db.query(query, [doctorId], (err, results) => {
    if (err) {
      res.status(500).json({ error: err });
      return;
    }
    res.json(results[0] || {});
  });
});

// Get all appointments for a doctor
router.get('/:doctorId/appointments', (req, res) => {
  const { doctorId } = req.params;
  const query = `
    SELECT a.*, c.name as clientName, c.email as clientEmail, c.phone
    FROM appointments a
    JOIN clients c ON a.clientId = c.id
    WHERE a.doctorId = ?
    ORDER BY a.appointmentDate DESC, a.appointmentTime DESC
  `;
  db.query(query, [doctorId], (err, results) => {
    if (err) {
      res.status(500).json({ error: err });
      return;
    }
    res.json(results);
  });
});

// Get pending appointments for a doctor
router.get('/:doctorId/appointments/pending', (req, res) => {
  const { doctorId } = req.params;
  const query = `
    SELECT a.*, c.name as clientName, c.email as clientEmail, c.phone
    FROM appointments a
    JOIN clients c ON a.clientId = c.id
    WHERE a.doctorId = ? AND a.status = 'pending'
    ORDER BY a.appointmentDate ASC, a.appointmentTime ASC
  `;
  db.query(query, [doctorId], (err, results) => {
    if (err) {
      res.status(500).json({ error: err });
      return;
    }
    res.json(results);
  });
});

// Get completed appointments for a doctor
router.get('/:doctorId/appointments/completed', (req, res) => {
  const { doctorId } = req.params;
  const query = `
    SELECT a.*, c.name as clientName, c.email as clientEmail, c.phone
    FROM appointments a
    JOIN clients c ON a.clientId = c.id
    WHERE a.doctorId = ? AND a.status = 'completed'
    ORDER BY a.appointmentDate DESC, a.appointmentTime DESC
  `;
  db.query(query, [doctorId], (err, results) => {
    if (err) {
      res.status(500).json({ error: err });
      return;
    }
    res.json(results);
  });
});

// Get reschedule requests for a doctor
router.get('/:doctorId/appointments/reschedule-requests', (req, res) => {
  const { doctorId } = req.params;
  const query = `
    SELECT a.*, c.name as clientName, c.email as clientEmail, c.phone
    FROM appointments a
    JOIN clients c ON a.clientId = c.id
    WHERE a.doctorId = ? AND a.status = 'reschedule_requested'
    ORDER BY a.created_at DESC
  `;
  db.query(query, [doctorId], (err, results) => {
    if (err) {
      res.status(500).json({ error: err });
      return;
    }
    res.json(results);
  });
});

// Accept an appointment
router.post('/:appointmentId/accept', (req, res) => {
  const { appointmentId } = req.params;
  const query = 'UPDATE appointments SET status = "accepted" WHERE id = ?';
  db.query(query, [appointmentId], (err, results) => {
    if (err) {
      res.status(500).json({ error: err });
      return;
    }
    res.json({ success: true });
  });
});

// Decline an appointment
router.post('/:appointmentId/decline', (req, res) => {
  const { appointmentId } = req.params;
  const query = 'UPDATE appointments SET status = "declined" WHERE id = ?';
  db.query(query, [appointmentId], (err, results) => {
    if (err) {
      res.status(500).json({ error: err });
      return;
    }
    res.json({ success: true });
  });
});

// Mark appointment as completed
router.post('/:appointmentId/complete', (req, res) => {
  const { appointmentId } = req.params;
  const query = 'UPDATE appointments SET status = "completed" WHERE id = ?';
  db.query(query, [appointmentId], (err, results) => {
    if (err) {
      res.status(500).json({ error: err });
      return;
    }
    res.json({ success: true });
  });
});

// Approve reschedule
router.post('/:appointmentId/approve-reschedule', (req, res) => {
  const { appointmentId } = req.params;
  const { newDate, newTime } = req.body;
  
  // Update appointment with new date/time and status to accepted
  const query = 'UPDATE appointments SET appointmentDate = ?, appointmentTime = ?, status = "accepted", rescheduleRequestedDate = NULL, rescheduleRequestedTime = NULL WHERE id = ?';
  db.query(query, [newDate, newTime, appointmentId], (err, results) => {
    if (err) {
      res.status(500).json({ error: err });
      return;
    }
    res.json({ success: true, message: 'Reschedule approved' });
  });
});

// Reject reschedule
router.post('/:appointmentId/reject-reschedule', (req, res) => {
  const { appointmentId } = req.params;
  const { reason } = req.body;
  
  // Update appointment to reset reschedule request
  const query = 'UPDATE appointments SET rescheduleRequestedDate = NULL, rescheduleRequestedTime = NULL, rescheduleReason = NULL, status = "accepted" WHERE id = ?';
  db.query(query, [appointmentId], (err, results) => {
    if (err) {
      res.status(500).json({ error: err });
      return;
    }
    res.json({ success: true, message: 'Reschedule rejected' });
  });
});

// Mark date as unavailable
router.post('/:doctorId/unavailable-date', (req, res) => {
  const { doctorId } = req.params;
  const { unavailableDate, reason } = req.body;
  const query = 'INSERT INTO unavailable_dates (doctorId, unavailableDate, reason) VALUES (?, ?, ?)';
  db.query(query, [doctorId, unavailableDate, reason], (err, results) => {
    if (err) {
      res.status(500).json({ error: err });
      return;
    }
    res.json({ success: true });
  });
});

// Get unavailable dates for a doctor
router.get('/:doctorId/unavailable-dates', (req, res) => {
  const { doctorId } = req.params;
  const query = 'SELECT * FROM unavailable_dates WHERE doctorId = ? ORDER BY unavailableDate DESC';
  db.query(query, [doctorId], (err, results) => {
    if (err) {
      res.status(500).json({ error: err });
      return;
    }
    res.json(results);
  });
});

// Get notifications for a doctor
router.get('/:doctorId/notifications', (req, res) => {
  const { doctorId } = req.params;
  const query = `
    SELECT n.*, a.appointmentDate, a.appointmentTime, c.name as clientName
    FROM notifications n
    LEFT JOIN appointments a ON n.appointmentId = a.id
    LEFT JOIN clients c ON a.clientId = c.id
    WHERE n.doctorId = ?
    ORDER BY n.created_at DESC
  `;
  db.query(query, [doctorId], (err, results) => {
    if (err) {
      res.status(500).json({ error: err });
      return;
    }
    res.json(results);
  });
});

// Mark notification as read
router.post('/:notificationId/read', (req, res) => {
  const { notificationId } = req.params;
  const query = 'UPDATE notifications SET isRead = TRUE WHERE id = ?';
  db.query(query, [notificationId], (err, results) => {
    if (err) {
      res.status(500).json({ error: err });
      return;
    }
    res.json({ success: true });
  });
});

// Remove unavailable date
router.delete('/:unavailableDateId/unavailable-date', (req, res) => {
  const { unavailableDateId } = req.params;
  const query = 'DELETE FROM unavailable_dates WHERE id = ?';
  db.query(query, [unavailableDateId], (err, results) => {
    if (err) {
      res.status(500).json({ error: err });
      return;
    }
    res.json({ success: true });
  });
});

module.exports = router;
