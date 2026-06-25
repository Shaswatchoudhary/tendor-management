"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const ai_controller_1 = require("../controllers/ai.controller");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
// Protect this route so only authenticated users can invoke AI generation
router.post('/generate', auth_1.requireAuth, ai_controller_1.generateAIContent);
exports.default = router;
