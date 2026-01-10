// Client Side JavaScript
let currentClientId = null;
let currentDoctorId = null;
let currentDoctorName = null;
let currentDoctorSpecialty = null;
let selectedDate = null;
let currentMonth = new Date();
let unavailableDates = [];

// Socket.io connection
const socket = io();

// Initialize client
$(document).ready(function() {
    // Generate or retrieve client ID
    currentClientId = localStorage.getItem('clientId') || generateClientId();
    localStorage.setItem('clientId', currentClientId);

    // Register client with socket
    socket.emit('register-client', currentClientId);

    // Load doctors
    loadDoctors();

    // Load appointments
    loadAppointments();

    // Initialize calendar
    renderCalendar();

    // Setup unavailable date listeners
    socket.on('unavailable-date-update', (data) => {
        loadUnavailableDatesForSelectedDoctor();
        renderCalendar();
    });

    // Listen for appointment status changes
    socket.on('appointment-status-changed', (appointmentData) => {
        if (appointmentData.clientId == currentClientId) {
            loadAppointments();
            showNotification(`Your appointment status has been updated to: ${appointmentData.status}`);
        }
    });

    // Listen for reschedule approval notification
    socket.on('reschedule-approved-notification', (data) => {
        loadAppointments();
        showNotification(`✅ Your reschedule request has been approved! New appointment: ${new Date(data.newDate).toLocaleDateString()} at ${data.newTime}`, 'success');
    });

    // Listen for reschedule rejection notification
    socket.on('reschedule-rejected-notification', (data) => {
        loadAppointments();
        showNotification(`❌ Your reschedule request has been rejected. ${data.reason ? 'Reason: ' + data.reason : ''}`, 'error');
    });
});

function generateClientId() {
    return 'client_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

// Load all doctors
function loadDoctors() {
    $.ajax({
        url: '/api/client/doctors',
        method: 'GET',
        success: function(doctors) {
            let html = '';
            doctors.forEach(doctor => {
                html += `
                    <div class="doctor-item" data-id="${doctor.id}" data-name="${doctor.name}" data-specialty="${doctor.specialty}" onclick="selectDoctor(${doctor.id}, '${doctor.name}', '${doctor.specialty}')">
                        <div class="doctor-name">${doctor.name}</div>
                        <div class="doctor-specialty">${doctor.specialty}</div>
                    </div>
                `;
            });
            $('#doctorList').html(html);
        },
        error: function(err) {
            console.error('Error loading doctors:', err);
            $('#doctorList').html('<p class="error">Failed to load doctors</p>');
        }
    });
}

// Select a doctor
function selectDoctor(doctorId, doctorName, doctorSpecialty) {
    currentDoctorId = doctorId;
    currentDoctorName = doctorName;
    currentDoctorSpecialty = doctorSpecialty;
    $('#selectedDoctorDisplay').val(doctorName);

    // Update active state
    $('.doctor-item').removeClass('active');
    event.target.closest('.doctor-item').classList.add('active');

    // Load unavailable dates for this doctor
    loadUnavailableDatesForSelectedDoctor();
    
    // Re-render calendar to show unavailable dates
    renderCalendar();
}

// Load unavailable dates
function loadUnavailableDatesForSelectedDoctor() {
    if (!currentDoctorId) return;

    $.ajax({
        url: `/api/client/doctor/${currentDoctorId}/unavailable-dates`,
        method: 'GET',
        success: function(dates) {
            unavailableDates = dates;
        },
        error: function(err) {
            console.error('Error loading unavailable dates:', err);
        }
    });
}

// Render Calendar
function renderCalendar() {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const monthYear = currentMonth.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });

    let html = `
        <div class="calendar-header">
            <h3>${monthYear}</h3>
            <div class="calendar-nav">
                <button onclick="previousMonth()">← Previous</button>
                <button onclick="nextMonth()">Next →</button>
            </div>
        </div>
        <div class="calendar-weekdays">
            <div class="weekday">Sun</div>
            <div class="weekday">Mon</div>
            <div class="weekday">Tue</div>
            <div class="weekday">Wed</div>
            <div class="weekday">Thu</div>
            <div class="weekday">Fri</div>
            <div class="weekday">Sat</div>
        </div>
        <div class="calendar-days">
    `;

    // Previous month's days
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    for (let i = startingDayOfWeek - 1; i >= 0; i--) {
        html += `<div class="calendar-day other-month">${prevMonthLastDay - i}</div>`;
    }

    // Current month's days
    const today = new Date();
    for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(year, month, day);
        const dateStr = formatDate(date);
        const isToday = date.toDateString() === today.toDateString();
        const isSelected = dateStr === selectedDate;
        const isPast = date < today && !isToday;
        const isUnavailable = unavailableDates.includes(dateStr);
        
        let classes = 'calendar-day';
        if (isToday) classes += ' today';
        if (isSelected) classes += ' selected';
        if (isPast || isUnavailable) classes += ' disabled';

        html += `<div class="calendar-day ${classes}" onclick="selectDate('${dateStr}', this)">${day}</div>`;
    }

    // Next month's days
    const totalCells = 42; // 6 weeks
    const cellsFilled = startingDayOfWeek + daysInMonth;
    const remainingCells = totalCells - cellsFilled;
    for (let i = 1; i <= remainingCells; i++) {
        html += `<div class="calendar-day other-month">${i}</div>`;
    }

    html += '</div>';
    $('#calendar').html(html);
}

function previousMonth() {
    currentMonth.setMonth(currentMonth.getMonth() - 1);
    renderCalendar();
}

function nextMonth() {
    currentMonth.setMonth(currentMonth.getMonth() + 1);
    renderCalendar();
}

function selectDate(dateStr, element) {
    if (element.classList.contains('disabled')) return;
    
    selectedDate = dateStr;
    $('#selectedDateDisplay').val(dateStr);
    
    // Update calendar
    $('.calendar-day').removeClass('selected');
    element.classList.add('selected');
}

// Handle booking form submission
// Show appointment summary before booking
function showAppointmentSummary() {
    if (!currentClientId || !currentDoctorId || !selectedDate) {
        showNotification('Please select a doctor and date first', 'error');
        return;
    }

    const appointmentTime = $('#appointmentTime').val();
    const reason = $('#reason').val();

    if (!appointmentTime || !reason) {
        showNotification('Please fill in all fields', 'error');
        return;
    }

    // Format date
    const dateObj = new Date(selectedDate);
    const formattedDate = dateObj.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

    // Format time to 12-hour format with AM/PM
    const [hours, minutes] = appointmentTime.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    const formattedTime = `${displayHour}:${minutes} ${ampm}`;

    // Update summary modal with current doctor info
    $('#summaryDoctor').text(currentDoctorName || '-');
    $('#summarySpecialty').text(currentDoctorSpecialty || '-');
    $('#summaryDate').text(formattedDate);
    $('#summaryTime').text(formattedTime);
    $('#summaryReason').text(reason);

    // Show modal
    $('#summaryModal').removeClass('hidden');
}

// Close summary modal
function closeSummary() {
    $('#summaryModal').addClass('hidden');
}

// Confirm booking after review
function confirmBooking() {
    const appointmentTime = $('#appointmentTime').val();
    const reason = $('#reason').val();

    $.ajax({
        url: '/api/client/book-appointment',
        method: 'POST',
        contentType: 'application/json',
        data: JSON.stringify({
            clientId: currentClientId,
            doctorId: currentDoctorId,
            appointmentDate: selectedDate,
            appointmentTime: appointmentTime,
            reason: reason
        }),
        success: function(response) {
            closeSummary();
            showNotification('✅ Appointment booked successfully!', 'success');
            
            // Notify doctor through socket
            socket.emit('appointment-booked', {
                clientId: currentClientId,
                doctorId: currentDoctorId,
                appointmentDate: selectedDate,
                appointmentTime: appointmentTime,
                appointmentId: response.appointmentId
            });

            // Reset form
            $('#bookingForm')[0].reset();
            $('#selectedDoctorDisplay').val('');
            $('#selectedDateDisplay').val('');
            selectedDate = null;
            
            // Reload appointments
            loadAppointments();
        },
        error: function(err) {
            showNotification('Error booking appointment. Time slot may be unavailable.', 'error');
            console.error('Booking error:', err);
        }
    });
}

function handleBooking(e) {
    e.preventDefault();
    // Form submission is handled by showAppointmentSummary() -> confirmBooking()
}

// Load client appointments
function loadAppointments() {
    if (!currentClientId) return;

    $.ajax({
        url: `/api/client/${currentClientId}/appointments`,
        method: 'GET',
        success: function(appointments) {
            let html = '';
            if (appointments.length === 0) {
                html = '<p class="loading">No appointments yet</p>';
            } else {
                appointments.forEach(apt => {
                    // Determine status class and label
                    let statusClass = `status-${apt.status}`;
                    let statusLabel = apt.status.charAt(0).toUpperCase() + apt.status.slice(1);
                    
                    const appointmentDate = new Date(apt.appointmentDate);
                    const now = new Date();
                    const hoursUntilAppointment = (appointmentDate - now) / (1000 * 60 * 60);
                    const canCancel = apt.status === 'pending' || apt.status === 'accepted';
                    const canReschedule = apt.status === 'pending' || apt.status === 'accepted';
                    const isPast = appointmentDate < now;
                    
                    html += `
                        <div class="appointment-card">
                            <div class="appointment-header">
                                <div>
                                    <div class="appointment-title">${apt.doctorName}</div>
                                    <div class="doctor-specialty">${apt.specialty}</div>
                                </div>
                                <span class="status-badge ${statusClass}">${statusLabel}</span>
                            </div>
                            <div class="appointment-details">
                                <div class="detail-row">
                                    <span class="detail-label">📅 Date:</span>
                                    <span>${appointmentDate.toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}</span>
                                </div>
                                <div class="detail-row">
                                    <span class="detail-label">⏰ Time:</span>
                                    <span>${apt.appointmentTime}</span>
                                </div>
                                <div class="detail-row">
                                    <span class="detail-label">📝 Reason:</span>
                                    <span>${apt.reason}</span>
                                </div>
                            </div>
                            <div class="appointment-actions">
                                ${!isPast && canCancel ? `<button class="btn btn-danger" onclick="confirmCancel(${apt.id}, '${apt.doctorName}')">🔴 Cancel</button>` : ''}
                                ${!isPast && canReschedule ? `<button class="btn btn-warning" onclick="openRescheduleModal(${apt.id}, '${appointmentDate.toLocaleDateString()}', '${apt.appointmentTime}')">🔄 Reschedule</button>` : ''}
                                <button class="btn btn-info" onclick="showCancellationPolicy()">📋 Policy</button>
                            </div>
                        </div>
                    `;
                });
            }
            $('#appointmentsList').html(html);
        },
        error: function(err) {
            console.error('Error loading appointments:', err);
            $('#appointmentsList').html('<p class="error">Failed to load appointments</p>');
        }
    });
}

// Tab switching
function switchTab(tabName) {
    $('.tab-content').removeClass('active');
    $('.tab-btn').removeClass('active');
    
    $(`#${tabName}`).addClass('active');
    event.target.classList.add('active');

    if (tabName === 'myAppointments') {
        loadAppointments();
    }
}

// Show notification
function showNotification(message, type = 'success') {
    const modal = $('#notificationModal');
    let html = `<div class="message ${type}">${message}</div>`;
    $('#notificationMessage').html(html);
    modal.removeClass('hidden');
    
    setTimeout(() => {
        modal.addClass('hidden');
    }, 3000);
}

function closeNotification() {
    $('#notificationModal').addClass('hidden');
}

function closeModal() {
    $('#popupModal').addClass('hidden');
}

// Cancel appointment
function confirmCancel(appointmentId, doctorName) {
    if (confirm(`Are you sure you want to cancel your appointment with ${doctorName}?\n\nNote: Cancellations made less than 24 hours before the appointment may incur a fee.`)) {
        cancelAppointment(appointmentId);
    }
}

function cancelAppointment(appointmentId) {
    $.ajax({
        url: `/api/client/${appointmentId}/cancel`,
        method: 'POST',
        contentType: 'application/json',
        data: JSON.stringify({ reason: 'Patient cancellation' }),
        success: function(response) {
            showNotification('Appointment cancelled successfully', 'success');
            loadAppointments();
            socket.emit('appointment-cancelled', { appointmentId: appointmentId });
        },
        error: function(err) {
            const errorMsg = err.responseJSON?.error || 'Failed to cancel appointment';
            showNotification(errorMsg, 'error');
        }
    });
}

// Reschedule appointment
let rescheduleAppointmentId = null;

function openRescheduleModal(appointmentId, currentDate, currentTime) {
    rescheduleAppointmentId = appointmentId;
    // Set minimum date to today
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('rescheduleDate').min = today;
    document.getElementById('rescheduleDate').value = '';
    document.getElementById('rescheduleTime').value = '';
    document.getElementById('rescheduleReason').value = '';
    document.getElementById('rescheduleModal').classList.remove('hidden');
}

function closeRescheduleModal() {
    document.getElementById('rescheduleModal').classList.add('hidden');
    rescheduleAppointmentId = null;
}

function submitReschedule(e) {
    e.preventDefault();
    
    if (!rescheduleAppointmentId) {
        showNotification('Error: No appointment selected', 'error');
        return;
    }

    const newDate = document.getElementById('rescheduleDate').value;
    const newTime = document.getElementById('rescheduleTime').value;
    const reason = document.getElementById('rescheduleReason').value;

    $.ajax({
        url: `/api/client/${rescheduleAppointmentId}/reschedule`,
        method: 'POST',
        contentType: 'application/json',
        data: JSON.stringify({
            newDate: newDate,
            newTime: newTime,
            reason: reason
        }),
        success: function(response) {
            showNotification('Reschedule request submitted! Doctor will review your request.', 'success');
            closeRescheduleModal();
            loadAppointments();
            socket.emit('reschedule-requested', { 
                appointmentId: rescheduleAppointmentId,
                newDate: newDate,
                newTime: newTime
            });
        },
        error: function(err) {
            const errorMsg = err.responseJSON?.error || 'Failed to request reschedule';
            showNotification(errorMsg, 'error');
        }
    });
}

// Cancellation Policy Modal
function showCancellationPolicy() {
    document.getElementById('cancellationPolicyModal').classList.remove('hidden');
}

function closeCancellationPolicy() {
    document.getElementById('cancellationPolicyModal').classList.add('hidden');
}

function logout() {
    // Clear all client-related data
    localStorage.removeItem('clientId');
    localStorage.removeItem('currentUser');
    localStorage.removeItem('users');
    
    // Disconnect socket
    socket.disconnect();
    
    // Redirect to home
    window.location.href = '/';
}

// Helper function to format date
function formatDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}
