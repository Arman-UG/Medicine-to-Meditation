"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const adminController_1 = require("../controllers/adminController");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
// Server-side authentication and role-based authorization for all admin routes
router.use(auth_1.authenticateToken);
router.use(auth_1.requireAdmin);
router.get('/stats', adminController_1.getAdminStats);
router.get('/users', adminController_1.getUsersList);
router.get('/payments', adminController_1.getPaymentsList);
router.get('/subscriptions', adminController_1.getSubscriptionsList);
router.put('/activities/:id', adminController_1.updateActivityContent);
router.put('/audio-tracks/:id', adminController_1.updateAudioTrack);
exports.default = router;
