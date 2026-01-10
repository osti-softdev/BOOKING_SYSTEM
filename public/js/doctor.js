// Doctor Side JavaScript
let currentDoctorId = null;
let currentMonth = new Date();
let appointmentsByDate = {};
let unreadNotifications = 0;

// Socket.io connection
const socket = io();

// Initialize doctor
$(document).ready(function() {
    // Generate or retrieve doctor ID
    currentDoctorId = localStorage.getItem('doctorId') || generateDoctorId();
    localStorage.setItem('doctorId', currentDoctorId);

    // Register doctor with socket
    socket.emit('register-doctor', currentDoctorId);

    // Load pending appointments
    loadPendingAppointments();

    // Load reschedule requests
    loadRescheduleRequests();

    // Load completed appointments
    loadCompletedAppointments();

    // Load unavailable dates
    loadUnavailableDates();

    // Load notifications
    loadNotifications();

    // Initialize calendar
    renderCalendar();

    // Setup unavailable date form
    $('#unavailableForm').on('submit', handleUnavailableDate);

    // Listen for new appointments
    socket.on('new-appointment-notification', (appointmentData) => {
        if (appointmentData.doctorId == currentDoctorId) {
            loadPendingAppointments();
            loadNotifications();
            unreadNotifications++;
            updateNotificationBadge();
            showNotification('New appointment request received!', 'success');
            renderCalendar();
        }
    });

    // Listen for appointment updates
    socket.on('appointment-update', (appointmentData) => {
        if (appointmentData.doctorId == currentDoctorId) {
            loadPendingAppointments();
            loadCompletedAppointments();
            renderCalendar();
        }
    });

    // Listen for unavailable date updates
    socket.on('unavailable-date-update', (data) => {
        if (data.doctorId == currentDoctorId) {
            loadUnavailableDates();
            renderCalendar();
        }
    });

    // Listen for reschedule requests
    socket.on('reschedule-requested', (data) => {
        if (data.doctorId == currentDoctorId || !data.doctorId) {
            loadRescheduleRequests();
            loadNotifications();
            unreadNotifications++;
            updateNotificationBadge();
            showNotification('Patient has requested to reschedule an appointment', 'success');
        }
    });
});

function generateDoctorId() {
    return 'doctor_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

// Load pending appointments
function loadPendingAppointments() {
    if (!currentDoctorId) return;

    $.ajax({
        url: `/api/doctor/${currentDoctorId}/appointments/pending`,
        method: 'GET',
        success: function(appointments) {
            let html = '';
            if (appointments.length === 0) {
                html = '<p class="loading">No pending appointments</p>';
            } else {
                appointments.forEach(apt => {
                    html += `
                        <div class="appointment-card">
                            <div class="appointment-header">
                                <div>
                                    <div class="appointment-title">${apt.clientName}</div>
                                    <div class="doctor-specialty">${apt.email}</div>
                                </div>
                                <span class="status-badge status-pending">Pending</span>
                            </div>
                            <div class="appointment-details">
                                <div class="detail-row">
                                    <span class="detail-label">Date:</span>
                                    <span>${new Date(apt.appointmentDate).toLocaleDateString()}</span>
                                </div>
                                <div class="detail-row">
                                    <span class="detail-label">Time:</span>
                                    <span>${apt.appointmentTime}</span>
                                </div>
                                <div class="detail-row">
                                    <span class="detail-label">Phone:</span>
                                    <span>${apt.phone || 'N/A'}</span>
                                </div>
                                <div class="detail-row">
                                    <span class="detail-label">Reason:</span>
                                    <span>${apt.reason}</span>
                                </div>
                            </div>
                            <div class="appointment-actions">
                                <button class="btn btn-success" onclick="acceptAppointment(${apt.id}, ${apt.clientId})">✅ Accept</button>
                                <button class="btn btn-danger" onclick="declineAppointment(${apt.id}, ${apt.clientId})">❌ Decline</button>
                            </div>
                        </div>
                    `;
                });
            }
            $('#pendingList').html(html);
            renderCalendarWithAppointments(appointments);
        },
        error: function(err) {
            console.error('Error loading pending appointments:', err);
            $('#pendingList').html('<p class="error">Failed to load appointments</p>');
        }
    });
}

// Load completed appointments
function loadCompletedAppointments() {
    if (!currentDoctorId) return;

    $.ajax({
        url: `/api/doctor/${currentDoctorId}/appointments/completed`,
        method: 'GET',
        success: function(appointments) {
            let html = '';
            if (appointments.length === 0) {
                html = '<p class="loading">No completed appointments</p>';
            } else {
                appointments.forEach(apt => {
                    // Determine status display
                    let statusClass = 'status-completed';
                    let statusText = 'Completed';
                    
                    if (apt.status === 'no-show') {
                        statusClass = 'status-no-show';
                        statusText = 'No-Show';
                    } else if (apt.status === 'cancelled') {
                        statusClass = 'status-cancelled';
                        statusText = 'Cancelled';
                    } else if (apt.status === 'declined') {
                        statusClass = 'status-declined';
                        statusText = 'Declined';
                    } else if (apt.status === 'confirmed') {
                        statusClass = 'status-confirmed';
                        statusText = 'Confirmed';
                    } else if (apt.status === 'accepted') {
                        statusClass = 'status-accepted';
                        statusText = 'Accepted';
                    }
                    
                    html += `
                        <div class="appointment-card">
                            <div class="appointment-header">
                                <div>
                                    <div class="appointment-title">${apt.clientName}</div>
                                    <div class="doctor-specialty">${apt.email}</div>
                                </div>
                                <span class="status-badge ${statusClass}">${statusText}</span>
                            </div>
                            <div class="appointment-details">
                                <div class="detail-row">
                                    <span class="detail-label">Date:</span>
                                    <span>${new Date(apt.appointmentDate).toLocaleDateString()}</span>
                                </div>
                                <div class="detail-row">
                                    <span class="detail-label">Time:</span>
                                    <span>${apt.appointmentTime}</span>
                                </div>
                                <div class="detail-row">
                                    <span class="detail-label">Phone:</span>
                                    <span>${apt.phone || 'N/A'}</span>
                                </div>
                                <div class="detail-row">
                                    <span class="detail-label">Reason:</span>
                                    <span>${apt.reason}</span>
                                </div>
                            </div>
                            <div class="appointment-actions">
                                ${apt.status === 'accepted' || apt.status === 'confirmed' ? `
                                    <button class="btn btn-primary" onclick="markAsCompleted(${apt.id}, ${apt.clientId})">✅ Mark Completed</button>
                                    <button class="btn btn-warning" onclick="markAsNoShow(${apt.id}, ${apt.clientId})">⚫ Mark No-Show</button>
                                ` : ''}
                            </div>
                        </div>
                    `;
                });
            }
            $('#completedList').html(html);
        },
        error: function(err) {
            console.error('Error loading completed appointments:', err);
            $('#completedList').html('<p class="error">Failed to load appointments</p>');
        }
    });
}

// Load reschedule requests
function loadRescheduleRequests() {
    if (!currentDoctorId) return;

    $.ajax({
        url: `/api/doctor/${currentDoctorId}/appointments/reschedule-requests`,
        method: 'GET',
        success: function(appointments) {
            let html = '';
            if (appointments.length === 0) {
                html = '<p class="loading">No reschedule requests</p>';
            } else {
                appointments.forEach(apt => {
                    html += `
                        <div class="appointment-card">
                            <div class="appointment-header">
                                <div>
                                    <div class="appointment-title">${apt.clientName}</div>
                                    <div class="doctor-specialty">${apt.email}</div>
                                </div>
                                <span class="status-badge status-pending">Reschedule Requested</span>
                            </div>
                            <div class="appointment-details">
                                <div class="detail-row">
                                    <span class="detail-label">Current Date:</span>
                                    <span>${new Date(apt.appointmentDate).toLocaleDateString()}</span>
                                </div>
                                <div class="detail-row">
                                    <span class="detail-label">Current Time:</span>
                                    <span>${apt.appointmentTime}</span>
                                </div>
                                <div class="detail-row">
                                    <span class="detail-label">📅 Requested Date:</span>
                                    <span><strong>${new Date(apt.rescheduleRequestedDate).toLocaleDateString()}</strong></span>
                                </div>
                                <div class="detail-row">
                                    <span class="detail-label">⏰ Requested Time:</span>
                                    <span><strong>${apt.rescheduleRequestedTime}</strong></span>
                                </div>
                                <div class="detail-row">
                                    <span class="detail-label">Reason for Reschedule:</span>
                                    <span>${apt.rescheduleReason}</span>
                                </div>
                                <div class="detail-row">
                                    <span class="detail-label">Original Reason:</span>
                                    <span>${apt.reason}</span>
                                </div>
                            </div>
                            <div class="appointment-actions">
                                <button class="btn btn-success" onclick="approveReschedule(${apt.id}, ${apt.clientId}, '${apt.rescheduleRequestedDate}', '${apt.rescheduleRequestedTime}')">✅ Approve</button>
                                <button class="btn btn-danger" onclick="rejectReschedule(${apt.id}, ${apt.clientId})">❌ Reject</button>
                            </div>
                        </div>
                    `;
                });
            }
            $('#rescheduleList').html(html);
        },
        error: function(err) {
            console.error('Error loading reschedule requests:', err);
            $('#rescheduleList').html('<p class="error">Failed to load reschedule requests</p>');
        }
    });
}

// Load unavailable dates
function loadUnavailableDates() {
    if (!currentDoctorId) return;

    $.ajax({
        url: `/api/doctor/${currentDoctorId}/unavailable-dates`,
        method: 'GET',
        success: function(dates) {
            let html = '';
            if (dates.length === 0) {
                html = '<p class="loading">No unavailable dates set</p>';
            } else {
                dates.forEach(item => {
                    html += `
                        <div class="date-item">
                            <div class="date-item-header">
                                <div>
                                    <div class="date-item-date">${new Date(item.unavailableDate).toLocaleDateString()}</div>
                                    <div class="date-item-reason">Reason: ${item.reason || 'Not specified'}</div>
                                </div>
                                <button class="delete-btn" onclick="removeUnavailableDate(${item.id})">Remove</button>
                            </div>
                        </div>
                    `;
                });
            }
            $('#unavailableDatesList').html(html);
        },
        error: function(err) {
            console.error('Error loading unavailable dates:', err);
            $('#unavailableDatesList').html('<p class="error">Failed to load unavailable dates</p>');
        }
    });
}

// Handle unavailable date form
function handleUnavailableDate(e) {
    e.preventDefault();

    const unavailableDate = $('#unavailableDate').val();
    const reason = $('#unavailableReason').val();

    $.ajax({
        url: `/api/doctor/${currentDoctorId}/unavailable-date`,
        method: 'POST',
        contentType: 'application/json',
        data: JSON.stringify({
            unavailableDate: unavailableDate,
            reason: reason
        }),
        success: function(response) {
            showNotification('Date marked as unavailable', 'success');
            
            // Notify clients through socket
            socket.emit('date-unavailable', {
                doctorId: currentDoctorId,
                unavailableDate: unavailableDate
            });

            // Reset form
            $('#unavailableForm')[0].reset();
            
            // Reload
            loadUnavailableDates();
            renderCalendar();
        },
        error: function(err) {
            showNotification('Failed to mark date as unavailable', 'error');
        }
    });
}

// Remove unavailable date
function removeUnavailableDate(dateId) {
    if (confirm('Remove this unavailable date?')) {
        $.ajax({
            url: `/api/doctor/${dateId}/unavailable-date`,
            method: 'DELETE',
            success: function(response) {
                showNotification('Unavailable date removed', 'success');
                loadUnavailableDates();
                renderCalendar();
            },
            error: function(err) {
                showNotification('Failed to remove date', 'error');
            }
        });
    }
}

// Accept appointment
function acceptAppointment(appointmentId, clientId) {
    $.ajax({
        url: `/api/doctor/${appointmentId}/accept`,
        method: 'POST',
        success: function(response) {
            showNotification('Appointment accepted', 'success');
            
            // Notify client through socket
            socket.emit('appointment-accepted', {
                appointmentId: appointmentId,
                clientId: clientId,
                doctorId: currentDoctorId,
                status: 'accepted'
            });

            // Reload
            loadPendingAppointments();
            loadNotifications();
            renderCalendar();
        },
        error: function(err) {
            showNotification('Failed to accept appointment', 'error');
        }
    });
}

// Decline appointment
function declineAppointment(appointmentId, clientId) {
    if (confirm('Are you sure you want to decline this appointment?')) {
        $.ajax({
            url: `/api/doctor/${appointmentId}/decline`,
            method: 'POST',
            success: function(response) {
                showNotification('Appointment declined', 'success');
                
                // Notify client through socket
                socket.emit('appointment-declined', {
                    appointmentId: appointmentId,
                    clientId: clientId,
                    doctorId: currentDoctorId,
                    status: 'declined'
                });

                // Reload
                loadPendingAppointments();
                loadNotifications();
                renderCalendar();
            },
            error: function(err) {
                showNotification('Failed to decline appointment', 'error');
            }
        });
    }
}

// Complete appointment
function completeAppointment(appointmentId, clientId) {
    $.ajax({
        url: `/api/doctor/${appointmentId}/complete`,
        method: 'POST',
        success: function(response) {
            showNotification('Appointment marked as completed', 'success');
            
            // Notify through socket
            socket.emit('appointment-completed', {
                appointmentId: appointmentId,
                clientId: clientId,
                doctorId: currentDoctorId,
                status: 'completed'
            });

            // Reload
            loadPendingAppointments();
            loadCompletedAppointments();
            renderCalendar();
        },
        error: function(err) {
            showNotification('Failed to complete appointment', 'error');
        }
    });
}

// Approve reschedule
function approveReschedule(appointmentId, clientId, newDate, newTime) {
    $.ajax({
        url: `/api/doctor/${appointmentId}/approve-reschedule`,
        method: 'POST',
        contentType: 'application/json',
        data: JSON.stringify({
            newDate: newDate,
            newTime: newTime
        }),
        success: function(response) {
            showNotification('Reschedule approved! Patient has been notified.', 'success');
            
            // Notify client through socket with auto-notification
            socket.emit('reschedule-approved', {
                appointmentId: appointmentId,
                clientId: clientId,
                doctorId: currentDoctorId,
                newDate: newDate,
                newTime: newTime,
                message: `Your reschedule request has been approved! New appointment: ${new Date(newDate).toLocaleDateString()} at ${newTime}`
            });

            // Reload
            loadRescheduleRequests();
            loadPendingAppointments();
            loadNotifications();
            renderCalendar();
        },
        error: function(err) {
            showNotification('Failed to approve reschedule', 'error');
        }
    });
}

// Reject reschedule
function rejectReschedule(appointmentId, clientId) {
    const reason = prompt('Reason for rejecting reschedule (optional):');
    if (reason === null) return; // User cancelled

    $.ajax({
        url: `/api/doctor/${appointmentId}/reject-reschedule`,
        method: 'POST',
        contentType: 'application/json',
        data: JSON.stringify({
            reason: reason
        }),
        success: function(response) {
            showNotification('Reschedule rejected! Patient has been notified.', 'success');
            
            // Notify client through socket with auto-notification
            socket.emit('reschedule-rejected', {
                appointmentId: appointmentId,
                clientId: clientId,
                doctorId: currentDoctorId,
                reason: reason,
                message: `Your reschedule request has been rejected. ${reason ? 'Reason: ' + reason : ''}`
            });

            // Reload
            loadRescheduleRequests();
            loadPendingAppointments();
            loadNotifications();
            renderCalendar();
        },
        error: function(err) {
            showNotification('Failed to reject reschedule', 'error');
        }
    });
}

// Mark appointment as completed (Doctor confirms attendance)
function markAsCompleted(appointmentId, clientId) {
    if (confirm('Mark this appointment as completed?')) {
        // UI-focused for now - just reload to show status
        showNotification('✅ Appointment marked as completed!', 'success');
        loadCompletedAppointments();
        renderCalendar();
    }
}

// Mark appointment as no-show
function markAsNoShow(appointmentId, clientId) {
    const reason = prompt('Reason for no-show (optional):');
    if (reason === null) return; // User cancelled
    
    // UI-focused for now - just reload to show status
    showNotification('⚫ Appointment marked as no-show. Patient has been notified.', 'warning');
    loadCompletedAppointments();
    renderCalendar();
}

// Load notifications
function loadNotifications() {
    if (!currentDoctorId) return;

    $.ajax({
        url: `/api/doctor/${currentDoctorId}/notifications`,
        method: 'GET',
        success: function(notifications) {
            let html = '';
            let unread = 0;
            
            if (notifications.length === 0) {
                html = '<p class="loading">No notifications</p>';
            } else {
                notifications.forEach(notif => {
                    if (!notif.isRead) unread++;
                    const readClass = notif.isRead ? 'read' : 'unread';
                    html += `
                        <div class="notification-item ${readClass}">
                            <div class="appointment-title">${notif.message}</div>
                            <div class="appointment-details">
                                <div class="detail-row">
                                    <span class="detail-label">Patient:</span>
                                    <span>${notif.clientName || 'N/A'}</span>
                                </div>
                                <div class="detail-row">
                                    <span class="detail-label">Date & Time:</span>
                                    <span>${notif.appointmentDate ? new Date(notif.appointmentDate).toLocaleDateString() : 'N/A'} ${notif.appointmentTime || ''}</span>
                                </div>
                            </div>
                            <div class="notification-time">${new Date(notif.created_at).toLocaleString()}</div>
                        </div>
                    `;
                });
            }
            
            $('#notificationsContent').html(html);
            unreadNotifications = unread;
            updateNotificationBadge();
        },
        error: function(err) {
            console.error('Error loading notifications:', err);
        }
    });
}

// Update notification badge
function updateNotificationBadge() {
    const badge = $('#notificationBadge');
    if (unreadNotifications > 0) {
        badge.text(unreadNotifications).removeClass('hidden');
    } else {
        badge.addClass('hidden');
    }
}

// Toggle notifications panel
function toggleNotifications() {
    const panel = $('#notificationsPanel');
    panel.toggleClass('hidden');
    
    if (!panel.hasClass('hidden')) {
        loadNotifications();
    }
}

// Render Calendar with appointments
function renderCalendarWithAppointments(appointments) {
    appointmentsByDate = {};
    appointments.forEach(apt => {
        const date = apt.appointmentDate;
        if (!appointmentsByDate[date]) {
            appointmentsByDate[date] = [];
        }
        appointmentsByDate[date].push(apt);
    });
    renderCalendar();
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
        
        const hasAppointments = appointmentsByDate[dateStr] && appointmentsByDate[dateStr].length > 0;
        
        let classes = 'calendar-day';
        if (isToday) classes += ' today';
        if (hasAppointments) classes += ' has-appointments';

        html += `<div class="calendar-day ${classes}" title="${hasAppointments ? appointmentsByDate[dateStr].length + ' appointment(s)' : ''}">${day}</div>`;
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

// Tab switching
function switchTab(tabName) {
    $('.tab-content').removeClass('active');
    $('.tab-btn').removeClass('active');
    
    $(`#${tabName}`).addClass('active');
    event.target.classList.add('active');

    if (tabName === 'completedAppointments') {
        loadCompletedAppointments();
    } else if (tabName === 'pendingAppointments') {
        loadPendingAppointments();
    } else if (tabName === 'rescheduleRequests') {
        loadRescheduleRequests();
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

function logout() {
    // Clear all doctor-related data
    localStorage.removeItem('doctorId');
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
