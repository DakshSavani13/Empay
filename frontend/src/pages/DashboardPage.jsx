import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Doughnut } from 'react-chartjs-2';

ChartJS.register(ArcElement, Tooltip, Legend);

export default function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (user.role === 'admin' || user.role === 'hr_officer' || user.role === 'payroll_officer') {
      api.getOverview()
        .then(res => setStats(res.data))
        .catch(err => setError(err.message));
    }
  }, [user.role]);

  const goTo = (route) => navigate(`/app/${route}`);

  // Employee view
  if (user.role === 'employee') {
    return (
      <>
        <div className="page-header">
          <div className="page-title">
            <h2>Welcome, {user.name}</h2>
            <p>Here is your quick overview for today.</p>
          </div>
        </div>
        <div className="grid-3 mb-4">
          <div className="card hover-card" onClick={() => goTo('attendance')}>
            <div className="card-body text-center p-5">
              <div className="stat-icon primary mx-auto mb-3" style={{ width: 64, height: 64, fontSize: '1.5rem' }}><i className="fas fa-clock"></i></div>
              <h3 className="mb-1">Attendance</h3>
              <p className="text-muted" style={{ fontSize: '0.875rem' }}>Check in/out & view logs</p>
            </div>
          </div>
          <div className="card hover-card" onClick={() => goTo('leave')}>
            <div className="card-body text-center p-5">
              <div className="stat-icon success mx-auto mb-3" style={{ width: 64, height: 64, fontSize: '1.5rem' }}><i className="fas fa-calendar-alt"></i></div>
              <h3 className="mb-1">Leave</h3>
              <p className="text-muted" style={{ fontSize: '0.875rem' }}>Apply & track requests</p>
            </div>
          </div>
          <div className="card hover-card" onClick={() => goTo('payroll')}>
            <div className="card-body text-center p-5">
              <div className="stat-icon warning mx-auto mb-3" style={{ width: 64, height: 64, fontSize: '1.5rem' }}><i className="fas fa-file-invoice-dollar"></i></div>
              <h3 className="mb-1">Payslips</h3>
              <p className="text-muted" style={{ fontSize: '0.875rem' }}>View & download salary</p>
            </div>
          </div>
        </div>
      </>
    );
  }

  if (error) return <div className="auth-alert error"><i className="fas fa-exclamation-circle"></i> {error}</div>;
  if (!stats) return <div className="empty-state"><div className="spinner spinner-primary"></div><p>Loading...</p></div>;

  const roleLabel = { admin: 'Admin Dashboard', hr_officer: 'HR Dashboard', payroll_officer: 'Payroll Dashboard' }[user.role] || 'Dashboard';

  const chartData = stats.departments && stats.departments.length > 0 ? {
    labels: stats.departments.map(d => d._id || 'Unassigned'),
    datasets: [{
      data: stats.departments.map(d => d.count),
      backgroundColor: ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#0ea5e9', '#ec4899', '#14b8a6'],
      borderWidth: 0,
      hoverOffset: 4
    }]
  } : null;

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right',
        labels: { color: '#e2e8f0', font: { family: 'Inter', size: 12 } }
      }
    },
    cutout: '70%'
  };

  return (
    <>
      <div className="page-header">
        <div className="page-title">
          <h2>{roleLabel}</h2>
          <p>Welcome back, {user.name}. Here's your system overview.</p>
        </div>
      </div>

      <div className="grid-4 mb-4">
        <div className="card stat-card" style={{ marginBottom: 0 }}>
          <div className="stat-icon primary"><i className="fas fa-users"></i></div>
          <div className="stat-details"><h3>{stats.totalEmployees}</h3><p>Total Employees</p></div>
        </div>
        <div className="card stat-card" style={{ marginBottom: 0 }}>
          <div className="stat-icon success"><i className="fas fa-user-check"></i></div>
          <div className="stat-details"><h3>{stats.presentToday}</h3><p>Present Today</p></div>
        </div>
        <div className="card stat-card" style={{ marginBottom: 0 }}>
          <div className="stat-icon warning"><i className="fas fa-calendar-minus"></i></div>
          <div className="stat-details"><h3>{stats.pendingLeaves}</h3><p>Pending Leaves</p></div>
        </div>
        <div className="card stat-card" style={{ marginBottom: 0 }}>
          <div className="stat-icon info"><i className="fas fa-money-check-alt"></i></div>
          <div className="stat-details">
            <h3 style={{ fontSize: '1.25rem' }}>{stats.currentPayrun ? stats.currentPayrun.status.toUpperCase() : 'N/A'}</h3>
            <p>Current Payrun</p>
          </div>
        </div>
      </div>

      <div className="grid-2 gap-4">
        <div className="card h-100">
          <div className="card-header"><h3>Department Distribution</h3></div>
          <div className="card-body d-flex align-center justify-center" style={{ minHeight: 300 }}>
            {chartData ? (
              <Doughnut data={chartData} options={chartOptions} />
            ) : (
              <p className="text-muted">No department data available</p>
            )}
          </div>
        </div>
        <div className="card h-100">
          <div className="card-header"><h3>Quick Actions</h3></div>
          <div className="card-body d-flex" style={{ flexDirection: 'column', gap: '1rem' }}>
            {user.role !== 'payroll_officer' && (
              <button className="btn btn-secondary d-flex align-center gap-3 w-100 p-3 justify-start" onClick={() => goTo('leave')} style={{ background: 'rgba(147, 51, 234, 0.05)', border: '1px solid rgba(147, 51, 234, 0.2)' }}>
                <div className="stat-icon primary" style={{ width: 40, height: 40, fontSize: '1rem' }}><i className="fas fa-calendar-alt"></i></div>
                <div className="text-left">
                  <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>Leave Requests</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{stats.pendingLeaves} pending approval</div>
                </div>
              </button>
            )}
            {user.role !== 'hr_officer' && (
              <button className="btn btn-secondary d-flex align-center gap-3 w-100 p-3 justify-start" onClick={() => goTo('payroll')} style={{ background: 'rgba(16, 185, 129, 0.05)', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                <div className="stat-icon success" style={{ width: 40, height: 40, fontSize: '1rem' }}><i className="fas fa-money-check-alt"></i></div>
                <div className="text-left">
                  <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>Payroll Management</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{stats.currentPayrun ? stats.currentPayrun.status : 'No active payrun'}</div>
                </div>
              </button>
            )}
            <button className="btn btn-secondary d-flex align-center gap-3 w-100 p-3 justify-start" onClick={() => goTo('attendance')} style={{ background: 'var(--bg-alt)', border: '1px solid var(--border-color)' }}>
              <div className="stat-icon info" style={{ width: 40, height: 40, fontSize: '1rem' }}><i className="fas fa-clock"></i></div>
              <div className="text-left">
                <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>Attendance Logs</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{stats.presentToday} checked in today</div>
              </div>
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
