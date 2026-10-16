import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { MONTHS } from '../config/navigation';
import api from '../services/api';

export default function PayrollPage() {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Employee data
  const [myPayslips, setMyPayslips] = useState([]);

  // Admin / Payroll Officer data
  const [payruns, setPayruns] = useState([]);

  // Generate modal
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [genMonth, setGenMonth] = useState(new Date().getMonth() + 1);
  const [genYear, setGenYear] = useState(new Date().getFullYear());
  const [generating, setGenerating] = useState(false);
  const [genError, setGenError] = useState(null);

  // Detail modal
  const [selectedPayrun, setSelectedPayrun] = useState(null);
  const [detailPayslips, setDetailPayslips] = useState([]);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [detailError, setDetailError] = useState(null);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      if (user.role === 'employee') {
        const res = await api.getMyPayslips();
        setMyPayslips(res.data || []);
      } else {
        const res = await api.getPayruns();
        setPayruns(res.data || []);
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

  const handleDownloadPdf = async (id) => {
    try {
      const res = await api.downloadPayslip(id);
      if (res.success && res.blob) {
        const url = window.URL.createObjectURL(res.blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Payslip_${id}.pdf`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
        showToast('Payslip downloaded', 'success');
      } else {
        showToast('Could not download payslip PDF', 'danger');
      }
    } catch (e) {
      showToast('Download failed: ' + e.message, 'danger');
    }
  };

  const handleGeneratePayrun = async (e) => {
    e.preventDefault();
    setGenerating(true);
    setGenError(null);
    try {
      const res = await api.generatePayrun(parseInt(genMonth), parseInt(genYear));
      showToast(`Payrun for ${MONTHS[parseInt(genMonth) - 1]} ${genYear} generated for ${res.data?.totalEmployees || 0} employees.`, 'success');
      setShowGenerateModal(false);
      loadData();
    } catch (e) {
      setGenError(e.message);
    } finally {
      setGenerating(false);
    }
  };

  const handleFinalizePayrun = async (id) => {
    if (!window.confirm('Finalize this payrun? Payslips will become visible to all employees and notification emails will be sent.')) return;
    try {
      await api.finalizePayrun(id);
      showToast('Payrun finalized. Employees have been notified.', 'success');
      loadData();
    } catch (e) {
      showToast('Failed to finalize: ' + e.message, 'danger');
    }
  };

  const openPayrunDetail = async (payrun) => {
    setSelectedPayrun(payrun);
    setLoadingDetail(true);
    setDetailError(null);
    try {
      const res = await api.getPayslips(payrun.month, payrun.year);
      setDetailPayslips(res.data || []);
    } catch (e) {
      setDetailError(e.message);
    } finally {
      setLoadingDetail(false);
    }
  };

  if (loading) {
    return <div className="empty-state"><div className="spinner spinner-primary"></div><p>Loading payroll...</p></div>;
  }

  if (error) {
    return <div className="auth-alert error"><i className="fas fa-exclamation-circle"></i> {error}</div>;
  }

  // Employee: My Payslips
  if (user.role === 'employee') {
    return (
      <>
        <div className="page-header">
          <div className="page-title">
            <h2>My Payslips</h2>
            <p>View and download your monthly salary statements</p>
          </div>
        </div>

        {myPayslips.length === 0 ? (
          <div className="card p-5 text-center">
            <i className="fas fa-file-invoice-dollar" style={{ fontSize: 48, color: 'var(--border-color)', marginBottom: 16 }}></i>
            <h3 className="text-muted">No payslips available yet</h3>
            <p className="text-muted mt-2">Your payslips will appear here once your payroll is processed.</p>
          </div>
        ) : (
          <div className="grid-3 mb-4">
            {myPayslips.map((p) => (
              <div key={p._id} className="card">
                <div className="card-header justify-between">
                  <div>
                    <h3 style={{ marginBottom: 2 }}>{MONTHS[p.month - 1]} {p.year}</h3>
                    <div className="text-muted" style={{ fontSize: '0.75rem' }}>Payslip</div>
                  </div>
                  <span className={`badge ${p.status === 'finalized' ? 'badge-success' : 'badge-warning'}`}>
                    {p.status}
                  </span>
                </div>
                <div className="card-body">
                  <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--primary-color)', letterSpacing: '-0.5px', marginBottom: '1.5rem' }}>
                    ₹{(p.netPay || 0).toLocaleString('en-IN')}
                    <span className="text-muted" style={{ fontSize: '0.875rem', fontWeight: 500, marginLeft: 6 }}>net pay</span>
                  </div>
                  <div className="grid-2 mb-3" style={{ background: 'var(--bg-alt)', padding: '1rem', borderRadius: 'var(--border-radius-sm)', gap: '1rem' }}>
                    <div>
                      <div className="text-muted" style={{ fontSize: '0.75rem', marginBottom: '0.25rem' }}>Gross Salary</div>
                      <div style={{ fontWeight: 600, color: 'var(--success-color)' }}>₹{(p.grossSalary || 0).toLocaleString('en-IN')}</div>
                    </div>
                    <div>
                      <div className="text-muted" style={{ fontSize: '0.75rem', marginBottom: '0.25rem' }}>Deductions</div>
                      <div style={{ fontWeight: 600, color: 'var(--danger-color)' }}>-₹{(p.totalDeductions || 0).toLocaleString('en-IN')}</div>
                    </div>
                    <div>
                      <div className="text-muted" style={{ fontSize: '0.75rem', marginBottom: '0.25rem' }}>Days Worked</div>
                      <div style={{ fontWeight: 600 }}>{p.daysWorked || 0} days</div>
                    </div>
                    <div>
                      <div className="text-muted" style={{ fontSize: '0.75rem', marginBottom: '0.25rem' }}>Total Days</div>
                      <div style={{ fontWeight: 600 }}>{p.workingDays || 0} days</div>
                    </div>
                  </div>
                  <button
                    className="btn btn-secondary w-100"
                    onClick={() => handleDownloadPdf(p._id)}
                  >
                    <i className="fas fa-download"></i> Download PDF
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </>
    );
  }

  // Admin / Payroll Officer: Payruns
  return (
    <>
      <div className="page-header">
        <div className="page-title">
          <h2>Payroll Management</h2>
          <p>Generate, review, and finalize monthly payruns</p>
        </div>
        <button className="btn btn-primary" onClick={() => { setShowGenerateModal(true); setGenError(null); }}>
          <i className="fas fa-plus"></i> Generate Payrun
        </button>
      </div>

      <div className="card">
        <div className="card-header">
          <h3>Payrun History</h3>
        </div>
        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>Period</th>
                <th>Employees</th>
                <th>Total Gross</th>
                <th>Total Net</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {payruns.length > 0 ? payruns.map((pr) => (
                <tr key={pr._id}>
                  <td><strong>{MONTHS[pr.month - 1]} {pr.year}</strong></td>
                  <td>{pr.totalEmployees}</td>
                  <td style={{ color: 'var(--success-color)', fontWeight: 600 }}>
                    ₹{(pr.totalGross || 0).toLocaleString('en-IN')}
                  </td>
                  <td style={{ color: 'var(--primary-color)', fontWeight: 700 }}>
                    ₹{(pr.totalNet || 0).toLocaleString('en-IN')}
                  </td>
                  <td>
                    <span className={`badge ${pr.status === 'finalized' ? 'badge-success' : 'badge-warning'}`}>
                      {pr.status}
                    </span>
                  </td>
                  <td>
                    <div className="d-flex gap-2">
                      <button
                        className="btn btn-secondary btn-icon"
                        title="View Details"
                        onClick={() => openPayrunDetail(pr)}
                      >
                        <i className="fas fa-eye"></i>
                      </button>
                      {pr.status !== 'finalized' && (
                        <button
                          className="btn btn-success btn-icon"
                          title="Finalize Payrun"
                          onClick={() => handleFinalizePayrun(pr._id)}
                        >
                          <i className="fas fa-check"></i>
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan="6" className="text-center text-muted p-5">
                    No payruns generated yet. Click "Generate Payrun" to get started.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Generate Payrun Modal */}
      {showGenerateModal && (
        <div className="modal active">
          <div className="modal-content" style={{ maxWidth: 460 }}>
            <div className="modal-header">
              <h3>Generate Payrun</h3>
              <button className="close-modal" onClick={() => setShowGenerateModal(false)}>&times;</button>
            </div>
            <form onSubmit={handleGeneratePayrun}>
              <div className="modal-body p-0 mb-4">
                <p className="text-muted mb-4" style={{ fontSize: '0.875rem' }}>
                  This will calculate payroll for all active employees for the selected month and year.
                </p>
                <div className="form-group mb-3">
                  <label className="form-label">Month</label>
                  <select
                    className="form-control"
                    value={genMonth}
                    onChange={e => setGenMonth(e.target.value)}
                  >
                    {MONTHS.map((m, i) => (
                      <option key={m} value={i + 1}>{m}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group mb-3">
                  <label className="form-label">Year</label>
                  <input
                    type="number"
                    className="form-control"
                    value={genYear}
                    min="2020"
                    max="2099"
                    onChange={e => setGenYear(e.target.value)}
                    required
                  />
                </div>
                {genError && (
                  <div className="auth-alert error mt-2">
                    <i className="fas fa-exclamation-circle"></i> {genError}
                  </div>
                )}
              </div>
              <div className="d-flex justify-end gap-2">
                <button type="button" className="btn btn-secondary" onClick={() => setShowGenerateModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={generating}>
                  <i className="fas fa-cogs"></i> {generating ? 'Processing...' : 'Generate'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Payrun Detail Modal */}
      {selectedPayrun && (
        <div className="modal active modal-lg">
          <div className="modal-content" style={{ maxWidth: 900 }}>
            <div className="modal-header">
              <h3>Payrun &mdash; {MONTHS[selectedPayrun.month - 1]} {selectedPayrun.year}</h3>
              <button className="close-modal" onClick={() => setSelectedPayrun(null)}>&times;</button>
            </div>
            <div className="modal-body p-0">
              {loadingDetail ? (
                <div className="empty-state"><div className="spinner spinner-primary"></div><p>Loading payslips...</p></div>
              ) : detailError ? (
                <div className="auth-alert error"><i className="fas fa-exclamation-circle"></i> {detailError}</div>
              ) : detailPayslips.length === 0 ? (
                <p className="text-muted text-center p-5">No payslips found for this period.</p>
              ) : (
                <>
                  <div className="mb-3 text-muted" style={{ fontSize: '0.875rem' }}>
                    Showing {detailPayslips.length} payslip(s)
                  </div>
                  <div className="table-responsive">
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>Employee</th>
                          <th>Gross</th>
                          <th>Deductions</th>
                          <th>Net Pay</th>
                          <th>Days</th>
                          <th>Status</th>
                          <th>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {detailPayslips.map(p => (
                          <tr key={p._id}>
                            <td>
                              <div style={{ fontWeight: 600 }}>{p.employeeId?.userId?.name || 'N/A'}</div>
                              <div className="text-muted" style={{ fontSize: '0.75rem' }}>{p.employeeId?.employeeCode || ''}</div>
                            </td>
                            <td style={{ color: 'var(--success-color)', fontWeight: 600 }}>
                              ₹{(p.grossSalary || 0).toLocaleString('en-IN')}
                            </td>
                            <td style={{ color: 'var(--danger-color)' }}>
                              ₹{(p.totalDeductions || 0).toLocaleString('en-IN')}
                            </td>
                            <td style={{ fontWeight: 700, color: 'var(--primary-color)' }}>
                              ₹{(p.netPay || 0).toLocaleString('en-IN')}
                            </td>
                            <td>{p.daysWorked || 0}/{p.workingDays || 0}</td>
                            <td>
                              <span className={`badge ${p.status === 'finalized' ? 'badge-success' : 'badge-warning'}`}>
                                {p.status}
                              </span>
                            </td>
                            <td>
                              <button
                                className="btn btn-secondary btn-icon"
                                title="Download PDF"
                                onClick={() => handleDownloadPdf(p._id)}
                              >
                                <i className="fas fa-download"></i>
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
