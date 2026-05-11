async function renderAttendance(container) {
  try {
    // Fetch personal attendance data for all roles
    const todayRes = await api.getTodayAttendance();
    const logsRes = await api.getMyAttendance();

    const { checkedIn, checkedOut, attendance } = todayRes.data;
    const logs = logsRes.data;

    let widgetHtml = '';
    
    // checkedIn means currently in an active session
    // checkedOut doesn't really matter for the buttons now, but we use it
    
    const totalHoursHtml = attendance && attendance.workingHours > 0 
      ? `<div class="text-center p-2 mb-3" style="background: var(--bg-alt); border-radius: var(--border-radius-sm);">
          <div class="text-muted" style="font-size: 0.875rem;">Total Working Hours Today</div>
          <div style="font-size: 1.2rem; font-weight: 700; color: var(--text-main);">${attendance.workingHours}h</div>
         </div>`
      : '';

    if (checkedIn) {
      // User has an active session
      const checkInTime = attendance && attendance.checkIn ? new Date(attendance.checkIn).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : 'Active';
      widgetHtml = `
        ${totalHoursHtml}
        <div class="d-flex align-center justify-center gap-2 mb-4" style="color: var(--success-color); font-weight: 500;">
          <i class="fas fa-check-circle"></i> Checked In (Last: ${checkInTime})
        </div>
        <button class="btn btn-warning w-100" style="padding: 1rem; font-size: 1.1rem; color: #fff;" onclick="handleCheckInOut('out')">
          <i class="fas fa-sign-out-alt"></i> Check Out
        </button>
      `;
    } else {
      // User is not actively checked in
      widgetHtml = `
        ${totalHoursHtml}
        <div class="d-flex align-center justify-center gap-2 mb-4" style="color: var(--danger-color); font-weight: 500;">
          <i class="fas fa-circle"></i> Not Checked In
        </div>
        <button class="btn btn-success w-100" style="padding: 1rem; font-size: 1.1rem;" onclick="handleCheckInOut('in')">
          <i class="fas fa-sign-in-alt"></i> Check In
        </button>
      `;
    }

    // Build the personal check-in/out section (shown to ALL roles)
    let html = `
      <div class="page-header">
        <div class="page-title">
          <h2>${currentUser.role === 'employee' ? 'My Attendance' : 'Attendance'}</h2>
          <p>${currentUser.role === 'employee' ? 'Mark your daily attendance here' : 'Mark your attendance & monitor team presence'}</p>
        </div>
      </div>

      <div class="grid-2 mb-4">
        <div class="card h-100" style="margin-bottom: 0;">
          <div class="card-header">
            <h3>Today's Attendance</h3>
          </div>
          <div class="card-body text-center d-flex flex-column justify-center align-center">
            <div id="clockWidget" style="font-size: 3rem; font-weight: 700; color: var(--primary-color); font-variant-numeric: tabular-nums; letter-spacing: -1px; margin-bottom: 0.5rem;">--:--:--</div>
            <div class="text-muted mb-4" style="font-weight: 500;">${new Date().toLocaleDateString('en-US', {weekday:'long', month:'long', day:'numeric'})}</div>
            <div style="width: 100%; max-width: 300px; margin: 0 auto;">
              ${widgetHtml}
            </div>
          </div>
        </div>
        <div class="card h-100" style="margin-bottom: 0;">
          <div class="card-header">
            <h3>Attendance Rules</h3>
          </div>
          <div class="card-body">
            <ul class="custom-list">
              <li><i class="fas fa-map-marker-alt"></i> You must be within 100 meters of the office to check in.</li>
              <li><i class="fas fa-location-arrow"></i> Ensure location services are enabled on your browser.</li>
              <li><i class="fas fa-hourglass-half"></i> Less than 4 hours of work is considered a Half-Day.</li>
              <li><i class="fas fa-moon"></i> Forgot to checkout? System auto-closes at midnight.</li>
            </ul>
          </div>
        </div>
      </div>
    `;

    // For non-employee roles, add the team attendance management table
    if (currentUser.role !== 'employee') {
      try {
        const d = new Date();
        const todayStr = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
        const res = await api.getAllAttendance(todayStr);
        const teamLogs = res.data;

        html += `
          <div class="card">
            <div class="card-header">
              <h3><i class="fas fa-users" style="margin-right: 0.5rem; opacity: 0.7;"></i> Team Attendance — ${d.toLocaleDateString('en-US', {weekday:'long', month:'long', day:'numeric'})}</h3>
            </div>
            <div class="table-responsive">
              <table class="data-table">
                <thead>
                  <tr>
                    <th>Employee</th>
                    <th>Check In</th>
                    <th>Check Out</th>
                    <th>Hours</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  ${teamLogs.map(log => `
                    <tr>
                      <td>
                        <div class="d-flex align-center gap-2">
                          <div class="user-avatar-sm" style="background: var(--primary-light); color: var(--primary-color);">
                            ${log.employeeId.userId.name.substring(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <div style="font-weight: 600;">${log.employeeId.userId.name}</div>
                            <div class="text-muted" style="font-size: 0.75rem;">${log.employeeId.userId.email}</div>
                          </div>
                        </div>
                      </td>
                      <td>${log.checkIn ? new Date(log.checkIn).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'}) : '-'}</td>
                      <td>${log.checkOut ? new Date(log.checkOut).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'}) : '-'}</td>
                      <td style="font-weight: 600;">${log.workingHours || '-'}</td>
                      <td><span class="badge badge-${getStatusColor(log.status)}">${log.status}</span></td>
                    </tr>
                  `).join('') || '<tr><td colspan="5" class="text-center text-muted p-5">No logs for today yet</td></tr>'}
                </tbody>
              </table>
            </div>
          </div>
        `;
      } catch (teamErr) {
        html += `<div class="auth-alert error"><i class="fas fa-exclamation-circle"></i> Could not load team logs: ${teamErr.message}</div>`;
      }
    } else {
      // Employee: show personal recent logs table
      html += `
        <div class="card">
          <div class="card-header">
            <h3>Recent Logs</h3>
          </div>
          <div class="table-responsive">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Check In</th>
                  <th>Check Out</th>
                  <th>Hours</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                ${logs.slice(0, 10).map(log => `
                  <tr>
                    <td style="font-weight: 500;">${new Date(log.date).toLocaleDateString('en-US', {month: 'short', day: 'numeric', year: 'numeric'})}</td>
                    <td>${log.checkIn ? new Date(log.checkIn).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'}) : '-'}</td>
                    <td>${log.checkOut ? new Date(log.checkOut).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'}) : '-'}</td>
                    <td style="font-weight: 600;">${log.workingHours || '-'}</td>
                    <td><span class="badge badge-${getStatusColor(log.status)}">${log.status}</span></td>
                  </tr>
                `).join('') || '<tr><td colspan="5" class="text-center text-muted p-4">No logs found</td></tr>'}
              </tbody>
            </table>
          </div>
        </div>
      `;
    }

    container.innerHTML = html;

    // Start clock
    const clockInterval = setInterval(() => {
      const el = document.getElementById('clockWidget');
      if (el) {
        el.textContent = new Date().toLocaleTimeString('en-US', {hour12: false});
      } else {
        clearInterval(clockInterval);
      }
    }, 1000);

  } catch (e) {
    container.innerHTML = `<div class="auth-alert error"><i class="fas fa-exclamation-circle"></i> ${e.message}</div>`;
  }
}

function getStatusColor(status) {
  const map = { present: 'success', absent: 'danger', 'half-day': 'warning', 'on-leave': 'primary' };
  return map[status] || 'secondary';
}

async function handleCheckInOut(action) {
  if (!navigator.geolocation) {
    alert('Geolocation is not supported by your browser.');
    return;
  }
  
  const btn = document.querySelector('.card-body button.btn');
  const originalHtml = btn.innerHTML;
  btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
  btn.disabled = true;

  navigator.geolocation.getCurrentPosition(
    async (position) => {
      try {
        const { latitude, longitude } = position.coords;
        if (action === 'in') await api.checkIn(latitude, longitude);
        else await api.checkOut(latitude, longitude);
        
        // Refresh view
        renderAttendance(document.getElementById('contentArea'));
      } catch (e) {
        alert(e.message);
        btn.innerHTML = originalHtml;
        btn.disabled = false;
      }
    },
    (error) => {
      alert('Error getting location: ' + error.message);
      btn.innerHTML = originalHtml;
      btn.disabled = false;
    },
    { enableHighAccuracy: true }
  );
}

// Ensure utility styles
if (!document.getElementById('attendance-styles')) {
  const style = document.createElement('style');
  style.id = 'attendance-styles';
  style.textContent = `
    .custom-list {
      list-style: none;
      padding: 0;
      margin: 0;
    }
    .custom-list li {
      padding: 0.75rem 0;
      border-bottom: 1px solid var(--border-color);
      display: flex;
      align-items: flex-start;
      gap: 12px;
      color: var(--text-main);
    }
    .custom-list li:last-child {
      border-bottom: none;
    }
    .custom-list li i {
      color: var(--primary-color);
      margin-top: 4px;
      width: 16px;
      text-align: center;
    }
  `;
  document.head.appendChild(style);
}
