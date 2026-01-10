const mysql = require('mysql');

const connection = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'booking_system'
});

connection.connect((err) => {
  if (err) {
    console.error('Database connection failed:', err);
    return;
  }
  console.log('MySQL Connected!');
});

// Create tables if they don't exist
const createTables = () => {
  // Doctors table
  connection.query(`
    CREATE TABLE IF NOT EXISTS doctors (
       id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      email VARCHAR(255) NOT NULL UNIQUE,
      specialty VARCHAR(255) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `, (err) => {
    if (err) console.error(err);
    else console.log('Doctors table created or exists');
  });

  // Clients table
  connection.query(`
    CREATE TABLE IF NOT EXISTS clients (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      email VARCHAR(255) NOT NULL UNIQUE,
      phone VARCHAR(20),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `, (err) => {
    if (err) console.error(err);
    else console.log('Clients table created or exists');
  });

  // Appointments table
  connection.query(`
    CREATE TABLE IF NOT EXISTS appointments (
      id INT AUTO_INCREMENT PRIMARY KEY,
      clientId INT NOT NULL,
      doctorId INT NOT NULL,
      appointmentDate DATE NOT NULL,
      appointmentTime TIME NOT NULL,
      reason VARCHAR(500),
      status ENUM('pending', 'accepted', 'declined', 'completed', 'cancelled', 'reschedule_requested') DEFAULT 'pending',
      rescheduleRequestedDate DATE,
      rescheduleRequestedTime TIME,
      rescheduleReason VARCHAR(500),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (clientId) REFERENCES clients(id),
      FOREIGN KEY (doctorId) REFERENCES doctors(id)
    )
  `, (err) => {
    if (err) console.error(err);
    else console.log('Appointments table created or exists');
  });

  // Unavailable Dates table
  connection.query(`
    CREATE TABLE IF NOT EXISTS unavailable_dates (
      id INT AUTO_INCREMENT PRIMARY KEY,
      doctorId INT NOT NULL,
      unavailableDate DATE NOT NULL,
      reason VARCHAR(500),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (doctorId) REFERENCES doctors(id)
    )
  `, (err) => {
    if (err) console.error(err);
    else console.log('Unavailable_dates table created or exists');
  });

  // Notifications table
  connection.query(`
    CREATE TABLE IF NOT EXISTS notifications (
      id INT AUTO_INCREMENT PRIMARY KEY,
      doctorId INT NOT NULL,
      appointmentId INT,
      message VARCHAR(500),
      isRead BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (doctorId) REFERENCES doctors(id),
      FOREIGN KEY (appointmentId) REFERENCES appointments(id)
    )
  `, (err) => {
    if (err) console.error(err);
    else console.log('Notifications table created or exists');
  });
};

createTables();

module.exports = connection;
