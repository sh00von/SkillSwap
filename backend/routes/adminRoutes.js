const express   = require('express')
const router    = express.Router()
const adminC    = require('../controllers/adminController')
const adminAuth = require('../middleware/adminAuth')

// Public
router.post('/login', adminC.login)

// Admin-protected
router.use(adminAuth)

// List all users
router.get('/users', adminC.getUsers)

// List all skills
router.get('/skills', adminC.getSkills)

// === ID Verification Routes ===

// 1. List all pending verifications
//    GET /admin/verifications/pending
router.get(
  '/verifications/pending',
  adminC.listPendingVerifications
)

// 2. Approve a pending verification
//    PUT /admin/verifications/:id/approve
router.put(
  '/verifications/:id/approve',
  adminC.approveVerification
)

// 3. Reject a pending verification
//    PUT /admin/verifications/:id/reject
router.put(
  '/verifications/:id/reject',
  adminC.rejectVerification
)

module.exports = router
