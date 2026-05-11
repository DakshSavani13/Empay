const express = require('express');
const router = express.Router();
const { generatePayrun, getPayslips, getPayslip, getMyPayslips, downloadPayslipPDF, finalizePayrun, getPayruns } = require('../controllers/payrollController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

router.post('/payrun', protect, authorize('admin', 'payroll_officer'), generatePayrun);
router.get('/payruns', protect, authorize('admin', 'payroll_officer'), getPayruns);
router.put('/payrun/:id/finalize', protect, authorize('admin', 'payroll_officer'), finalizePayrun);
router.get('/payslips', protect, authorize('admin', 'payroll_officer'), getPayslips);
router.get('/payslips/my', protect, getMyPayslips);
router.get('/payslip/:id', protect, getPayslip);
router.get('/payslip/:id/pdf', protect, downloadPayslipPDF);

module.exports = router;
