const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');
const Employee = require('./models/Employee');
const LeaveAllocation = require('./models/LeaveAllocation');

dotenv.config();

const seedData = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    // Clear existing data
    await User.deleteMany({});
    await Employee.deleteMany({});
    await LeaveAllocation.deleteMany({});

    // Create Admin
    const admin = await User.create({ name: 'Admin User', email: 'admin@empay.com', password: 'Admin@123', role: 'admin' });
    const adminEmp = await Employee.create({ userId: admin._id, employeeCode: 'EMP0001', department: 'Management', designation: 'System Administrator', joiningDate: new Date('2024-01-01'), basicSalary: 50000, hra: 20000, allowances: 10000 });
    admin.employeeId = adminEmp._id; await admin.save();

    // Create HR Officer
    const hr = await User.create({ name: 'Priya Sharma', email: 'hr@empay.com', password: 'Hr@12345', role: 'hr_officer' });
    const hrEmp = await Employee.create({ userId: hr._id, employeeCode: 'EMP0002', department: 'Human Resources', designation: 'HR Manager', joiningDate: new Date('2024-02-15'), basicSalary: 40000, hra: 16000, allowances: 8000 });
    hr.employeeId = hrEmp._id; await hr.save();

    // Create Payroll Officer
    const po = await User.create({ name: 'Rahul Patel', email: 'payroll@empay.com', password: 'Pay@12345', role: 'payroll_officer' });
    const poEmp = await Employee.create({ userId: po._id, employeeCode: 'EMP0003', department: 'Finance', designation: 'Payroll Manager', joiningDate: new Date('2024-03-01'), basicSalary: 38000, hra: 15200, allowances: 7600 });
    po.employeeId = poEmp._id; await po.save();

    // Create Employees
    const empData = [
      { name: 'Ankit Kumar', email: 'ankit@empay.com', dept: 'Engineering', desg: 'Software Developer', basic: 35000 },
      { name: 'Sneha Gupta', email: 'sneha@empay.com', dept: 'Engineering', desg: 'Frontend Developer', basic: 32000 },
      { name: 'Vikram Singh', email: 'vikram@empay.com', dept: 'Marketing', desg: 'Marketing Executive', basic: 28000 },
      { name: 'Meera Joshi', email: 'meera@empay.com', dept: 'Design', desg: 'UI/UX Designer', basic: 30000 },
      { name: 'Arjun Reddy', email: 'arjun@empay.com', dept: 'Engineering', desg: 'Backend Developer', basic: 36000 }
    ];

    for (let i = 0; i < empData.length; i++) {
      const u = await User.create({ name: empData[i].name, email: empData[i].email, password: 'Emp@12345', role: 'employee' });
      const e = await Employee.create({ userId: u._id, employeeCode: `EMP${String(i + 4).padStart(4, '0')}`, department: empData[i].dept, designation: empData[i].desg, joiningDate: new Date('2024-04-01'), basicSalary: empData[i].basic, hra: Math.round(empData[i].basic * 0.4), allowances: Math.round(empData[i].basic * 0.2) });
      u.employeeId = e._id; await u.save();
      await LeaveAllocation.create({ employeeId: e._id, year: 2026, casual: { total: 12, used: 0 }, sick: { total: 10, used: 0 }, earned: { total: 15, used: 0 } });
    }

    console.log('\n✅ Database seeded successfully!\n');
    console.log('Login Credentials:');
    console.log('Admin:   admin@empay.com / Admin@123');
    console.log('HR:      hr@empay.com / Hr@12345');
    console.log('Payroll: payroll@empay.com / Pay@12345');
    console.log('Employee: ankit@empay.com / Emp@12345');
    process.exit(0);
  } catch (e) { console.error('Seed error:', e.message); process.exit(1); }
};

seedData();
