import { useState } from 'react';
import { useAuth } from '../context/AuthContext';

const DEMO_ACCOUNTS = [
  {
    role: 'Admin',
    name: 'Admin User',
    email: 'admin@empay.com',
    pass: 'Admin@123',
    icon: 'fas fa-shield-alt',
    color: '#818cf8',
    desc: 'Full access: employees, leaves, payroll, roles'
  },
  {
    role: 'HR Officer',
    name: 'Priya Sharma',
    email: 'hr@empay.com',
    pass: 'Hr@12345',
    icon: 'fas fa-users-cog',
    color: '#34d399',
    desc: 'People management: employees & leave approvals'
  },
  {
    role: 'Payroll Officer',
    name: 'Rahul Patel',
    email: 'payroll@empay.com',
    pass: 'Pay@12345',
    icon: 'fas fa-money-check-alt',
    color: '#fbbf24',
    desc: 'Finance: generate payruns & salary statements'
  },
  {
    role: 'Employee',
    name: 'Ankit Kumar',
    email: 'ankit@empay.com',
    pass: 'Emp@12345',
    icon: 'fas fa-user-tie',
    color: '#60a5fa',
    desc: 'Self-service: attendance, leaves & payslips'
  }
];

export default function LoginPage() {
  const { login, signup } = useAuth();
  const [isSignup, setIsSignup] = useState(false);
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState(null);

  // Login form state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Signup form state
  const [signupCompany, setSignupCompany] = useState('');
  const [signupName, setSignupName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPhone, setSignupPhone] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupConfirmPassword, setSignupConfirmPassword] = useState('');

  const showAlert = (message, type = 'error') => {
    setAlert({ message, type });
    setTimeout(() => setAlert(null), 5000);
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(loginEmail, loginPassword);
    } catch (error) {
      showAlert(error.message);
    } finally {
      setLoading(false);
    }
  };

  const fillDemoAccount = (demo) => {
    setLoginEmail(demo.email);
    setLoginPassword(demo.pass);
    showAlert(`Filled credentials for ${demo.role} (${demo.name})`, 'success');
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    if (signupPassword !== signupConfirmPassword) {
      return showAlert('Passwords do not match');
    }
    setLoading(true);
    try {
      const response = await signup({
        name: signupName,
        email: signupEmail,
        password: signupPassword,
        companyName: signupCompany,
        role: 'admin',
        phone: signupPhone
      });
      if (response.success) {
        showAlert('Registration successful! Please sign in.', 'success');
        setIsSignup(false);
        setLoginEmail(response.data.loginId || signupEmail);
        setLoginPassword('');
      }
    } catch (error) {
      showAlert(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-wrapper" style={{ maxWidth: 480 }}>
        <div className="glass-card auth-card">
          <div className="auth-header">
            <div className="auth-logo-wrapper">
              <div className="ep-logo">
                <span className="ep-logo-text">EP</span>
                <div className="ep-logo-dot"></div>
              </div>
            </div>
            <div className="auth-brand-name">
              Em<span className="gradient-text">Pay</span>
            </div>
            <h1 style={{ fontSize: '1.4rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '0.25rem' }}>
              {isSignup ? 'Create Account' : 'Welcome Back'}
            </h1>
            <p className="text-muted">
              {isSignup ? 'Register your company on EmPay' : 'Sign in to your EmPay account'}
            </p>
          </div>

          {alert && (
            <div className={`auth-alert ${alert.type}`}>
              {alert.message}
            </div>
          )}

          {/* Login Form */}
          {!isSignup && (
            <>
              {/* Demo Credentials Quick-Select Banner for Supervision / Review */}
              <div
                style={{
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--border-radius)',
                  padding: '12px 14px',
                  marginBottom: '1.25rem'
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: '8px'
                  }}
                >
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--primary-color)' }}>
                    <i className="fas fa-magic" style={{ marginRight: '6px' }}></i>
                    Demo Review Credentials
                  </span>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Click to fill</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  {DEMO_ACCOUNTS.map((d) => (
                    <button
                      key={d.role}
                      type="button"
                      onClick={() => fillDemoAccount(d)}
                      className="glass-btn"
                      style={{
                        padding: '8px 10px',
                        borderRadius: '6px',
                        fontSize: '0.75rem',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'flex-start',
                        gap: '2px',
                        border: '1px solid rgba(255, 255, 255, 0.08)',
                        background: 'rgba(15, 23, 42, 0.5)',
                        cursor: 'pointer',
                        textAlign: 'left'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: d.color, fontWeight: 600 }}>
                        <i className={d.icon} style={{ fontSize: '0.75rem' }}></i>
                        <span>{d.role}</span>
                      </div>
                      <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', width: '100%' }}>
                        {d.email}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              <form className="modern-form" onSubmit={handleLogin}>
                <div className="form-group text-left">
                  <label className="form-label">Email or Employee Code</label>
                  <div className="input-icon-wrapper">
                    <i className="fas fa-envelope input-icon"></i>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="john@example.com"
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      required
                    />
                  </div>
                </div>
                <div className="form-group text-left">
                  <label className="form-label">Password</label>
                  <div className="input-icon-wrapper">
                    <i className="fas fa-lock input-icon"></i>
                    <input
                      type="password"
                      className="form-control"
                      placeholder="••••••••"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      required
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  className="btn btn-primary btn-glow"
                  style={{ width: '100%', marginTop: '1rem' }}
                  disabled={loading}
                >
                  <span className="btn-text">{loading ? 'Signing In...' : 'Sign In'}</span>
                  <div className="btn-shine"></div>
                </button>
                <div className="auth-switch-text">
                  Don't have an account?{' '}
                  <a href="#" className="auth-link" onClick={(e) => { e.preventDefault(); setIsSignup(true); setAlert(null); }}>
                    Register Company
                  </a>
                </div>
              </form>
            </>
          )}

          {/* Signup Form */}
          {isSignup && (
            <form className="modern-form" onSubmit={handleSignup}>
              <div className="form-group text-left">
                <label className="form-label">Company Name</label>
                <div className="input-icon-wrapper">
                  <i className="fas fa-building input-icon"></i>
                  <input type="text" className="form-control" placeholder="Acme Corp" value={signupCompany} onChange={e => setSignupCompany(e.target.value)} required />
                </div>
              </div>
              <div className="form-group text-left">
                <label className="form-label">Full Name</label>
                <div className="input-icon-wrapper">
                  <i className="fas fa-user input-icon"></i>
                  <input type="text" className="form-control" placeholder="John Doe" value={signupName} onChange={e => setSignupName(e.target.value)} required />
                </div>
              </div>
              <div className="form-group text-left">
                <label className="form-label">Email Address</label>
                <div className="input-icon-wrapper">
                  <i className="fas fa-envelope input-icon"></i>
                  <input type="email" className="form-control" placeholder="john@example.com" value={signupEmail} onChange={e => setSignupEmail(e.target.value)} required />
                </div>
              </div>
              <div className="form-group text-left">
                <label className="form-label">Phone</label>
                <div className="input-icon-wrapper">
                  <i className="fas fa-phone input-icon"></i>
                  <input type="tel" className="form-control" placeholder="+1 234 567 8900" value={signupPhone} onChange={e => setSignupPhone(e.target.value)} required />
                </div>
              </div>
              <div className="form-group text-left">
                <label className="form-label">Password</label>
                <div className="input-icon-wrapper">
                  <i className="fas fa-lock input-icon"></i>
                  <input type="password" className="form-control" placeholder="••••••••" value={signupPassword} onChange={e => setSignupPassword(e.target.value)} required />
                </div>
              </div>
              <div className="form-group text-left">
                <label className="form-label">Confirm Password</label>
                <div className="input-icon-wrapper">
                  <i className="fas fa-lock input-icon"></i>
                  <input type="password" className="form-control" placeholder="••••••••" value={signupConfirmPassword} onChange={e => setSignupConfirmPassword(e.target.value)} required />
                </div>
              </div>
              <button type="submit" className="btn btn-primary btn-glow" style={{ width: '100%', marginTop: '1rem' }} disabled={loading}>
                <span className="btn-text">{loading ? 'Creating...' : 'Create Account'}</span>
                <div className="btn-shine"></div>
              </button>
              <div className="auth-switch-text">
                Already have an account?{' '}
                <a href="#" className="auth-link" onClick={(e) => { e.preventDefault(); setIsSignup(false); setAlert(null); }}>
                  Sign In
                </a>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
