import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import api from '../services/api';

const LEAVE_NAMES = {
  casual: 'Paid time off',
  sick: 'Sick time off',
  earned: 'Unpaid Leaves'
};

function getFriendlyLeaveName(type) {
  return LEAVE_NAMES[type] || type;
}

export default function LeavePage() {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Employee data
  const [myLeaves, setMyLeaves] = useState([]);
  const [allocation, setAllocation] = useState(null);

  // Admin/HR data
  const [allLeaves, setAllLeaves] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [viewMode, setViewMode] = useState('list'); // 'list' | 'allocate'

  // Apply leave modal
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [applyType, setApplyType] = useState('casual');
  const [applyStart, setApplyStart] = useState('');
  const [applyEnd, setApplyEnd] = useState('');
  const [applyReason, setApplyReason] = useState('');
  const [calculatedDays, setCalculatedDays] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  // Allocation form state
  const [allocEmployee, setAllocEmployee] = useState('');
  const [allocType, setAllocType] = useState('casual');
  const [allocStart, setAllocStart] = useState('');
  const [allocEnd, setAllocEnd] = useState('');
  const [noEndLimit, setNoEndLimit] = useState(false);
  const [allocDays, setAllocDays] = useState(24);
  const [allocReason, setAllocReason] = useState('');

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      if (user.role === 'employee') {
        const res = await api.getMyLeaves();
        setMyLeaves(res.data?.leaves || []);
        setAllocation(res.data?.allocation || null);
      } else {
        const [leavesRes, empsRes] = await Promise.all([
          api.getAllLeaves(),
          api.getAllEmployees()
        ]);
        setAllLeaves(leavesRes.data || []);
        setEmployees(empsRes.data || []);
        if (empsRes.data && empsRes.data.length > 0) {
          setAllocEmployee(empsRes.data[0]._id);
        }
      }
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user.role]);

  // Recalculate days when dates change in apply modal
  useEffect(() => {
    if (applyStart && applyEnd) {
      const s = new Date(applyStart);
      const e = new Date(applyEnd);
      let days = 0;
      let cur = new Date(s);
      while (cur <= e) {
        if (cur.getDay() !== 0) days++; // Skip Sundays
        cur.setDate(cur.getDate() + 1);
      }
      setCalculatedDays(Math.max(0, days));
    } else {
      setCalculatedDays(0);
    }
  }, [applyStart, applyEnd]);

  const handleApplySubmit = async (e) => {
    e.preventDefault();
    if (!applyStart || !applyEnd || !applyReason) {
      showToast('Please fill all required fields', 'danger');
      return;
    }
    setSubmitting(true);
    try {
      await api.applyLeave({
        leaveType: applyType,
        startDate: applyStart,
        endDate: applyEnd,
        reason: applyReason
      });
      showToast('Leave request submitted successfully!', 'success');
      setShowApplyModal(false);
      setApplyStart('');
      setApplyEnd('');
      setApplyReason('');
      loadData();
    } catch (err) {
      showToast(err.message, 'danger');
    } finally {
      setSubmitting(false);
    }
  };

  const handleProcessLeave = async (id, action) => {
    if (!window.confirm(`Are you sure you want to ${action} this leave request?`)) return;
    try {
      if (action === 'approve') {
        await api.approveLeave(id);
        showToast('Leave request approved', 'success');
      } else {
        await api.rejectLeave(id, 'Rejected by admin');
        showToast('Leave request rejected', 'danger');
      }
      loadData();
    } catch (err) {
      showToast(err.message, 'danger');
    }
  };

  const handleAllocationSubmit = async (e) => {
    e.preventDefault();
    if (!allocEmployee || isNaN(allocDays)) {
      showToast('Please provide employee and allocation days', 'danger');
      return;
    }
    setSubmitting(true);
    try {
      const payload = {
        employeeId: allocEmployee,
        year: new Date().getFullYear(),
        [allocType]: parseFloat(allocDays)
      };
      await api.allocateLeave(payload);
      showToast('Leave allocation saved successfully!', 'success');
      setViewMode('list');
      loadData();
    } catch (err) {
      showToast(err.message, 'danger');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="empty-state"><div className="spinner spinner-primary"></div><p>Loading leaves...</p></div>;
  }

  if (error) {
    return <div className="auth-alert error"><i className="fas fa-exclamation-circle"></i> {error}</div>;
  }

  // Employee View
  if (user.role === 'employee') {
    const casualAvailable = allocation ? allocation.casual.total - allocation.casual.used : 0;
    const sickAvailable = allocation ? allocation.sick.total - allocation.sick.used : 0;
    const todayStr = new Date().toISOString().split('T')[0];

    return (
      <>
        <div className="page-header">
          <div className="page-title">
            <h2>Time Off</h2>
            <p>Manage your leave requests and balances</p>
          </div>
          <button className="btn btn-primary" onClick={() => setShowApplyModal(true)}>
            <i className="fas fa-plus"></i> New Request
          </button>
        </div>

        <div className="grid-2 mb-4" style={{ maxWidth: 600 }}>
          <div className="card stat-card" style={{ marginBottom: 0 }}>
            <div className="stat-icon info"><i className="fas fa-calendar-check"></i></div>
            <div className="stat-details">
              <h3>{casualAvailable}</h3>
              <p>Paid Time Off Available</p>
            </div>
          </div>
          <div className="card stat-card" style={{ marginBottom: 0 }}>
            <div className="stat-icon warning"><i className="fas fa-briefcase-medical"></i></div>
            <div className="stat-details">
              <h3>{sickAvailable}</h3>
              <p>Sick Time Off Available</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h3>Recent Requests</h3>
          </div>
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Start Date</th>
                  <th>End Date</th>
                  <th>Time off Type</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {myLeaves.length > 0 ? myLeaves.map((l, i) => {
                  let statusClass = 'badge-secondary';
                  if (l.status === 'approved') statusClass = 'badge-success';
                  else if (l.status === 'rejected') statusClass = 'badge-danger';
                  else if (l.status === 'pending') statusClass = 'badge-warning';

                  return (
                    <tr key={l._id || i}>
                      <td><strong>{user.name}</strong></td>
                      <td>{new Date(l.startDate).toLocaleDateString('en-GB')}</td>
                      <td>{new Date(l.endDate).toLocaleDateString('en-GB')}</td>
                      <td className="text-info" style={{ fontWeight: 500 }}>{getFriendlyLeaveName(l.leaveType)}</td>
                      <td><span className={`badge ${statusClass}`} style={{ textTransform: 'capitalize' }}>{l.status}</span></td>
                    </tr>
                  );
                }) : (
                  <tr>
                    <td colSpan="5" className="text-center text-muted py-4">No time off requests found</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modal for Requesting Leave */}
        {showApplyModal && (
          <div className="modal active">
            <div className="modal-content" style={{ maxWidth: 500 }}>
              <div className="modal-header">
                <h3>Time Off Request</h3>
                <button className="close-modal" onClick={() => setShowApplyModal(false)}>&times;</button>
              </div>
              <form onSubmit={handleApplySubmit}>
                <div className="form-group mb-3">
                  <label className="form-label">Time Off Type</label>
                  <select className="form-control" value={applyType} onChange={e => setApplyType(e.target.value)}>
                    <option value="casual">Paid Time Off</option>
                    <option value="sick">Sick Time Off</option>
                    <option value="earned">Unpaid Leaves</option>
                  </select>
                </div>
                <div className="grid-2 gap-3 mb-3">
                  <div className="form-group mb-0">
                    <label className="form-label">Start Date</label>
                    <input
                      type="date"
                      min={todayStr}
                      className="form-control"
                      value={applyStart}
                      onChange={e => setApplyStart(e.target.value)}
                      required
                    />
                  </div>
                  <div className="form-group mb-0">
                    <label className="form-label">End Date</label>
                    <input
                      type="date"
                      min={applyStart || todayStr}
                      className="form-control"
                      value={applyEnd}
                      onChange={e => setApplyEnd(e.target.value)}
                      required
                    />
                  </div>
                </div>
                <div className="p-3 mb-3" style={{ background: 'var(--bg-alt)', borderRadius: 'var(--border-radius-sm)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span className="text-muted" style={{ fontSize: '0.875rem' }}>Calculated Working Days:</span>
                  <span style={{ fontWeight: 700, color: 'var(--primary-color)', fontSize: '1.1rem' }}>{calculatedDays} Days</span>
                </div>
                <div className="form-group mb-4">
                  <label className="form-label">Reason / Notes</label>
                  <textarea
                    className="form-control"
                    rows="3"
                    placeholder="Provide a brief explanation for your leave..."
                    value={applyReason}
                    onChange={e => setApplyReason(e.target.value)}
                    required
                  ></textarea>
                </div>
                <div className="d-flex justify-end gap-2">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowApplyModal(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary" disabled={submitting}>
                    {submitting ? 'Submitting...' : 'Submit Request'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </>
    );
  }

  // Admin / HR Officer View
  return (
    <>
      {viewMode === 'list' ? (
        <>
          <div className="page-header">
            <div className="page-title">
              <h2>Time Off Approvals</h2>
              <p>Review and manage employee leave requests</p>
            </div>
            <button className="btn btn-primary" onClick={() => setViewMode('allocate')}>
              <i className="fas fa-plus"></i> New Allocation
            </button>
          </div>

          <div className="card">
            <div className="card-header">
              <h3>All Requests</h3>
            </div>
            <div className="table-responsive">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Employee</th>
                    <th>Start Date</th>
                    <th>End Date</th>
                    <th>Time off Type</th>
                    <th>Days</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {allLeaves.length > 0 ? allLeaves.map((l, i) => {
                    let statusClass = 'badge-secondary';
                    if (l.status === 'approved') statusClass = 'badge-success';
                    else if (l.status === 'rejected') statusClass = 'badge-danger';
                    else if (l.status === 'pending') statusClass = 'badge-warning';

                    return (
                      <tr key={l._id || i}>
                        <td><strong>{l.employeeId?.userId?.name || 'Unknown'}</strong></td>
                        <td>{new Date(l.startDate).toLocaleDateString('en-GB')}</td>
                        <td>{new Date(l.endDate).toLocaleDateString('en-GB')}</td>
                        <td className="text-info" style={{ fontWeight: 500 }}>{getFriendlyLeaveName(l.leaveType)}</td>
                        <td>{l.totalDays}</td>
                        <td><span className={`badge ${statusClass}`} style={{ textTransform: 'capitalize' }}>{l.status}</span></td>
                        <td>
                          {l.status === 'pending' ? (
                            <div className="d-flex gap-2">
                              <button
                                className="btn btn-success btn-icon"
                                title="Approve"
                                onClick={() => handleProcessLeave(l._id, 'approve')}
                              >
                                <i className="fas fa-check"></i>
                              </button>
                              <button
                                className="btn btn-danger btn-icon"
                                title="Reject"
                                onClick={() => handleProcessLeave(l._id, 'reject')}
                              >
                                <i className="fas fa-times"></i>
                              </button>
                            </div>
                          ) : '-'}
                        </td>
                      </tr>
                    );
                  }) : (
                    <tr>
                      <td colSpan="7" className="text-center text-muted py-4">No leave requests found</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : (
        /* Allocation Form */
        <>
          <div className="page-header">
            <div className="page-title">
              <h2>Time Off Allocation</h2>
              <p>Allocate time off balances for employees</p>
            </div>
            <div className="d-flex gap-2">
              <button className="btn btn-secondary" onClick={() => setViewMode('list')}>
                Back to List
              </button>
              <button className="btn btn-primary" onClick={handleAllocationSubmit} disabled={submitting}>
                <i className="fas fa-save"></i> {submitting ? 'Saving...' : 'Save Allocation'}
              </button>
            </div>
          </div>

          <div className="card">
            <div className="card-body" style={{ maxWidth: 600 }}>
              <div className="form-group grid-2 mb-3">
                <label className="form-label">Employee</label>
                <select className="form-control" value={allocEmployee} onChange={e => setAllocEmployee(e.target.value)}>
                  {employees.map(e => (
                    <option key={e._id} value={e._id}>
                      {e.userId?.name || 'Unknown'} ({e.employeeCode})
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group grid-2 mb-3">
                <label className="form-label">Time off Type</label>
                <select className="form-control" value={allocType} onChange={e => setAllocType(e.target.value)}>
                  <option value="casual">Paid time off</option>
                  <option value="sick">Sick time off</option>
                  <option value="earned">Unpaid Leaves</option>
                </select>
              </div>

              <div className="form-group grid-2 mb-3">
                <label className="form-label">Validity Period</label>
                <div className="d-flex align-center gap-2">
                  <input
                    type="date"
                    className="form-control"
                    value={allocStart}
                    onChange={e => setAllocStart(e.target.value)}
                  />
                  <span>to</span>
                  <input
                    type="date"
                    className="form-control"
                    disabled={noEndLimit}
                    value={allocEnd}
                    onChange={e => setAllocEnd(e.target.value)}
                  />
                </div>
              </div>

              <div className="form-group grid-2 mb-3">
                <label></label>
                <label className="d-flex align-center gap-2" style={{ fontWeight: 'normal', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={noEndLimit}
                    onChange={e => {
                      setNoEndLimit(e.target.checked);
                      if (e.target.checked) setAllocEnd('');
                    }}
                  />
                  No End Date Limit
                </label>
              </div>

              <div className="form-group grid-2 mb-3">
                <label className="form-label">Allocation Days</label>
                <div className="d-flex align-center gap-2">
                  <input
                    type="number"
                    className="form-control"
                    value={allocDays}
                    onChange={e => setAllocDays(e.target.value)}
                    style={{ width: 100 }}
                  />
                  <span className="text-muted">Days</span>
                </div>
              </div>

              <div className="form-group grid-2 align-start mb-3">
                <label className="form-label">Note / Description</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Reason or policy reference"
                  value={allocReason}
                  onChange={e => setAllocReason(e.target.value)}
                />
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}
