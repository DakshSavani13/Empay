import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import api from '../services/api';

export default function EmployeesPage() {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Add Employee Modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'employee',
    department: '',
    designation: '',
    joiningDate: new Date().toISOString().split('T')[0],
    basicSalary: 30000,
    hra: 15000,
    allowances: 5000
  });
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState(null);

  const loadEmployees = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.getAllEmployees();
      setEmployees(res.data || []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEmployees();
  }, []);

  const handleChange = (e) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? Number(value) : value
    }));
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setFormError(null);
    try {
      await api.register(formData);
      showToast('Employee registered successfully!', 'success');
      setShowAddModal(false);
      setFormData({
        name: '',
        email: '',
        password: '',
        role: 'employee',
        department: '',
        designation: '',
        joiningDate: new Date().toISOString().split('T')[0],
        basicSalary: 30000,
        hra: 15000,
        allowances: 5000
      });
      loadEmployees();
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="empty-state"><div className="spinner spinner-primary"></div><p>Loading directory...</p></div>;
  }

  if (error) {
    return <div className="auth-alert error"><i className="fas fa-exclamation-circle"></i> {error}</div>;
  }

  return (
    <>
      <div className="page-header">
        <div className="page-title">
          <h2>Employee Directory</h2>
          <p>Manage all company employees</p>
        </div>
        {user.role === 'admin' && (
          <button className="btn btn-primary" onClick={() => { setShowAddModal(true); setFormError(null); }}>
            <i className="fas fa-user-plus"></i> Add Employee
          </button>
        )}
      </div>

      <div className="employee-grid">
        {employees.length > 0 ? (
          employees.map((e) => {
            const initials = e.userId?.name
              ? e.userId.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
              : 'U';

            let statusClass = 'badge-secondary';
            let statusText = 'Unknown';
            if (e.status === 'present') { statusClass = 'badge-success'; statusText = 'Present'; }
            else if (e.status === 'absent') { statusClass = 'badge-danger'; statusText = 'Absent'; }
            else if (e.status === 'on-leave') { statusClass = 'badge-warning'; statusText = 'On Leave'; }
            else if (e.status === 'half-day') { statusClass = 'badge-info'; statusText = 'Half Day'; }
            else if (e.status === 'weekend') { statusClass = 'badge-light'; statusText = 'Weekend'; }

            return (
              <div key={e._id} className="employee-card">
                <div className="employee-card-header">
                  <div className="employee-avatar">{initials}</div>
                  <div className="employee-status">
                    <span className={`badge ${statusClass}`}>{statusText}</span>
                  </div>
                </div>
                <div className="employee-card-body">
                  <h3 className="employee-name">{e.userId ? e.userId.name : 'Unknown'}</h3>
                  <p className="employee-designation">{e.designation}</p>
                  <div className="employee-details">
                    <div className="detail-item">
                      <i className="fas fa-id-badge"></i> <span>{e.employeeCode}</span>
                    </div>
                    <div className="detail-item">
                      <i className="fas fa-building"></i> <span>{e.department}</span>
                    </div>
                    <div className="detail-item">
                      <i className="fas fa-envelope"></i> <span>{e.userId ? e.userId.email : ''}</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="empty-state">
            <i className="fas fa-users" style={{ fontSize: 48, color: 'var(--border-color)', marginBottom: 16 }}></i>
            <p className="text-muted">No employees found</p>
          </div>
        )}
      </div>

      {/* Add Employee Modal */}
      {showAddModal && (
        <div className="modal active">
          <div className="modal-content" style={{ maxWidth: 640 }}>
            <div className="modal-header">
              <h2>Add New Employee</h2>
              <button className="close-modal" onClick={() => setShowAddModal(false)}>&times;</button>
            </div>
            <form onSubmit={handleAddSubmit}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                <div className="form-group mb-0">
                  <label className="form-label">Name</label>
                  <input
                    type="text"
                    name="name"
                    className="form-control"
                    value={formData.name}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="form-group mb-0">
                  <label className="form-label">Email</label>
                  <input
                    type="email"
                    name="email"
                    className="form-control"
                    value={formData.email}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="form-group mb-0">
                  <label className="form-label">Password</label>
                  <input
                    type="password"
                    name="password"
                    className="form-control"
                    value={formData.password}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="form-group mb-0">
                  <label className="form-label">Role</label>
                  <select
                    name="role"
                    className="form-control"
                    value={formData.role}
                    onChange={handleChange}
                    required
                  >
                    <option value="employee">Employee</option>
                    <option value="hr_officer">HR Officer</option>
                    <option value="payroll_officer">Payroll Officer</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                <div className="form-group mb-0">
                  <label className="form-label">Department</label>
                  <input
                    type="text"
                    name="department"
                    className="form-control"
                    value={formData.department}
                    onChange={handleChange}
                    placeholder="e.g. Engineering"
                    required
                  />
                </div>
                <div className="form-group mb-0">
                  <label className="form-label">Designation</label>
                  <input
                    type="text"
                    name="designation"
                    className="form-control"
                    value={formData.designation}
                    onChange={handleChange}
                    placeholder="e.g. Software Engineer"
                    required
                  />
                </div>
                <div className="form-group mb-0">
                  <label className="form-label">Joining Date</label>
                  <input
                    type="date"
                    name="joiningDate"
                    className="form-control"
                    value={formData.joiningDate}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="form-group mb-0">
                  <label className="form-label">Basic Salary (₹)</label>
                  <input
                    type="number"
                    name="basicSalary"
                    className="form-control"
                    value={formData.basicSalary}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="form-group mb-0">
                  <label className="form-label">HRA (₹)</label>
                  <input
                    type="number"
                    name="hra"
                    className="form-control"
                    value={formData.hra}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="form-group mb-0">
                  <label className="form-label">Allowances (₹)</label>
                  <input
                    type="number"
                    name="allowances"
                    className="form-control"
                    value={formData.allowances}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              {formError && (
                <div className="auth-alert error mt-3">
                  <i className="fas fa-exclamation-circle"></i> {formError}
                </div>
              )}

              <div className="d-flex justify-end gap-2 mt-4">
                <button type="button" className="btn btn-secondary" onClick={() => setShowAddModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? 'Registering...' : 'Register Employee'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
