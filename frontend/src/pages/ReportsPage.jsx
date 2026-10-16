import { useState, useEffect, useRef } from 'react';
import api from '../services/api';
import { MONTHS } from '../config/navigation';

export default function ReportsPage() {
  const [employees, setEmployees] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState('');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [loadingEmployees, setLoadingEmployees] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [statementData, setStatementData] = useState(null);
  const [error, setError] = useState(null);

  const printAreaRef = useRef(null);

  const currentYear = new Date().getFullYear();
  const yearOptions = [currentYear, currentYear - 1, currentYear - 2, currentYear - 3];

  useEffect(() => {
    const loadEmps = async () => {
      try {
        const res = await api.getAllEmployees();
        setEmployees(res.data || []);
        if (res.data && res.data.length > 0) {
          setSelectedEmployee(res.data[0]._id);
        }
      } catch (e) {
        setError(e.message);
      } finally {
        setLoadingEmployees(false);
      }
    };
    loadEmps();
  }, []);

  const handleGenerate = async (e) => {
    e.preventDefault();
    if (!selectedEmployee) return;
    setGenerating(true);
    setError(null);
    try {
      const res = await api.getSalaryStatement(selectedEmployee, selectedYear);
      setStatementData(res.data);
    } catch (e) {
      setError(e.message);
    } finally {
      setGenerating(false);
    }
  };

  const handlePrint = () => {
    if (!printAreaRef.current) return;
    const printContent = printAreaRef.current.innerHTML;
    const win = window.open('', '_blank', 'width=900,height=700');
    win.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Salary Statement Report</title>
        <style>
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #333; padding: 24px; background: #fff; }
          .ss-container { max-width: 820px; margin: 0 auto; }
          .ss-header { text-align: center; margin-bottom: 24px; border-bottom: 2px solid #714B67; padding-bottom: 16px; }
          .ss-company { font-size: 22px; font-weight: 700; color: #714B67; letter-spacing: 0.5px; }
          .ss-title { font-size: 15px; font-weight: 600; color: #444; margin-top: 4px; text-transform: uppercase; letter-spacing: 1px; }
          .ss-subtitle { font-size: 12px; color: #777; margin-top: 2px; }
          .ss-emp-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px 24px; background: #faf5f9; padding: 14px 18px; border-radius: 6px; margin-bottom: 20px; border: 1px solid #ebdbe7; }
          .ss-emp-row { display: flex; gap: 8px; font-size: 12.5px; }
          .ss-emp-label { font-weight: 600; color: #555; min-width: 140px; }
          .ss-emp-value { color: #222; }
          .ss-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 12.5px; }
          .ss-table th, .ss-table td { border: 1px solid #ddd; padding: 8px 12px; text-align: right; }
          .ss-table th { background: #f5f0f4; color: #714B67; font-weight: 600; text-align: center; }
          .ss-table td:first-child, .ss-table th:first-child { text-align: left; }
          .ss-section-row td { background: #faf5f9; font-weight: 700; color: #714B67; border-top: 2px solid #714B67; }
          .ss-total-row td { background: #714B67; color: #fff; font-weight: 700; font-size: 13px; }
          .ss-footer { text-align: center; margin-top: 30px; font-size: 11px; color: #999; border-top: 1px solid #e0e0e0; padding-top: 12px; }
          @media print {
            body { padding: 10px; }
            @page { margin: 15mm; }
          }
        </style>
      </head>
      <body>${printContent}</body>
      </html>
    `);
    win.document.close();
    setTimeout(() => { win.print(); }, 300);
  };

  const fmt = (n) => '₹ ' + Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
  const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

  return (
    <>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <div className="page-title">
          <h2><i className="fas fa-file-alt" style={{ color: 'var(--primary-color)', marginRight: 8 }}></i>Salary Statement Report</h2>
          <p>Generate and print employee salary statements</p>
        </div>
      </div>

      <div className="card mb-4">
        <div className="card-header" style={{ padding: '16px 24px', borderBottom: '1px solid var(--border-color)' }}>
          <h3 style={{ margin: 0, fontSize: 15, fontWeight: 600 }}>Configure Statement</h3>
        </div>
        <div className="card-body" style={{ padding: 24 }}>
          <form onSubmit={handleGenerate}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: 16, alignItems: 'end' }}>
              <div className="form-group mb-0">
                <label className="form-label">Employee Name</label>
                <select
                  className="form-control"
                  value={selectedEmployee}
                  onChange={e => setSelectedEmployee(e.target.value)}
                  disabled={loadingEmployees}
                >
                  {loadingEmployees ? (
                    <option>Loading employees...</option>
                  ) : (
                    employees.map(e => (
                      <option key={e._id} value={e._id}>
                        {e.userId?.name || 'Unknown'} ({e.employeeCode})
                      </option>
                    ))
                  )}
                </select>
              </div>
              <div className="form-group mb-0">
                <label className="form-label">Year</label>
                <select
                  className="form-control"
                  value={selectedYear}
                  onChange={e => setSelectedYear(Number(e.target.value))}
                >
                  {yearOptions.map(y => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </div>
              <button
                type="submit"
                className="btn btn-primary"
                style={{ padding: '10px 28px', height: 44, whiteSpace: 'nowrap' }}
                disabled={generating || !selectedEmployee}
              >
                <i className="fas fa-file-invoice" style={{ marginRight: 6 }}></i>
                {generating ? 'Generating...' : 'Generate'}
              </button>
            </div>
          </form>
        </div>
      </div>

      {error && (
        <div className="auth-alert error mb-4">
          <i className="fas fa-exclamation-circle"></i> {error}
        </div>
      )}

      {generating && (
        <div className="empty-state">
          <div className="spinner spinner-primary"></div>
          <p>Generating salary statement report...</p>
        </div>
      )}

      {statementData && !generating && (
        <div style={{ marginTop: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
            <button
              className="btn btn-primary"
              onClick={handlePrint}
              style={{ padding: '10px 24px' }}
            >
              <i className="fas fa-print" style={{ marginRight: 6 }}></i> Print Report
            </button>
          </div>

          <div className="card" style={{ padding: 0, overflow: 'hidden' }} ref={printAreaRef}>
            <div className="ss-container" style={{ padding: 32 }}>
              {/* Header */}
              <div className="ss-header" style={{ textAlign: 'center', marginBottom: 24, borderBottom: '2px solid var(--primary-color)', paddingBottom: 16 }}>
                <div className="ss-company" style={{ fontSize: 22, fontWeight: 700, color: 'var(--primary-color)', letterSpacing: 0.5 }}>
                  {statementData.employee.companyName}
                </div>
                <div className="ss-title" style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-main)', marginTop: 4, textTransform: 'uppercase', letterSpacing: 1 }}>
                  Salary Statement Report
                </div>
                <div className="ss-subtitle" style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                  Financial Year {statementData.year}
                </div>
              </div>

              {/* Employee Info Grid */}
              <div
                className="ss-emp-grid"
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '8px 24px',
                  background: 'var(--bg-alt)',
                  padding: '14px 18px',
                  borderRadius: 6,
                  marginBottom: 20,
                  border: '1px solid var(--border-color)'
                }}
              >
                <div className="ss-emp-row" style={{ display: 'flex', gap: 8, fontSize: '12.5px' }}>
                  <span className="ss-emp-label" style={{ fontWeight: 600, color: 'var(--text-muted)', minWidth: 140 }}>Employee Name:</span>
                  <span className="ss-emp-value" style={{ color: 'var(--text-main)', fontWeight: 600 }}>{statementData.employee.name}</span>
                </div>
                <div className="ss-emp-row" style={{ display: 'flex', gap: 8, fontSize: '12.5px' }}>
                  <span className="ss-emp-label" style={{ fontWeight: 600, color: 'var(--text-muted)', minWidth: 140 }}>Date Of Joining:</span>
                  <span className="ss-emp-value" style={{ color: 'var(--text-main)' }}>{formatDate(statementData.employee.joiningDate)}</span>
                </div>
                <div className="ss-emp-row" style={{ display: 'flex', gap: 8, fontSize: '12.5px' }}>
                  <span className="ss-emp-label" style={{ fontWeight: 600, color: 'var(--text-muted)', minWidth: 140 }}>Designation:</span>
                  <span className="ss-emp-value" style={{ color: 'var(--text-main)' }}>{statementData.employee.designation}</span>
                </div>
                <div className="ss-emp-row" style={{ display: 'flex', gap: 8, fontSize: '12.5px' }}>
                  <span className="ss-emp-label" style={{ fontWeight: 600, color: 'var(--text-muted)', minWidth: 140 }}>Salary Effective:</span>
                  <span className="ss-emp-value" style={{ color: 'var(--text-main)' }}>
                    {new Date(statementData.employee.joiningDate) > new Date(statementData.year, 0, 1)
                      ? formatDate(statementData.employee.joiningDate)
                      : `01 Jan ${statementData.year}`}
                  </span>
                </div>
                <div className="ss-emp-row" style={{ display: 'flex', gap: 8, fontSize: '12.5px' }}>
                  <span className="ss-emp-label" style={{ fontWeight: 600, color: 'var(--text-muted)', minWidth: 140 }}>Department:</span>
                  <span className="ss-emp-value" style={{ color: 'var(--text-main)' }}>{statementData.employee.department}</span>
                </div>
                <div className="ss-emp-row" style={{ display: 'flex', gap: 8, fontSize: '12.5px' }}>
                  <span className="ss-emp-label" style={{ fontWeight: 600, color: 'var(--text-muted)', minWidth: 140 }}>Employee Code:</span>
                  <span className="ss-emp-value" style={{ color: 'var(--text-main)' }}>{statementData.employee.employeeCode}</span>
                </div>
              </div>

              {/* Salary Components Table */}
              <table className="ss-table" style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 20, fontSize: '12.5px' }}>
                <thead>
                  <tr>
                    <th style={{ width: '45%', border: '1px solid var(--border-color)', padding: '8px 12px', background: 'var(--bg-alt)', textAlign: 'left' }}>
                      Salary Components
                    </th>
                    <th style={{ width: '27.5%', border: '1px solid var(--border-color)', padding: '8px 12px', background: 'var(--bg-alt)', textAlign: 'right' }}>
                      Monthly Amount
                    </th>
                    <th style={{ width: '27.5%', border: '1px solid var(--border-color)', padding: '8px 12px', background: 'var(--bg-alt)', textAlign: 'right' }}>
                      Yearly Amount
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {/* Earnings Section */}
                  <tr style={{ background: 'var(--bg-alt)', fontWeight: 700, color: 'var(--primary-color)' }}>
                    <td colSpan="3" style={{ border: '1px solid var(--border-color)', padding: '8px 12px' }}>Earnings</td>
                  </tr>
                  {statementData.components.earnings.map((e, i) => (
                    <tr key={i}>
                      <td style={{ border: '1px solid var(--border-color)', padding: '8px 12px', paddingLeft: 24 }}>{e.label}</td>
                      <td style={{ border: '1px solid var(--border-color)', padding: '8px 12px', textAlign: 'right' }}>{fmt(e.monthly)}</td>
                      <td style={{ border: '1px solid var(--border-color)', padding: '8px 12px', textAlign: 'right' }}>{fmt(e.yearly)}</td>
                    </tr>
                  ))}
                  <tr style={{ background: 'var(--bg-alt)' }}>
                    <td style={{ border: '1px solid var(--border-color)', padding: '8px 12px', fontWeight: 600 }}>Total Earnings</td>
                    <td style={{ border: '1px solid var(--border-color)', padding: '8px 12px', textAlign: 'right', fontWeight: 600, color: 'var(--success-color)' }}>
                      {fmt(statementData.components.totalEarnings.monthly)}
                    </td>
                    <td style={{ border: '1px solid var(--border-color)', padding: '8px 12px', textAlign: 'right', fontWeight: 600, color: 'var(--success-color)' }}>
                      {fmt(statementData.components.totalEarnings.yearly)}
                    </td>
                  </tr>

                  {/* Deductions Section */}
                  <tr style={{ background: 'var(--bg-alt)', fontWeight: 700, color: 'var(--primary-color)' }}>
                    <td colSpan="3" style={{ border: '1px solid var(--border-color)', padding: '8px 12px' }}>Deductions</td>
                  </tr>
                  {statementData.components.deductions.map((d, i) => (
                    <tr key={i}>
                      <td style={{ border: '1px solid var(--border-color)', padding: '8px 12px', paddingLeft: 24 }}>{d.label}</td>
                      <td style={{ border: '1px solid var(--border-color)', padding: '8px 12px', textAlign: 'right' }}>{fmt(d.monthly)}</td>
                      <td style={{ border: '1px solid var(--border-color)', padding: '8px 12px', textAlign: 'right' }}>{fmt(d.yearly)}</td>
                    </tr>
                  ))}
                  <tr style={{ background: 'var(--bg-alt)' }}>
                    <td style={{ border: '1px solid var(--border-color)', padding: '8px 12px', fontWeight: 600 }}>Total Deductions</td>
                    <td style={{ border: '1px solid var(--border-color)', padding: '8px 12px', textAlign: 'right', fontWeight: 600, color: 'var(--danger-color)' }}>
                      {fmt(statementData.components.totalDeductions.monthly)}
                    </td>
                    <td style={{ border: '1px solid var(--border-color)', padding: '8px 12px', textAlign: 'right', fontWeight: 600, color: 'var(--danger-color)' }}>
                      {fmt(statementData.components.totalDeductions.yearly)}
                    </td>
                  </tr>

                  {/* Net Salary Total */}
                  <tr style={{ background: 'var(--primary-color)', color: '#fff', fontWeight: 700 }}>
                    <td style={{ border: '1px solid var(--border-color)', padding: '10px 12px' }}>Net Salary</td>
                    <td style={{ border: '1px solid var(--border-color)', padding: '10px 12px', textAlign: 'right' }}>
                      {fmt(statementData.components.netSalary.monthly)}
                    </td>
                    <td style={{ border: '1px solid var(--border-color)', padding: '10px 12px', textAlign: 'right' }}>
                      {fmt(statementData.components.netSalary.yearly)}
                    </td>
                  </tr>
                </tbody>
              </table>

              {/* Monthly Breakdown Table */}
              {statementData.monthlyData && statementData.monthlyData.length > 0 ? (
                <>
                  <h3 style={{ margin: '24px 0 12px', fontSize: 14, fontWeight: 600, color: 'var(--text-main)' }}>
                    <i className="fas fa-calendar-alt" style={{ color: 'var(--primary-color)', marginRight: 6 }}></i>
                    Monthly Breakdown &mdash; {statementData.year}
                  </h3>
                  <div style={{ overflowX: 'auto' }}>
                    <table className="ss-table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11.5px' }}>
                      <thead>
                        <tr>
                          <th style={{ border: '1px solid var(--border-color)', padding: '6px 10px', background: 'var(--bg-alt)', textAlign: 'left' }}>Month</th>
                          <th style={{ border: '1px solid var(--border-color)', padding: '6px 10px', background: 'var(--bg-alt)', textAlign: 'right' }}>Basic</th>
                          <th style={{ border: '1px solid var(--border-color)', padding: '6px 10px', background: 'var(--bg-alt)', textAlign: 'right' }}>HRA</th>
                          <th style={{ border: '1px solid var(--border-color)', padding: '6px 10px', background: 'var(--bg-alt)', textAlign: 'right' }}>Allowances</th>
                          <th style={{ border: '1px solid var(--border-color)', padding: '6px 10px', background: 'var(--bg-alt)', textAlign: 'right' }}>Gross</th>
                          <th style={{ border: '1px solid var(--border-color)', padding: '6px 10px', background: 'var(--bg-alt)', textAlign: 'right' }}>Deductions</th>
                          <th style={{ border: '1px solid var(--border-color)', padding: '6px 10px', background: 'var(--bg-alt)', textAlign: 'right' }}>Net Pay</th>
                          <th style={{ border: '1px solid var(--border-color)', padding: '6px 10px', background: 'var(--bg-alt)', textAlign: 'center' }}>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {statementData.monthlyData.map((m, i) => (
                          <tr key={i}>
                            <td style={{ border: '1px solid var(--border-color)', padding: '6px 10px', textAlign: 'left' }}>{MONTHS[m.month - 1]}</td>
                            <td style={{ border: '1px solid var(--border-color)', padding: '6px 10px', textAlign: 'right' }}>{fmt(m.basicPay)}</td>
                            <td style={{ border: '1px solid var(--border-color)', padding: '6px 10px', textAlign: 'right' }}>{fmt(m.hra)}</td>
                            <td style={{ border: '1px solid var(--border-color)', padding: '6px 10px', textAlign: 'right' }}>{fmt(m.allowances)}</td>
                            <td style={{ border: '1px solid var(--border-color)', padding: '6px 10px', textAlign: 'right' }}>{fmt(m.grossSalary)}</td>
                            <td style={{ border: '1px solid var(--border-color)', padding: '6px 10px', textAlign: 'right' }}>{fmt(m.totalDeductions)}</td>
                            <td style={{ border: '1px solid var(--border-color)', padding: '6px 10px', textAlign: 'right', fontWeight: 600 }}>{fmt(m.netPay)}</td>
                            <td style={{ border: '1px solid var(--border-color)', padding: '6px 10px', textAlign: 'center' }}>
                              <span className={`badge ${m.status === 'finalized' ? 'badge-success' : 'badge-warning'}`}>
                                {m.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                        <tr style={{ background: 'var(--bg-alt)', fontWeight: 700 }}>
                          <td style={{ border: '1px solid var(--border-color)', padding: '6px 10px', textAlign: 'left' }}>Total</td>
                          <td style={{ border: '1px solid var(--border-color)', padding: '6px 10px', textAlign: 'right' }}>{fmt(statementData.totals.totalBasic)}</td>
                          <td style={{ border: '1px solid var(--border-color)', padding: '6px 10px', textAlign: 'right' }}>{fmt(statementData.totals.totalHRA)}</td>
                          <td style={{ border: '1px solid var(--border-color)', padding: '6px 10px', textAlign: 'right' }}>{fmt(statementData.totals.totalAllowances)}</td>
                          <td style={{ border: '1px solid var(--border-color)', padding: '6px 10px', textAlign: 'right' }}>{fmt(statementData.totals.totalGross)}</td>
                          <td style={{ border: '1px solid var(--border-color)', padding: '6px 10px', textAlign: 'right' }}>{fmt(statementData.totals.totalDeductions)}</td>
                          <td style={{ border: '1px solid var(--border-color)', padding: '6px 10px', textAlign: 'right', color: 'var(--primary-color)' }}>{fmt(statementData.totals.totalNet)}</td>
                          <td style={{ border: '1px solid var(--border-color)', padding: '6px 10px' }}></td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </>
              ) : (
                <div style={{ textAlign: 'center', padding: 24, color: 'var(--text-muted)', fontSize: 13, border: '1px dashed var(--border-color)', borderRadius: 8 }}>
                  <i className="fas fa-info-circle" style={{ marginRight: 6 }}></i>
                  No processed payslips found for {statementData.year}. The above values are calculated from the employee's current salary structure.
                </div>
              )}

              {/* Footer */}
              <div className="ss-footer" style={{ textAlign: 'center', marginTop: 30, fontSize: 11, color: 'var(--text-muted)', borderTop: '1px solid var(--border-color)', paddingTop: 12 }}>
                Generated by EmPay HRMS &mdash; {new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
