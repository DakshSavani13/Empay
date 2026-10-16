import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

function getStatusColor(status) {
  const map = { present: 'success', absent: 'danger', 'half-day': 'warning', 'on-leave': 'primary' };
  return map[status] || 'secondary';
}

export default function AttendancePage() {
  const { user } = useAuth();
  const [todayData, setTodayData] = useState(null);
  const [logs, setLogs] = useState([]);
  const [teamLogs, setTeamLogs] = useState([]);
  const [teamError, setTeamError] = useState(null);
  const [error, setError] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [clock, setClock] = useState('--:--:--');
  const clockRef = useRef(null);

  const loadData = async () => {
    try {
      const [todayRes, logsRes] = await Promise.all([
        api.getTodayAttendance(),
        api.getMyAttendance()
      ]);
      setTodayData(todayRes.data);
      setLogs(logsRes.data);

      if (user.role !== 'employee') {
        try {
          const d = new Date();
          const todayStr = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
          const res = await api.getAllAttendance(todayStr);
          setTeamLogs(res.data);
        } catch (e) {
          setTeamError(e.message);
        }
      }
    } catch (e) {
      setError(e.message);
    }
  };

  useEffect(() => {
    loadData();
    clockRef.current = setInterval(() => {
      setClock(new Date().toLocaleTimeString('en-US', { hour12: false }));
    }, 1000);
    return () => clearInterval(clockRef.current);
  }, []);

  const handleCheckInOut = (action) => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }
    setProcessing(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          if (action === 'in') await api.checkIn(latitude, longitude);
          else await api.checkOut(latitude, longitude);
          loadData();
        } catch (e) {
          alert(e.message);
        } finally {
          setProcessing(false);
        }
      },
      (err) => {
        alert('Error getting location: ' + err.message);
        setProcessing(false);
      },
      { enableHighAccuracy: true }
    );
  };

  if (error) return <div className="auth-alert error"><i className="fas fa-exclamation-circle"></i> {error}</div>;
  if (!todayData) return <div className="empty-state"><div className="spinner spinner-primary"></div><p>Loading...</p></div>;

  const { checkedIn, attendance } = todayData;
  const totalHoursHtml = attendance && attendance.workingHours > 0;
  const checkInTime = attendance && attendance.checkIn ? new Date(attendance.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Active';

  return (
    <>
      <div className="page-header">
        <div className="page-title">
          <h2>{user.role === 'employee' ? 'My Attendance' : 'Attendance'}</h2>
          <p>{user.role === 'employee' ? 'Mark your daily attendance here' : 'Mark your attendance & monitor team presence'}</p>
        </div>
      </div>

      <div className="grid-2 mb-4">
        <div className="card h-100" style={{ marginBottom: 0 }}>
          <div className="card-header"><h3>Today's Attendance</h3></div>
          <div className="card-body text-center d-flex flex-column justify-center align-center">
            <div style={{ fontSize: '3rem', fontWeight: 700, color: 'var(--primary-color)', fontVariantNumeric: 'tabular-nums', letterSpacing: '-1px', marginBottom: '0.5rem' }}>
              {clock}
            </div>
            <div className="text-muted mb-4" style={{ fontWeight: 500 }}>
              {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
            </div>
            <div style={{ width: '100%', maxWidth: 300, margin: '0 auto' }}>
              {totalHoursHtml && (
                <div className="text-center p-2 mb-3" style={{ background: 'var(--bg-alt)', borderRadius: 'var(--border-radius-sm)' }}>
                  <div className="text-muted" style={{ fontSize: '0.875rem' }}>Total Working Hours Today</div>
                  <div style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-main)' }}>{attendance.workingHours}h</div>
                </div>
              )}
              {checkedIn ? (
                <>
                  <div className="d-flex align-center justify-center gap-2 mb-4" style={{ color: 'var(--success-color)', fontWeight: 500 }}>
                    <i className="fas fa-check-circle"></i> Checked In (Last: {checkInTime})
                  </div>
                  <button className="btn btn-warning w-100" style={{ padding: '1rem', fontSize: '1.1rem', color: '#fff' }} onClick={() => handleCheckInOut('out')} disabled={processing}>
                    <i className="fas fa-sign-out-alt"></i> {processing ? 'Processing...' : 'Check Out'}
                  </button>
                </>
              ) : (
                <>
                  <div className="d-flex align-center justify-center gap-2 mb-4" style={{ color: 'var(--danger-color)', fontWeight: 500 }}>
                    <i className="fas fa-circle"></i> Not Checked In
                  </div>
                  <button className="btn btn-success w-100" style={{ padding: '1rem', fontSize: '1.1rem' }} onClick={() => handleCheckInOut('in')} disabled={processing}>
                    <i className="fas fa-sign-in-alt"></i> {processing ? 'Processing...' : 'Check In'}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="card h-100" style={{ marginBottom: 0 }}>
          <div className="card-header"><h3>Attendance Rules</h3></div>
          <div className="card-body">
            <ul className="custom-list">
              <li><i className="fas fa-map-marker-alt"></i> <span>You must be within 100 meters of the office to check in.</span></li>
              <li><i className="fas fa-location-arrow"></i> <span>Ensure location services are enabled on your browser.</span></li>
              <li><i className="fas fa-hourglass-half"></i> <span>Less than 4 hours of work is considered a Half-Day.</span></li>
              <li><i className="fas fa-moon"></i> <span>Forgot to checkout? System auto-closes at midnight.</span></li>
            </ul>
          </div>
        </div>
      </div>

      {/* Team or Personal Logs */}
      {user.role !== 'employee' ? (
        <div className="card">
          <div className="card-header">
            <h3><i className="fas fa-users" style={{ marginRight: '0.5rem', opacity: 0.7 }}></i> Team Attendance — {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</h3>
          </div>
          {teamError ? (
            <div className="auth-alert error"><i className="fas fa-exclamation-circle"></i> Could not load team logs: {teamError}</div>
          ) : (
            <div className="table-responsive">
              <table className="data-table">
                <thead>
                  <tr><th>Employee</th><th>Check In</th><th>Check Out</th><th>Hours</th><th>Status</th></tr>
                </thead>
                <tbody>
                  {teamLogs.length > 0 ? teamLogs.map((log, i) => (
                    <tr key={i}>
                      <td>
                        <div className="d-flex align-center gap-2">
                          <div className="user-avatar-sm" style={{ background: 'var(--primary-light)', color: 'var(--primary-color)' }}>
                            {log.employeeId?.userId?.name?.substring(0, 2).toUpperCase() || 'U'}
                          </div>
                          <div>
                            <div style={{ fontWeight: 600 }}>{log.employeeId?.userId?.name || 'Unknown'}</div>
                            <div className="text-muted" style={{ fontSize: '0.75rem' }}>{log.employeeId?.userId?.email || ''}</div>
                          </div>
                        </div>
                      </td>
                      <td>{log.checkIn ? new Date(log.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-'}</td>
                      <td>{log.checkOut ? new Date(log.checkOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-'}</td>
                      <td style={{ fontWeight: 600 }}>{log.workingHours || '-'}</td>
                      <td><span className={`badge badge-${getStatusColor(log.status)}`}>{log.status}</span></td>
                    </tr>
                  )) : (
                    <tr><td colSpan="5" className="text-center text-muted p-5">No logs for today yet</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : (
        <div className="card">
          <div className="card-header"><h3>Recent Logs</h3></div>
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr><th>Date</th><th>Check In</th><th>Check Out</th><th>Hours</th><th>Status</th></tr>
              </thead>
              <tbody>
                {logs.length > 0 ? logs.slice(0, 10).map((log, i) => (
                  <tr key={i}>
                    <td style={{ fontWeight: 500 }}>{new Date(log.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</td>
                    <td>{log.checkIn ? new Date(log.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-'}</td>
                    <td>{log.checkOut ? new Date(log.checkOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-'}</td>
                    <td style={{ fontWeight: 600 }}>{log.workingHours || '-'}</td>
                    <td><span className={`badge badge-${getStatusColor(log.status)}`}>{log.status}</span></td>
                  </tr>
                )) : (
                  <tr><td colSpan="5" className="text-center text-muted p-4">No logs found</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </>
  );
}
