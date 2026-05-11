const PDFDocument = require('pdfkit');

/**
 * Generate a payslip PDF
 * @param {Object} payslip - Payslip data (populated with employee)
 * @param {Object} employee - Employee data (populated with user)
 * @returns {PDFDocument} - PDF document stream
 */
function generatePayslipPDF(payslip, employee, user) {
  const doc = new PDFDocument({ size: 'A4', margin: 50 });

  const months = ['January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'];

  // Header
  doc.fontSize(22).font('Helvetica-Bold').fillColor('#714B67')
    .text('EmPay', { align: 'center' });
  doc.fontSize(10).font('Helvetica').fillColor('#666')
    .text('Smart Human Resource Management System', { align: 'center' });
  doc.moveDown(0.5);

  // Line separator
  doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke('#714B67');
  doc.moveDown(0.5);

  // Title
  doc.fontSize(16).font('Helvetica-Bold').fillColor('#333')
    .text(`Payslip - ${months[payslip.month - 1]} ${payslip.year}`, { align: 'center' });
  doc.moveDown(1);

  // Employee Info
  const infoY = doc.y;
  doc.fontSize(10).font('Helvetica-Bold').fillColor('#714B67').text('EMPLOYEE DETAILS');
  doc.moveDown(0.3);
  doc.fontSize(10).font('Helvetica').fillColor('#333');
  doc.text(`Name: ${user.name}`);
  doc.text(`Employee Code: ${employee.employeeCode}`);
  doc.text(`Department: ${employee.department}`);
  doc.text(`Designation: ${employee.designation}`);
  doc.text(`PF Number: ${employee.pfNumber || 'N/A'}`);
  doc.text(`Bank Account: ${employee.bankAccount || 'N/A'}`);
  doc.moveDown(1);

  // Earnings Table
  doc.fontSize(10).font('Helvetica-Bold').fillColor('#714B67').text('EARNINGS');
  doc.moveDown(0.3);

  const drawRow = (label, value, bold = false) => {
    const y = doc.y;
    doc.fontSize(10).font(bold ? 'Helvetica-Bold' : 'Helvetica').fillColor('#333');
    doc.text(label, 70, y, { width: 250 });
    doc.text(`₹ ${value.toLocaleString('en-IN')}`, 350, y, { width: 150, align: 'right' });
    doc.moveDown(0.3);
  };

  drawRow('Basic Pay', payslip.basicPay);
  drawRow('House Rent Allowance (HRA)', payslip.hra);
  drawRow('Special Allowances', payslip.allowances);
  doc.moveTo(70, doc.y).lineTo(500, doc.y).stroke('#ddd');
  doc.moveDown(0.2);
  drawRow('Gross Salary', payslip.grossSalary, true);
  doc.moveDown(0.5);

  // Deductions Table
  doc.fontSize(10).font('Helvetica-Bold').fillColor('#714B67').text('DEDUCTIONS');
  doc.moveDown(0.3);

  drawRow('Employee PF (12%)', payslip.employeePF);
  drawRow('Professional Tax', payslip.professionalTax);
  drawRow(`LOP Deduction (${payslip.lopDays} days)`, payslip.lopDeduction);
  doc.moveTo(70, doc.y).lineTo(500, doc.y).stroke('#ddd');
  doc.moveDown(0.2);
  drawRow('Total Deductions', payslip.totalDeductions, true);
  doc.moveDown(0.5);

  // Net Pay
  doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke('#714B67');
  doc.moveDown(0.5);
  doc.fontSize(14).font('Helvetica-Bold').fillColor('#714B67');
  const netY = doc.y;
  doc.text('NET PAY', 70, netY, { width: 250 });
  doc.text(`₹ ${payslip.netPay.toLocaleString('en-IN')}`, 350, netY, { width: 150, align: 'right' });
  doc.moveDown(1);

  // Attendance Summary
  doc.fontSize(10).font('Helvetica').fillColor('#666');
  doc.text(`Working Days: ${payslip.workingDays} | Present Days: ${payslip.presentDays} | LOP Days: ${payslip.lopDays}`);
  doc.moveDown(1);

  // Footer
  doc.fontSize(8).fillColor('#999')
    .text('This is a computer-generated payslip and does not require a signature.', { align: 'center' });
  doc.text(`Generated on ${new Date().toLocaleDateString('en-IN')}`, { align: 'center' });

  return doc;
}

module.exports = { generatePayslipPDF };
