import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import api from '../services/api';

export default function ProfilePage() {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState('resume');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  // Profile data
  const [profile, setProfile] = useState(null);

  // Resume state
  const [bio, setBio] = useState('');
  const [skills, setSkills] = useState('');
  const [certifications, setCertifications] = useState('');
  const [jobPassion, setJobPassion] = useState('');

  // Private state
  const [phone, setPhone] = useState('');
  const [emergencyContact, setEmergencyContact] = useState('');
  const [street, setStreet] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [zip, setZip] = useState('');
  const [bankAccount, setBankAccount] = useState('');
  const [bankIfsc, setBankIfsc] = useState('');
  const [bankName, setBankName] = useState('');

  // Salary state
  const [monthWage, setMonthWage] = useState(50000);
  const [yearlyWage, setYearlyWage] = useState(600000);
  const [workingDays, setWorkingDays] = useState(5);
  const [breakHours, setBreakHours] = useState(1);
  const [profTax, setProfTax] = useState(200);

  // Salary Component percentages
  const [components, setComponents] = useState({
    basic: { percentage: 50, amount: 25000 },
    hra: { percentage: 20, amount: 10000 },
    standardAllowance: { percentage: 10, amount: 5000 },
    performanceBonus: { percentage: 5, amount: 2500 },
    lta: { percentage: 5, amount: 2500 },
    fixedAllowance: { percentage: 10, amount: 5000 }
  });

  const [pfRates, setPfRates] = useState({
    employeeRate: 12,
    employerRate: 12
  });

  // Security state
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const loadProfile = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.getMyProfile();
      const p = res.data;
      setProfile(p);

      if (p) {
        setBio(p.bio || '');
        setSkills(p.skills ? p.skills.join(', ') : '');
        setCertifications(p.certifications ? p.certifications.join(', ') : '');
        setJobPassion(p.jobPassion || '');

        setPhone(p.phone || '');
        setEmergencyContact(p.emergencyContact || '');
        setStreet(p.address?.street || '');
        setCity(p.address?.city || '');
        setState(p.address?.state || '');
        setZip(p.address?.zip || '');
        setBankAccount(p.bankDetails?.accountNumber || '');
        setBankIfsc(p.bankDetails?.ifscCode || '');
        setBankName(p.bankDetails?.bankName || '');

        const mw = p.monthWage || (p.basicSalary ? p.basicSalary * 2 : 50000);
        setMonthWage(mw);
        setYearlyWage(mw * 12);
        setWorkingDays(p.workingDaysPerWeek || 5);
        setBreakHours(p.breakTimeHours || 1);
        setProfTax(p.professionalTax || 200);

        if (p.salaryComponents) {
          setComponents({
            basic: { percentage: p.salaryComponents.basic?.percentage || 50, amount: (mw * (p.salaryComponents.basic?.percentage || 50)) / 100 },
            hra: { percentage: p.salaryComponents.hra?.percentage || 20, amount: (mw * (p.salaryComponents.hra?.percentage || 20)) / 100 },
            standardAllowance: { percentage: p.salaryComponents.standardAllowance?.percentage || 10, amount: (mw * (p.salaryComponents.standardAllowance?.percentage || 10)) / 100 },
            performanceBonus: { percentage: p.salaryComponents.performanceBonus?.percentage || 5, amount: (mw * (p.salaryComponents.performanceBonus?.percentage || 5)) / 100 },
            lta: { percentage: p.salaryComponents.lta?.percentage || 5, amount: (mw * (p.salaryComponents.lta?.percentage || 5)) / 100 },
            fixedAllowance: { percentage: p.salaryComponents.fixedAllowance?.percentage || 10, amount: (mw * (p.salaryComponents.fixedAllowance?.percentage || 10)) / 100 }
          });
        }

        if (p.pfContribution) {
          setPfRates({
            employeeRate: p.pfContribution.employeeRate || 12,
            employerRate: p.pfContribution.employerRate || 12
          });
        }
      }
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, []);

  const handleMonthWageChange = (val) => {
    const wage = parseFloat(val) || 0;
    setMonthWage(wage);
    setYearlyWage(wage * 12);

    setComponents(prev => ({
      basic: { ...prev.basic, amount: (wage * prev.basic.percentage) / 100 },
      hra: { ...prev.hra, amount: (wage * prev.hra.percentage) / 100 },
      standardAllowance: { ...prev.standardAllowance, amount: (wage * prev.standardAllowance.percentage) / 100 },
      performanceBonus: { ...prev.performanceBonus, amount: (wage * prev.performanceBonus.percentage) / 100 },
      lta: { ...prev.lta, amount: (wage * prev.lta.percentage) / 100 },
      fixedAllowance: { ...prev.fixedAllowance, amount: (wage * prev.fixedAllowance.percentage) / 100 }
    }));
  };

  const handleYearlyWageChange = (val) => {
    const yearly = parseFloat(val) || 0;
    setYearlyWage(yearly);
    const wage = yearly / 12;
    setMonthWage(wage);

    setComponents(prev => ({
      basic: { ...prev.basic, amount: (wage * prev.basic.percentage) / 100 },
      hra: { ...prev.hra, amount: (wage * prev.hra.percentage) / 100 },
      standardAllowance: { ...prev.standardAllowance, amount: (wage * prev.standardAllowance.percentage) / 100 },
      performanceBonus: { ...prev.performanceBonus, amount: (wage * prev.performanceBonus.percentage) / 100 },
      lta: { ...prev.lta, amount: (wage * prev.lta.percentage) / 100 },
      fixedAllowance: { ...prev.fixedAllowance, amount: (wage * prev.fixedAllowance.percentage) / 100 }
    }));
  };

  const handleSaveResume = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const data = {
        bio,
        skills: skills.split(',').map(s => s.trim()).filter(Boolean),
        certifications: certifications.split(',').map(s => s.trim()).filter(Boolean),
        jobPassion
      };
      await api.updateMyProfile(data);
      showToast('Resume & Work profile updated successfully!', 'success');
    } catch (err) {
      showToast(err.message, 'danger');
    } finally {
      setSaving(false);
    }
  };

  const handleSavePrivate = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const data = {
        phone,
        emergencyContact,
        address: { street, city, state, zip },
        bankDetails: { accountNumber: bankAccount, ifscCode: bankIfsc, bankName }
      };
      await api.updateMyProfile(data);
      showToast('Private information saved!', 'success');
    } catch (err) {
      showToast(err.message, 'danger');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveSalary = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const data = {
        monthWage,
        yearlyWage,
        workingDaysPerWeek: workingDays,
        breakTimeHours: breakHours,
        professionalTax: profTax,
        salaryComponents: components,
        pfContribution: pfRates
      };
      await api.updateMyProfile(data);
      showToast('Salary settings saved!', 'success');
    } catch (err) {
      showToast(err.message, 'danger');
    } finally {
      setSaving(false);
    }
  };

  const handleSecurityChange = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      showToast('New passwords do not match.', 'danger');
      return;
    }
    setSaving(true);
    try {
      await api.changePassword(oldPassword, newPassword);
      showToast('Password updated successfully!', 'success');
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      showToast(err.message, 'danger');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="empty-state"><div className="spinner spinner-primary"></div><p>Loading profile...</p></div>;
  }

  if (error) {
    return <div className="auth-alert error"><i className="fas fa-exclamation-circle"></i> {error}</div>;
  }

  const basicAmount = components.basic.amount || (monthWage * components.basic.percentage) / 100;
  const pfEmployeeAmount = (basicAmount * pfRates.employeeRate) / 100;
  const pfEmployerAmount = (basicAmount * pfRates.employerRate) / 100;

  return (
    <>
      <div className="page-header">
        <div className="page-title">
          <h2>My Profile</h2>
          <p>Manage your account settings, personal details and preferences</p>
        </div>
      </div>

      <div className="card mb-4">
        <div className="profile-header-banner p-4" style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <div
            className="user-avatar gradient-avatar"
            style={{
              width: 72,
              height: 72,
              borderRadius: '50%',
              fontSize: '1.75rem',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              flexShrink: 0
            }}
          >
            {user?.name?.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() || 'U'}
          </div>
          <div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0, color: 'var(--text-main)' }}>{user?.name}</h2>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: 4 }}>
              <span>{profile?.designation || user?.role?.replace('_', ' ').toUpperCase()}</span> &bull; <span>{profile?.department || 'EmPay Member'}</span> &bull; <span>{profile?.employeeCode || user?.email}</span>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div style={{ display: 'flex', borderBottom: '1px solid var(--border-color)', padding: '0 24px', background: 'var(--bg-alt)' }}>
          <button
            className={`btn-tab ${activeTab === 'resume' ? 'active' : ''}`}
            onClick={() => setActiveTab('resume')}
            style={{
              padding: '12px 18px',
              border: 'none',
              background: 'none',
              fontWeight: 600,
              cursor: 'pointer',
              color: activeTab === 'resume' ? 'var(--primary-color)' : 'var(--text-muted)',
              borderBottom: activeTab === 'resume' ? '2px solid var(--primary-color)' : '2px solid transparent'
            }}
          >
            <i className="fas fa-file-alt" style={{ marginRight: 6 }}></i> Resume & Work
          </button>
          <button
            className={`btn-tab ${activeTab === 'private' ? 'active' : ''}`}
            onClick={() => setActiveTab('private')}
            style={{
              padding: '12px 18px',
              border: 'none',
              background: 'none',
              fontWeight: 600,
              cursor: 'pointer',
              color: activeTab === 'private' ? 'var(--primary-color)' : 'var(--text-muted)',
              borderBottom: activeTab === 'private' ? '2px solid var(--primary-color)' : '2px solid transparent'
            }}
          >
            <i className="fas fa-user-shield" style={{ marginRight: 6 }}></i> Private Information
          </button>
          <button
            className={`btn-tab ${activeTab === 'salary' ? 'active' : ''}`}
            onClick={() => setActiveTab('salary')}
            style={{
              padding: '12px 18px',
              border: 'none',
              background: 'none',
              fontWeight: 600,
              cursor: 'pointer',
              color: activeTab === 'salary' ? 'var(--primary-color)' : 'var(--text-muted)',
              borderBottom: activeTab === 'salary' ? '2px solid var(--primary-color)' : '2px solid transparent'
            }}
          >
            <i className="fas fa-money-bill-wave" style={{ marginRight: 6 }}></i> Salary & Compensation
          </button>
          <button
            className={`btn-tab ${activeTab === 'security' ? 'active' : ''}`}
            onClick={() => setActiveTab('security')}
            style={{
              padding: '12px 18px',
              border: 'none',
              background: 'none',
              fontWeight: 600,
              cursor: 'pointer',
              color: activeTab === 'security' ? 'var(--primary-color)' : 'var(--text-muted)',
              borderBottom: activeTab === 'security' ? '2px solid var(--primary-color)' : '2px solid transparent'
            }}
          >
            <i className="fas fa-key" style={{ marginRight: 6 }}></i> Security
          </button>
        </div>

        {/* Tab 1: Resume & Work */}
        {activeTab === 'resume' && (
          <form onSubmit={handleSaveResume} style={{ padding: 24, maxWidth: 700 }}>
            <div className="form-group mb-3">
              <label className="form-label">About Me / Bio</label>
              <textarea
                className="form-control"
                rows="4"
                placeholder="Tell us about yourself, your background, and your goals..."
                value={bio}
                onChange={e => setBio(e.target.value)}
              ></textarea>
            </div>
            <div className="form-group mb-3">
              <label className="form-label">Skills (comma separated)</label>
              <input
                type="text"
                className="form-control"
                placeholder="JavaScript, React, Node.js, UI/UX"
                value={skills}
                onChange={e => setSkills(e.target.value)}
              />
            </div>
            <div className="form-group mb-3">
              <label className="form-label">Certifications (comma separated)</label>
              <input
                type="text"
                className="form-control"
                placeholder="AWS Certified Practitioner, Scrum Master"
                value={certifications}
                onChange={e => setCertifications(e.target.value)}
              />
            </div>
            <div className="form-group mb-4">
              <label className="form-label">What I Love About My Job</label>
              <input
                type="text"
                className="form-control"
                placeholder="Building great products with an amazing team"
                value={jobPassion}
                onChange={e => setJobPassion(e.target.value)}
              />
            </div>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              <i className="fas fa-save" style={{ marginRight: 6 }}></i>
              {saving ? 'Saving...' : 'Save Work Details'}
            </button>
          </form>
        )}

        {/* Tab 2: Private Information */}
        {activeTab === 'private' && (
          <form onSubmit={handleSavePrivate} style={{ padding: 24, maxWidth: 700 }}>
            <div className="grid-2 gap-3 mb-3">
              <div className="form-group mb-0">
                <label className="form-label">Phone Number</label>
                <input
                  type="tel"
                  className="form-control"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  placeholder="+91 9876543210"
                />
              </div>
              <div className="form-group mb-0">
                <label className="form-label">Emergency Contact</label>
                <input
                  type="tel"
                  className="form-control"
                  value={emergencyContact}
                  onChange={e => setEmergencyContact(e.target.value)}
                  placeholder="Emergency phone or contact"
                />
              </div>
            </div>

            <h4 style={{ margin: '20px 0 10px', fontSize: 14, color: 'var(--primary-color)' }}>Address</h4>
            <div className="form-group mb-3">
              <label className="form-label">Street</label>
              <input
                type="text"
                className="form-control"
                value={street}
                onChange={e => setStreet(e.target.value)}
                placeholder="123 Main St"
              />
            </div>
            <div className="grid-3 gap-3 mb-3">
              <div className="form-group mb-0">
                <label className="form-label">City</label>
                <input
                  type="text"
                  className="form-control"
                  value={city}
                  onChange={e => setCity(e.target.value)}
                />
              </div>
              <div className="form-group mb-0">
                <label className="form-label">State</label>
                <input
                  type="text"
                  className="form-control"
                  value={state}
                  onChange={e => setState(e.target.value)}
                />
              </div>
              <div className="form-group mb-0">
                <label className="form-label">PIN Code</label>
                <input
                  type="text"
                  className="form-control"
                  value={zip}
                  onChange={e => setZip(e.target.value)}
                />
              </div>
            </div>

            <h4 style={{ margin: '20px 0 10px', fontSize: 14, color: 'var(--primary-color)' }}>Bank Information</h4>
            <div className="grid-3 gap-3 mb-4">
              <div className="form-group mb-0">
                <label className="form-label">Bank Name</label>
                <input
                  type="text"
                  className="form-control"
                  value={bankName}
                  onChange={e => setBankName(e.target.value)}
                />
              </div>
              <div className="form-group mb-0">
                <label className="form-label">Account Number</label>
                <input
                  type="text"
                  className="form-control"
                  value={bankAccount}
                  onChange={e => setBankAccount(e.target.value)}
                />
              </div>
              <div className="form-group mb-0">
                <label className="form-label">IFSC Code</label>
                <input
                  type="text"
                  className="form-control"
                  value={bankIfsc}
                  onChange={e => setBankIfsc(e.target.value)}
                />
              </div>
            </div>

            <button type="submit" className="btn btn-primary" disabled={saving}>
              <i className="fas fa-save" style={{ marginRight: 6 }}></i>
              {saving ? 'Saving...' : 'Save Private Info'}
            </button>
          </form>
        )}

        {/* Tab 3: Salary & Compensation */}
        {activeTab === 'salary' && (
          <form onSubmit={handleSaveSalary} style={{ padding: 24, maxWidth: 800 }}>
            <div className="grid-2 gap-3 mb-4">
              <div className="form-group mb-0">
                <label className="form-label">Monthly Wage (₹)</label>
                <input
                  type="number"
                  className="form-control"
                  value={monthWage}
                  onChange={e => handleMonthWageChange(e.target.value)}
                />
              </div>
              <div className="form-group mb-0">
                <label className="form-label">Yearly Wage (₹)</label>
                <input
                  type="number"
                  className="form-control"
                  value={yearlyWage}
                  onChange={e => handleYearlyWageChange(e.target.value)}
                />
              </div>
            </div>

            <div className="grid-3 gap-3 mb-4">
              <div className="form-group mb-0">
                <label className="form-label">Working Days / Week</label>
                <input
                  type="number"
                  className="form-control"
                  value={workingDays}
                  onChange={e => setWorkingDays(Number(e.target.value))}
                />
              </div>
              <div className="form-group mb-0">
                <label className="form-label">Break Time (Hours)</label>
                <input
                  type="number"
                  className="form-control"
                  value={breakHours}
                  onChange={e => setBreakHours(Number(e.target.value))}
                />
              </div>
              <div className="form-group mb-0">
                <label className="form-label">Professional Tax (₹)</label>
                <input
                  type="number"
                  className="form-control"
                  value={profTax}
                  onChange={e => setProfTax(Number(e.target.value))}
                />
              </div>
            </div>

            <h4 style={{ margin: '20px 0 10px', fontSize: 14, color: 'var(--primary-color)' }}>Salary Components Breakdown</h4>
            <div className="table-responsive mb-4">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Component</th>
                    <th>Percentage (%)</th>
                    <th>Monthly Amount (₹)</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(components).map(([key, comp]) => (
                    <tr key={key}>
                      <td style={{ textTransform: 'capitalize' }}>{key.replace(/([A-Z])/g, ' $1')}</td>
                      <td>{comp.percentage}%</td>
                      <td style={{ fontWeight: 600 }}>₹{(comp.amount || 0).toLocaleString('en-IN')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <h4 style={{ margin: '20px 0 10px', fontSize: 14, color: 'var(--primary-color)' }}>Provident Fund (PF) Contribution</h4>
            <div className="grid-2 gap-3 mb-4">
              <div className="p-3" style={{ background: 'var(--bg-alt)', borderRadius: 'var(--border-radius-sm)' }}>
                <div className="text-muted" style={{ fontSize: '0.8rem' }}>Employee PF ({pfRates.employeeRate}%)</div>
                <div style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--danger-color)' }}>
                  -₹{pfEmployeeAmount.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                </div>
              </div>
              <div className="p-3" style={{ background: 'var(--bg-alt)', borderRadius: 'var(--border-radius-sm)' }}>
                <div className="text-muted" style={{ fontSize: '0.8rem' }}>Employer PF ({pfRates.employerRate}%)</div>
                <div style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--primary-color)' }}>
                  ₹{pfEmployerAmount.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                </div>
              </div>
            </div>

            <button type="submit" className="btn btn-primary" disabled={saving}>
              <i className="fas fa-save" style={{ marginRight: 6 }}></i>
              {saving ? 'Saving...' : 'Save Salary Configuration'}
            </button>
          </form>
        )}

        {/* Tab 4: Security */}
        {activeTab === 'security' && (
          <form onSubmit={handleSecurityChange} style={{ padding: 24, maxWidth: 500 }}>
            <div className="form-group mb-3">
              <label className="form-label">Current Password</label>
              <input
                type="password"
                className="form-control"
                value={oldPassword}
                onChange={e => setOldPassword(e.target.value)}
                required
              />
            </div>
            <div className="form-group mb-3">
              <label className="form-label">New Password</label>
              <input
                type="password"
                className="form-control"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                required
              />
            </div>
            <div className="form-group mb-4">
              <label className="form-label">Confirm New Password</label>
              <input
                type="password"
                className="form-control"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                required
              />
            </div>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              <i className="fas fa-lock" style={{ marginRight: 6 }}></i>
              {saving ? 'Updating...' : 'Update Password'}
            </button>
          </form>
        )}
      </div>
    </>
  );
}
