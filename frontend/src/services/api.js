const API_URL = import.meta.env.VITE_API_URL || '/api';

class ApiService {
  constructor() {
    this.token = localStorage.getItem('empay_token');
  }

  setToken(token) {
    this.token = token;
    localStorage.setItem('empay_token', token);
  }

  clearToken() {
    this.token = null;
    localStorage.removeItem('empay_token');
    localStorage.removeItem('empay_user');
  }

  getHeaders() {
    const headers = { 'Content-Type': 'application/json' };
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }
    return headers;
  }

  async request(endpoint, options = {}) {
    try {
      const config = {
        ...options,
        headers: this.getHeaders(),
      };

      if (options.body && typeof options.body !== 'string') {
        config.body = JSON.stringify(options.body);
      }

      const response = await fetch(`${API_URL}${endpoint}`, config);

      // Handle PDF downloads specifically
      if (response.headers.get('content-type')?.includes('application/pdf')) {
        const blob = await response.blob();
        return { success: true, blob };
      }

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 401 && !endpoint.includes('/auth/login')) {
          this.clearToken();
          window.location.reload();
        }
        throw new Error(data.message || 'Something went wrong');
      }

      return data;
    } catch (error) {
      console.error(`API Error (${endpoint}):`, error);
      throw error;
    }
  }

  // Auth
  login(email, password) { return this.request('/auth/login', { method: 'POST', body: { email, password } }); }
  register(data) { return this.request('/auth/register', { method: 'POST', body: data }); }
  signup(data) { return this.request('/auth/signup', { method: 'POST', body: data }); }
  getMe() { return this.request('/auth/me'); }
  changePassword(oldPassword, newPassword) {
    return this.request('/auth/change-password', {
      method: 'POST',
      body: { oldPassword, newPassword }
    });
  }
  getAllUsers() { return this.request('/auth/users'); }
  updateUserRole(id, role) { return this.request(`/auth/role/${id}`, { method: 'PUT', body: { role } }); }

  // Attendance
  checkIn(latitude, longitude) {
    const localDate = new Date().toLocaleDateString('en-CA');
    return this.request('/attendance/checkin', { method: 'POST', body: { latitude, longitude, localDate } });
  }
  checkOut(latitude, longitude) {
    const localDate = new Date().toLocaleDateString('en-CA');
    return this.request('/attendance/checkout', { method: 'POST', body: { latitude, longitude, localDate } });
  }
  getTodayAttendance() {
    const localDate = new Date().toLocaleDateString('en-CA');
    return this.request(`/attendance/today?localDate=${localDate}`);
  }
  getMyAttendance(month, year) {
    const qs = month && year ? `?month=${month}&year=${year}` : '';
    return this.request(`/attendance/my${qs}`);
  }
  getAllAttendance(date) {
    const qs = date ? `?date=${date}` : '';
    return this.request(`/attendance/all${qs}`);
  }

  // Leave
  applyLeave(data) { return this.request('/leave/apply', { method: 'POST', body: data }); }
  getMyLeaves() { return this.request('/leave/my'); }
  getAllLeaves() { return this.request('/leave/all'); }
  approveLeave(id) { return this.request(`/leave/${id}/approve`, { method: 'PUT' }); }
  rejectLeave(id, reason) { return this.request(`/leave/${id}/reject`, { method: 'PUT', body: { reason } }); }
  allocateLeave(data) { return this.request('/leave/allocate', { method: 'POST', body: data }); }

  // Payroll
  generatePayrun(month, year) { return this.request('/payroll/payrun', { method: 'POST', body: { month, year } }); }
  getPayruns() { return this.request('/payroll/payruns'); }
  finalizePayrun(id) { return this.request(`/payroll/payrun/${id}/finalize`, { method: 'PUT' }); }
  getPayslips(month, year) {
    const qs = month && year ? `?month=${month}&year=${year}` : '';
    return this.request(`/payroll/payslips${qs}`);
  }
  getMyPayslips() { return this.request('/payroll/payslips/my'); }
  getPayslip(id) { return this.request(`/payroll/payslip/${id}`); }
  downloadPayslip(id) { return this.request(`/payroll/payslip/${id}/pdf`); }

  // Dashboard & Analytics
  getOverview() { return this.request('/analytics/overview'); }

  // Employees
  getAllEmployees() { return this.request('/employees'); }
  createEmployee(data) { return this.request('/employees', { method: 'POST', body: data }); }
  updateEmployee(id, data) { return this.request(`/employees/${id}`, { method: 'PUT', body: data }); }
  getMyProfile() { return this.request('/employees/me'); }
  updateMyProfile(data) { return this.request('/employees/me', { method: 'PUT', body: data }); }

  // Reports
  getSalaryStatement(employeeId, year) {
    return this.request(`/reports/salary-statement?employeeId=${employeeId}&year=${year}`);
  }
}

const api = new ApiService();
export default api;
