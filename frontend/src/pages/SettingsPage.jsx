import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import api from '../services/api';

const ROLE_OPTIONS = [
  { value: 'employee', label: 'Employee' },
  { value: 'hr_officer', label: 'HR Officer' },
  { value: 'payroll_officer', label: 'Payroll Officer' },
  { value: 'admin', label: 'Administrator' }
];

export default function SettingsPage() {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [updatingId, setUpdatingId] = useState(null);

  const loadUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.getAllUsers();
      setUsers(res.data || []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleRoleChange = async (userId, newRole) => {
    setUpdatingId(userId);
    try {
      await api.updateUserRole(userId, newRole);
      setUsers(prev => prev.map(u => (u._id === userId ? { ...u, role: newRole } : u)));
      showToast('User role updated successfully', 'success');
    } catch (e) {
      showToast('Failed to update role: ' + e.message, 'danger');
    } finally {
      setUpdatingId(null);
    }
  };

  const filteredUsers = users.filter(u => {
    const term = searchTerm.toLowerCase();
    const nameMatch = u.name?.toLowerCase().includes(term);
    const emailMatch = u.email?.toLowerCase().includes(term);
    const codeMatch = u.employeeId?.employeeCode?.toLowerCase().includes(term);
    return nameMatch || emailMatch || codeMatch;
  });

  if (loading) {
    return <div className="empty-state"><div className="spinner spinner-primary"></div><p>Loading settings...</p></div>;
  }

  if (error) {
    return <div className="auth-alert error"><i className="fas fa-exclamation-circle"></i> {error}</div>;
  }

  return (
    <>
      <div className="page-header">
        <div className="page-title">
          <h2>Settings & Access Control</h2>
          <p>Configure company policies, roles, and administrative permissions</p>
        </div>
      </div>

      <div className="grid-2" style={{ gridTemplateColumns: '1fr 2fr', gap: '1.5rem', alignItems: 'start' }}>
        {/* Left Column: Role Hierarchy Information */}
        <div className="card">
          <div className="card-header">
            <h3><i className="fas fa-shield-alt" style={{ marginRight: 8, color: 'var(--primary-color)' }}></i>Role Hierarchy</h3>
          </div>
          <div className="card-body">
            <p className="text-muted mb-3" style={{ fontSize: '0.875rem' }}>
              Administrators can assign system access rights based on organizational hierarchy.
            </p>
            <ul className="text-muted mb-4" style={{ fontSize: '0.875rem', paddingLeft: '1.2rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <li>Access rights restrict module visibility.</li>
              <li>Changes take effect immediately upon saving.</li>
              <li>Ensure at least one active Administrator remains.</li>
            </ul>

            <div className="p-3" style={{ background: 'var(--primary-light)', borderRadius: 'var(--border-radius-sm)', borderLeft: '3px solid var(--primary-color)' }}>
              <div style={{ fontWeight: 600, color: 'var(--primary-color)', marginBottom: '0.25rem', fontSize: '0.875rem' }}>
                Available Roles
              </div>
              <div className="d-flex flex-column gap-1 text-muted" style={{ fontSize: '0.75rem' }}>
                <div>&bull; <strong>Admin:</strong> Full access to all modules and configurations</div>
                <div>&bull; <strong>HR Officer:</strong> Employee directory and leave management</div>
                <div>&bull; <strong>Payroll Officer:</strong> Payruns, reports, and financial records</div>
                <div>&bull; <strong>Employee:</strong> Self-service portal for clock, leaves, and payslips</div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: User Role Management Table */}
        <div className="card">
          <div className="card-header d-flex justify-between align-center" style={{ flexWrap: 'wrap', gap: 10 }}>
            <h3>System Users</h3>
            <div className="search-box" style={{ position: 'relative', width: 250 }}>
              <i className="fas fa-search" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}></i>
              <input
                type="text"
                className="form-control"
                placeholder="Search users..."
                style={{ paddingLeft: 35, height: 36 }}
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>User Profile</th>
                  <th>Login ID</th>
                  <th>Role Assignment</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.length > 0 ? (
                  filteredUsers.map((u) => {
                    const loginId = u.employeeId ? u.employeeId.employeeCode : 'N/A';
                    const initials = u.name ? u.name.substring(0, 2).toUpperCase() : 'U';
                    const isSelf = u._id === user?._id;

                    return (
                      <tr key={u._id}>
                        <td>
                          <div className="d-flex align-center gap-3">
                            <div
                              className="user-avatar-sm d-flex align-center justify-center"
                              style={{
                                background: 'var(--bg-surface)',
                                border: '1px solid var(--border-color)',
                                color: 'var(--primary-color)',
                                fontWeight: 600,
                                width: 36,
                                height: 36,
                                borderRadius: '50%'
                              }}
                            >
                              {initials}
                            </div>
                            <div>
                              <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>
                                {u.name} {isSelf && <span className="badge badge-info" style={{ fontSize: '0.65rem', marginLeft: 4 }}>You</span>}
                              </div>
                              <div className="text-muted" style={{ fontSize: '0.75rem' }}>{u.email}</div>
                            </div>
                          </div>
                        </td>
                        <td style={{ fontFamily: 'monospace', color: 'var(--text-muted)' }}>{loginId}</td>
                        <td>
                          <div className="form-group mb-0" style={{ width: 180 }}>
                            <select
                              className="form-control"
                              value={u.role}
                              disabled={updatingId === u._id}
                              onChange={e => handleRoleChange(u._id, e.target.value)}
                              style={{ opacity: updatingId === u._id ? 0.6 : 1 }}
                            >
                              {ROLE_OPTIONS.map(opt => (
                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                              ))}
                            </select>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="3" className="text-center text-muted p-5">
                      No users found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
}
