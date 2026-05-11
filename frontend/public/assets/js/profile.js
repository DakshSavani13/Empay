async function renderProfile(container) {
  try {
    const res = await api.getMyProfile();
    const profile = res.data;
    const user = profile.userId;

    const isAdminOrPayroll = currentUser.role === 'admin' || currentUser.role === 'payroll_officer';
    const initials = user.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();

    // Default structure for salaryComponents if missing
    const salary = profile.salaryComponents || {
      basic: { percentage: 50, amount: 0 },
      hra: { percentage: 50, amount: 0 },
      standardAllowance: { percentage: 16.67, amount: 0 },
      performanceBonus: { percentage: 8.33, amount: 0 },
      lta: { percentage: 8.33, amount: 0 },
      fixedAllowance: { percentage: 11.67, amount: 0 }
    };
    const pf = profile.pfContribution || { employeeRate: 12, employerRate: 12 };

    container.innerHTML = `
      <div class="page-header">
        <div class="page-title">
          <h2>My Profile</h2>
          <p>Manage your personal, professional, and financial information</p>
        </div>
      </div>

      <div class="card mb-4" style="overflow: hidden;">
        <div style="height: 120px; background: linear-gradient(135deg, var(--primary-color), var(--accent-color));"></div>
        <div class="card-body" style="position: relative; padding-top: 0; padding-bottom: 2rem;">
          <div class="d-flex justify-between" style="align-items: flex-end; margin-top: -50px; margin-bottom: 1.5rem;">
            <div class="d-flex gap-4" style="align-items: flex-end;">
              <div class="profile-avatar d-flex align-center justify-center" style="width: 100px; height: 100px; background: var(--bg-surface); border: 4px solid var(--bg-body); border-radius: 50%; font-size: 2.5rem; font-weight: 700; color: var(--primary-color); box-shadow: var(--shadow-md); z-index: 2; position: relative;">
                ${initials}
              </div>
              <div style="padding-bottom: 0; z-index: 2; position: relative;">
                <h2 style="font-size: 1.5rem; margin-bottom: 0.25rem;">${user.name}</h2>
                <div class="text-muted d-flex align-center gap-2">
                  <i class="fas fa-briefcase"></i> ${profile.department || 'General'}
                  <span style="color: var(--border-color);">|</span>
                  <i class="fas fa-id-badge"></i> ${profile.employeeCode || 'N/A'}
                </div>
              </div>
            </div>
            <div class="d-flex gap-2" style="z-index: 2; position: relative; margin-bottom: 0.5rem;">
              <span class="badge badge-success" style="font-size: 0.875rem; padding: 0.5rem 1rem;"><i class="fas fa-check-circle"></i> Active Employee</span>
            </div>
          </div>

          <div class="grid-4 gap-3 p-3" style="background: var(--bg-alt); border-radius: var(--border-radius-sm); border: 1px solid var(--border-color);">
            <div>
              <div class="text-muted" style="font-size: 0.75rem; font-weight: 600; text-transform: uppercase;">Email</div>
              <div style="font-weight: 500; font-size: 0.875rem;">${user.email}</div>
            </div>
            <div>
              <div class="text-muted" style="font-size: 0.75rem; font-weight: 600; text-transform: uppercase;">Mobile</div>
              <div style="font-weight: 500; font-size: 0.875rem;">${profile.phone || 'Not provided'}</div>
            </div>
            <div>
              <div class="text-muted" style="font-size: 0.75rem; font-weight: 600; text-transform: uppercase;">Location</div>
              <div style="font-weight: 500; font-size: 0.875rem;">${profile.location || 'Remote'}</div>
            </div>
            <div>
              <div class="text-muted" style="font-size: 0.75rem; font-weight: 600; text-transform: uppercase;">Joined</div>
              <div style="font-weight: 500; font-size: 0.875rem;">${profile.dateOfJoining ? new Date(profile.dateOfJoining).toLocaleDateString() : 'N/A'}</div>
            </div>
          </div>
        </div>
      </div>

      <div class="card p-0">
        <div class="tabs-header d-flex" style="border-bottom: 1px solid var(--border-color); padding: 0 1rem;">
          <button class="profile-tab-btn active" data-tab="resume" style="padding: 1rem 1.5rem; background: transparent; border: none; border-bottom: 2px solid var(--primary-color); color: var(--primary-color); font-weight: 600; cursor: pointer;">Resume</button>
          <button class="profile-tab-btn" data-tab="private-info" style="padding: 1rem 1.5rem; background: transparent; border: none; border-bottom: 2px solid transparent; color: var(--text-muted); font-weight: 600; cursor: pointer;">Private Info</button>
          ${isAdminOrPayroll ? '<button class="profile-tab-btn" data-tab="salary-info" style="padding: 1rem 1.5rem; background: transparent; border: none; border-bottom: 2px solid transparent; color: var(--text-muted); font-weight: 600; cursor: pointer;">Salary Configuration</button>' : ''}
          <button class="profile-tab-btn" data-tab="security" style="padding: 1rem 1.5rem; background: transparent; border: none; border-bottom: 2px solid transparent; color: var(--text-muted); font-weight: 600; cursor: pointer;">Security</button>
        </div>

        <div class="card-body p-4">
          <!-- Resume Tab -->
          <div class="profile-tab-content active" id="tab-resume">
            <form id="resumeForm">
              <div class="form-group">
                <label class="form-label"><i class="fas fa-user-circle text-muted"></i> About Me</label>
                <textarea class="form-control" name="about" rows="3" placeholder="Write a short bio...">${profile.about || ''}</textarea>
              </div>
              <div class="form-group">
                <label class="form-label"><i class="fas fa-heart text-muted"></i> What I love about my job</label>
                <textarea class="form-control" name="jobLove" rows="2">${profile.jobLove || ''}</textarea>
              </div>
              <div class="form-group">
                <label class="form-label"><i class="fas fa-star text-muted"></i> My interests and hobbies</label>
                <textarea class="form-control" name="interests" rows="2">${profile.interests || ''}</textarea>
              </div>
              <div class="grid-2 gap-3">
                <div class="form-group">
                  <label class="form-label">Skills <span class="text-muted" style="font-weight:normal;">(comma separated)</span></label>
                  <input type="text" class="form-control" name="skills" placeholder="e.g. JavaScript, Design, Marketing" value="${(profile.skills || []).join(', ')}">
                </div>
                <div class="form-group">
                  <label class="form-label">Certifications <span class="text-muted" style="font-weight:normal;">(comma separated)</span></label>
                  <input type="text" class="form-control" name="certifications" placeholder="e.g. AWS Cloud Practitioner" value="${(profile.certifications || []).join(', ')}">
                </div>
              </div>
              <div class="text-right mt-3">
                <button type="submit" class="btn btn-primary"><i class="fas fa-save"></i> Save Resume</button>
              </div>
            </form>
          </div>

          <!-- Private Info Tab -->
          <div class="profile-tab-content" id="tab-private-info" style="display: none;">
            <form id="privateInfoForm">
              <div class="grid-2 gap-4">
                <div>
                  <h3 class="mb-4 d-flex align-center gap-2"><i class="fas fa-id-card text-muted"></i> Personal Details</h3>
                  <div class="form-group">
                    <label class="form-label">Date of Birth</label>
                    <input type="date" class="form-control" name="dateOfBirth" value="${profile.dateOfBirth ? new Date(profile.dateOfBirth).toISOString().split('T')[0] : ''}">
                  </div>
                  <div class="form-group">
                    <label class="form-label">Residing Address</label>
                    <input type="text" class="form-control" name="address" value="${profile.address || ''}">
                  </div>
                  <div class="form-group">
                    <label class="form-label">Nationality</label>
                    <input type="text" class="form-control" name="nationality" value="${profile.nationality || ''}">
                  </div>
                  <div class="form-group">
                    <label class="form-label">Personal Email</label>
                    <input type="email" class="form-control" name="personalEmail" value="${profile.personalEmail || ''}">
                  </div>
                  <div class="grid-2 gap-2">
                    <div class="form-group">
                      <label class="form-label">Gender</label>
                      <select class="form-control" name="gender">
                        <option value="">Select Gender</option>
                        <option value="Male" ${profile.gender === 'Male' ? 'selected' : ''}>Male</option>
                        <option value="Female" ${profile.gender === 'Female' ? 'selected' : ''}>Female</option>
                        <option value="Other" ${profile.gender === 'Other' ? 'selected' : ''}>Other</option>
                      </select>
                    </div>
                    <div class="form-group">
                      <label class="form-label">Marital Status</label>
                      <select class="form-control" name="maritalStatus">
                        <option value="">Select Status</option>
                        <option value="Single" ${profile.maritalStatus === 'Single' ? 'selected' : ''}>Single</option>
                        <option value="Married" ${profile.maritalStatus === 'Married' ? 'selected' : ''}>Married</option>
                        <option value="Divorced" ${profile.maritalStatus === 'Divorced' ? 'selected' : ''}>Divorced</option>
                      </select>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h3 class="mb-4 d-flex align-center gap-2"><i class="fas fa-university text-muted"></i> Bank Details</h3>
                  <div class="form-group">
                    <label class="form-label">Account Number</label>
                    <input type="text" class="form-control" name="bankAccount" value="${profile.bankAccount || ''}">
                  </div>
                  <div class="form-group">
                    <label class="form-label">Bank Name</label>
                    <input type="text" class="form-control" name="bankName" value="${profile.bankName || ''}">
                  </div>
                  <div class="form-group">
                    <label class="form-label">IFSC Code</label>
                    <input type="text" class="form-control" name="ifscCode" value="${profile.ifscCode || ''}">
                  </div>
                  <div class="grid-2 gap-2">
                    <div class="form-group">
                      <label class="form-label">PAN No.</label>
                      <input type="text" class="form-control" name="panNo" value="${profile.panNo || ''}">
                    </div>
                    <div class="form-group">
                      <label class="form-label">UAN No.</label>
                      <input type="text" class="form-control" name="uanNo" value="${profile.uanNo || ''}">
                    </div>
                  </div>
                </div>
              </div>
              <div class="text-right mt-3 pt-3" style="border-top: 1px solid var(--border-color);">
                <button type="submit" class="btn btn-primary"><i class="fas fa-save"></i> Save Private Info</button>
              </div>
            </form>
          </div>

          <!-- Salary Info Tab -->
          ${isAdminOrPayroll ? `
          <div class="profile-tab-content" id="tab-salary-info" style="display: none;">
            <form id="salaryInfoForm">
              <div class="p-3 mb-4" style="background: var(--bg-alt); border-radius: var(--border-radius); border: 1px solid var(--border-color);">
                <h4 class="mb-3">Wage Definition</h4>
                <div class="grid-4 gap-3">
                  <div class="form-group mb-0">
                    <label class="form-label">Monthly Wage (₹)</label>
                    <input type="number" class="form-control" name="monthWage" value="${profile.monthWage || 0}" step="0.01">
                  </div>
                  <div class="form-group mb-0">
                    <label class="form-label">Yearly Wage (₹)</label>
                    <input type="number" class="form-control" name="yearlyWage" value="${profile.yearlyWage || 0}" step="0.01">
                  </div>
                  <div class="form-group mb-0">
                    <label class="form-label">Working Days/Week</label>
                    <input type="number" class="form-control" name="workingDaysPerWeek" value="${profile.workingDaysPerWeek || 5}">
                  </div>
                  <div class="form-group mb-0">
                    <label class="form-label">Break Time (Hours)</label>
                    <input type="number" class="form-control" name="breakTimeHours" value="${profile.breakTimeHours || 1}" step="0.5">
                  </div>
                </div>
              </div>
              
              <div class="grid-2 gap-4">
                <div>
                  <h4 class="mb-3 d-flex align-center gap-2"><i class="fas fa-coins text-muted"></i> Salary Components <span class="badge badge-info" style="font-size:0.65rem;">Auto-Calculated</span></h4>
                  
                  <div class="component-row d-flex align-center gap-3 mb-3 pb-3" style="border-bottom: 1px dashed var(--border-color);">
                    <div style="flex: 1;">
                      <div class="d-flex justify-between mb-1"><span style="font-weight: 500;">Basic Salary</span> <span class="text-muted">${salary.basic.percentage}%</span></div>
                      <input type="number" class="form-control" name="salaryComponents.basic.percentage" value="${salary.basic.percentage}" style="display:none;">
                      <div class="input-icon">
                        <i class="fas fa-rupee-sign"></i>
                        <input type="number" class="form-control" style="padding-left: 30px;" name="salaryComponents.basic.amount" id="sc_basic_amount" value="${salary.basic.amount}" readonly>
                      </div>
                    </div>
                  </div>

                  <div class="component-row d-flex align-center gap-3 mb-3 pb-3" style="border-bottom: 1px dashed var(--border-color);">
                    <div style="flex: 1;">
                      <div class="d-flex justify-between mb-1"><span style="font-weight: 500;">HRA</span> <span class="text-muted">${salary.hra.percentage}%</span></div>
                      <input type="number" class="form-control" name="salaryComponents.hra.percentage" value="${salary.hra.percentage}" style="display:none;">
                      <div class="input-icon">
                        <i class="fas fa-rupee-sign"></i>
                        <input type="number" class="form-control" style="padding-left: 30px;" name="salaryComponents.hra.amount" id="sc_hra_amount" value="${salary.hra.amount}" readonly>
                      </div>
                    </div>
                  </div>

                  <div class="component-row d-flex align-center gap-3 mb-3 pb-3" style="border-bottom: 1px dashed var(--border-color);">
                    <div style="flex: 1;">
                      <div class="d-flex justify-between mb-1"><span style="font-weight: 500;">Standard Allowance</span> <span class="text-muted">${salary.standardAllowance.percentage}%</span></div>
                      <input type="number" class="form-control" name="salaryComponents.standardAllowance.percentage" value="${salary.standardAllowance.percentage}" style="display:none;">
                      <div class="input-icon">
                        <i class="fas fa-rupee-sign"></i>
                        <input type="number" class="form-control" style="padding-left: 30px;" name="salaryComponents.standardAllowance.amount" id="sc_sa_amount" value="${salary.standardAllowance.amount}" readonly>
                      </div>
                    </div>
                  </div>

                  <div class="component-row d-flex align-center gap-3 mb-3 pb-3" style="border-bottom: 1px dashed var(--border-color);">
                    <div style="flex: 1;">
                      <div class="d-flex justify-between mb-1"><span style="font-weight: 500;">Performance Bonus</span> <span class="text-muted">${salary.performanceBonus.percentage}%</span></div>
                      <input type="number" class="form-control" name="salaryComponents.performanceBonus.percentage" value="${salary.performanceBonus.percentage}" style="display:none;">
                      <div class="input-icon">
                        <i class="fas fa-rupee-sign"></i>
                        <input type="number" class="form-control" style="padding-left: 30px;" name="salaryComponents.performanceBonus.amount" id="sc_pb_amount" value="${salary.performanceBonus.amount}" readonly>
                      </div>
                    </div>
                  </div>

                  <div class="component-row d-flex align-center gap-3 mb-3 pb-3" style="border-bottom: 1px dashed var(--border-color);">
                    <div style="flex: 1;">
                      <div class="d-flex justify-between mb-1"><span style="font-weight: 500;">LTA</span> <span class="text-muted">${salary.lta.percentage}%</span></div>
                      <input type="number" class="form-control" name="salaryComponents.lta.percentage" value="${salary.lta.percentage}" style="display:none;">
                      <div class="input-icon">
                        <i class="fas fa-rupee-sign"></i>
                        <input type="number" class="form-control" style="padding-left: 30px;" name="salaryComponents.lta.amount" id="sc_lta_amount" value="${salary.lta.amount}" readonly>
                      </div>
                    </div>
                  </div>

                  <div class="component-row d-flex align-center gap-3 mb-3">
                    <div style="flex: 1;">
                      <div class="d-flex justify-between mb-1"><span style="font-weight: 500;">Fixed Allowance</span> <span class="text-muted">${salary.fixedAllowance.percentage}%</span></div>
                      <input type="number" class="form-control" name="salaryComponents.fixedAllowance.percentage" value="${salary.fixedAllowance.percentage}" style="display:none;">
                      <div class="input-icon">
                        <i class="fas fa-rupee-sign"></i>
                        <input type="number" class="form-control" style="padding-left: 30px;" name="salaryComponents.fixedAllowance.amount" id="sc_fa_amount" value="${salary.fixedAllowance.amount}" readonly>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h4 class="mb-3 d-flex align-center gap-2"><i class="fas fa-piggy-bank text-muted"></i> Deductions</h4>
                  <div class="p-3 mb-4" style="background: rgba(239, 68, 68, 0.05); border: 1px solid rgba(239, 68, 68, 0.2); border-radius: var(--border-radius-sm);">
                    <h5 class="mb-3">Provident Fund (PF)</h5>
                    <div class="grid-2 gap-3 mb-3">
                      <div>
                        <div class="d-flex justify-between mb-1"><span style="font-weight: 500; font-size: 0.875rem;">Employee (${pf.employeeRate}%)</span></div>
                        <input type="number" class="form-control" name="pfContribution.employeeRate" value="${pf.employeeRate}" style="display:none;">
                        <input type="number" class="form-control" name="pf_employee_amount" id="pf_employee_amount" value="${(salary.basic.amount * pf.employeeRate / 100).toFixed(2)}" readonly>
                      </div>
                      <div>
                        <div class="d-flex justify-between mb-1"><span style="font-weight: 500; font-size: 0.875rem;">Employer (${pf.employerRate}%)</span></div>
                        <input type="number" class="form-control" name="pfContribution.employerRate" value="${pf.employerRate}" style="display:none;">
                        <input type="number" class="form-control" name="pf_employer_amount" id="pf_employer_amount" value="${(salary.basic.amount * pf.employerRate / 100).toFixed(2)}" readonly>
                      </div>
                    </div>
                    
                    <h5 class="mb-2 mt-4">Statutory Taxes</h5>
                    <div class="form-group mb-0">
                      <label class="form-label" style="font-size: 0.875rem;">Professional Tax</label>
                      <div class="input-icon">
                        <i class="fas fa-rupee-sign"></i>
                        <input type="number" class="form-control" style="padding-left: 30px;" name="professionalTax" value="${profile.professionalTax || 200}">
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div class="text-right mt-4 pt-3" style="border-top: 1px solid var(--border-color);">
                <button type="submit" class="btn btn-primary"><i class="fas fa-save"></i> Save Configuration</button>
              </div>
            </form>
          </div>
          ` : ''}

          <!-- Security Tab -->
          <div class="profile-tab-content" id="tab-security" style="display: none;">
            <div style="max-width: 500px; margin: 0 auto; padding: 2rem 0;">
              <div class="text-center mb-4">
                <div class="stat-icon warning mx-auto mb-3" style="width: 64px; height: 64px; font-size: 1.5rem;"><i class="fas fa-shield-alt"></i></div>
                <h3>Password Management</h3>
                <p class="text-muted">Ensure your account is using a long, random password to stay secure.</p>
              </div>
              <form id="securityForm">
                <div class="form-group">
                  <label class="form-label">Login ID</label>
                  <input type="text" class="form-control" value="${user.email}" disabled style="background: var(--bg-alt);">
                </div>
                <div class="form-group">
                  <label class="form-label">Current Password</label>
                  <input type="password" class="form-control" name="oldPassword" required>
                </div>
                <div class="form-group">
                  <label class="form-label">New Password</label>
                  <input type="password" class="form-control" name="newPassword" required>
                </div>
                <div class="form-group">
                  <label class="form-label">Confirm New Password</label>
                  <input type="password" class="form-control" name="confirmPassword" required>
                </div>
                <button type="submit" class="btn btn-primary w-100 mt-2"><i class="fas fa-key"></i> Update Password</button>
              </form>
            </div>
          </div>
        </div>
      </div>
    `;

    // Tab Switching Logic
    const tabs = container.querySelectorAll('.profile-tab-btn');
    const contents = container.querySelectorAll('.profile-tab-content');
    
    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        // Reset all tabs
        tabs.forEach(t => {
          t.classList.remove('active');
          t.style.borderBottomColor = 'transparent';
          t.style.color = 'var(--text-muted)';
        });
        contents.forEach(c => {
          c.classList.remove('active');
          c.style.display = 'none';
        });
        
        // Activate selected tab
        tab.classList.add('active');
        tab.style.borderBottomColor = 'var(--primary-color)';
        tab.style.color = 'var(--primary-color)';
        
        const contentId = `tab-${tab.dataset.tab}`;
        const contentEl = container.querySelector(`#${contentId}`);
        contentEl.classList.add('active');
        contentEl.style.display = 'block';
        
        // Add subtle fade animation
        contentEl.style.animation = 'fadeIn 0.3s ease-out forwards';
      });
    });

    // Custom CSS for input icons if needed
    if (!document.getElementById('profile-styles')) {
      const style = document.createElement('style');
      style.id = 'profile-styles';
      style.textContent = `
        .input-icon { position: relative; }
        .input-icon i { position: absolute; left: 12px; top: 50%; transform: translateY(-50%); color: var(--text-muted); font-size: 0.875rem; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
      `;
      document.head.appendChild(style);
    }

    // Form Handling Methods (same functionality, updated toast notification)
    const handleUpdate = async (e, formId) => {
      e.preventDefault();
      const form = document.getElementById(formId);
      const submitBtn = form.querySelector('button[type="submit"]');
      const originalHtml = submitBtn.innerHTML;
      submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';
      submitBtn.disabled = true;

      try {
        const formData = new FormData(form);
        const data = Object.fromEntries(formData.entries());
        
        if(data.skills !== undefined) data.skills = data.skills.split(',').map(s => s.trim()).filter(Boolean);
        if(data.certifications !== undefined) data.certifications = data.certifications.split(',').map(s => s.trim()).filter(Boolean);
        
        await api.updateMyProfile(data);
        if (typeof showToast === 'function') showToast('Profile updated successfully!', 'success');
        else alert('Profile updated successfully!');
      } catch (err) {
        if (typeof showToast === 'function') showToast(err.message, 'danger');
        else alert(err.message);
      } finally {
        submitBtn.innerHTML = originalHtml;
        submitBtn.disabled = false;
      }
    };

    document.getElementById('resumeForm')?.addEventListener('submit', (e) => handleUpdate(e, 'resumeForm'));
    document.getElementById('privateInfoForm')?.addEventListener('submit', (e) => handleUpdate(e, 'privateInfoForm'));
    
    document.getElementById('salaryInfoForm')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const form = document.getElementById('salaryInfoForm');
      const submitBtn = form.querySelector('button[type="submit"]');
      const originalHtml = submitBtn.innerHTML;
      submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';
      submitBtn.disabled = true;

      try {
        const formData = new FormData(form);
        const data = Object.fromEntries(formData.entries());
        
        const structuredData = {
          monthWage: data.monthWage,
          yearlyWage: data.yearlyWage,
          workingDaysPerWeek: data.workingDaysPerWeek,
          breakTimeHours: data.breakTimeHours,
          professionalTax: data.professionalTax,
          salaryComponents: {
            basic: { percentage: data['salaryComponents.basic.percentage'], amount: data['salaryComponents.basic.amount'] },
            hra: { percentage: data['salaryComponents.hra.percentage'], amount: data['salaryComponents.hra.amount'] },
            standardAllowance: { percentage: data['salaryComponents.standardAllowance.percentage'], amount: data['salaryComponents.standardAllowance.amount'] },
            performanceBonus: { percentage: data['salaryComponents.performanceBonus.percentage'], amount: data['salaryComponents.performanceBonus.amount'] },
            lta: { percentage: data['salaryComponents.lta.percentage'], amount: data['salaryComponents.lta.amount'] },
            fixedAllowance: { percentage: data['salaryComponents.fixedAllowance.percentage'], amount: data['salaryComponents.fixedAllowance.amount'] }
          },
          pfContribution: {
            employeeRate: data['pfContribution.employeeRate'],
            employerRate: data['pfContribution.employerRate']
          }
        };

        await api.updateMyProfile(structuredData);
        if (typeof showToast === 'function') showToast('Salary configuration saved!', 'success');
        else alert('Salary configuration saved!');
      } catch (err) {
        if (typeof showToast === 'function') showToast(err.message, 'danger');
        else alert(err.message);
      } finally {
        submitBtn.innerHTML = originalHtml;
        submitBtn.disabled = false;
      }
    });

    document.getElementById('securityForm')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const form = document.getElementById('securityForm');
      const submitBtn = form.querySelector('button[type="submit"]');
      
      const oldPassword = form.oldPassword.value;
      const newPassword = form.newPassword.value;
      const confirmPassword = form.confirmPassword.value;

      if (newPassword !== confirmPassword) {
        if (typeof showToast === 'function') showToast('New passwords do not match.', 'danger');
        else alert("New passwords do not match.");
        return;
      }

      const originalHtml = submitBtn.innerHTML;
      submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
      submitBtn.disabled = true;

      try {
        await api.changePassword(oldPassword, newPassword);
        if (typeof showToast === 'function') showToast('Password changed successfully! Please log in again.', 'success');
        else alert('Password changed successfully! Please log in again.');
        
        setTimeout(() => {
          form.reset();
          localStorage.removeItem('token');
          location.hash = '#login';
        }, 2000);
      } catch (err) {
        if (typeof showToast === 'function') showToast(err.message, 'danger');
        else alert(err.message);
        submitBtn.innerHTML = originalHtml;
        submitBtn.disabled = false;
      }
    });

    // Real-time Salary Calculations
    const monthWageInput = container.querySelector('input[name="monthWage"]');
    const yearlyWageInput = container.querySelector('input[name="yearlyWage"]');
    
    if (monthWageInput && yearlyWageInput) {
      monthWageInput.addEventListener('input', (e) => {
        const wage = parseFloat(e.target.value) || 0;
        yearlyWageInput.value = (wage * 12).toFixed(2);
        
        const basicAmt = (wage * salary.basic.percentage / 100);
        container.querySelector('#sc_basic_amount').value = basicAmt.toFixed(2);
        container.querySelector('#sc_hra_amount').value = (wage * salary.hra.percentage / 100).toFixed(2);
        container.querySelector('#sc_sa_amount').value = (wage * salary.standardAllowance.percentage / 100).toFixed(2);
        container.querySelector('#sc_pb_amount').value = (wage * salary.performanceBonus.percentage / 100).toFixed(2);
        container.querySelector('#sc_lta_amount').value = (wage * salary.lta.percentage / 100).toFixed(2);
        container.querySelector('#sc_fa_amount').value = (wage * salary.fixedAllowance.percentage / 100).toFixed(2);

        container.querySelector('#pf_employee_amount').value = (basicAmt * pf.employeeRate / 100).toFixed(2);
        container.querySelector('#pf_employer_amount').value = (basicAmt * pf.employerRate / 100).toFixed(2);
      });
      
      yearlyWageInput.addEventListener('input', (e) => {
        const yearly = parseFloat(e.target.value) || 0;
        monthWageInput.value = (yearly / 12).toFixed(2);
        monthWageInput.dispatchEvent(new Event('input'));
      });
    }

  } catch(e) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="stat-icon danger mb-3" style="width: 64px; height: 64px; font-size: 2rem; margin: 0 auto;"><i class="fas fa-exclamation-triangle"></i></div>
        <h3 class="mb-2">Error Loading Profile</h3>
        <p class="text-muted mb-4">${e.message}</p>
        <button class="btn btn-primary" onclick="renderProfile(document.getElementById('contentArea'))">
          <i class="fas fa-sync"></i> Try Again
        </button>
      </div>
    `;
  }
}
