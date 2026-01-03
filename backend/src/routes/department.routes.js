const express = require('express');
const router = express.Router();
const {
    getDepartments,
    getDepartmentsDetailed,
    getDoctorsByDepartment,
    createDepartment,
    getDepartmentMembers,
    addMemberToDepartment,
    removeMemberFromDepartment,
    toggleMemberStatus
} = require('../controllers/department.controller');
const { protect, authorize } = require('../middleware/auth.middleware');

router.get('/', getDepartments);
// Admin-only detailed listing with counts
router.get('/detailed', protect, authorize('admin'), getDepartmentsDetailed);
router.get('/:deptId/doctors', protect, getDoctorsByDepartment);
// Add a doctor to a department (admin)
router.post('/:deptId/members', protect, authorize('admin'), addMemberToDepartment);
router.post('/', protect, authorize('admin'), createDepartment);
router.get('/:deptId/members', protect, authorize('admin'), getDepartmentMembers);
// Remove a doctor from their department (admin)
router.delete('/members/:doctorId', protect, authorize('admin'), removeMemberFromDepartment);
router.put('/members/:doctorId/status', protect, authorize('admin'), toggleMemberStatus);

module.exports = router;
