"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
const auth_routes_1 = __importDefault(require("./routes/auth.routes"));
const tenders_routes_1 = __importDefault(require("./routes/tenders.routes"));
const applications_routes_1 = __importDefault(require("./routes/applications.routes"));
const documents_routes_1 = __importDefault(require("./routes/documents.routes"));
const admin_routes_1 = __importDefault(require("./routes/admin.routes"));
const ai_routes_1 = __importDefault(require("./routes/ai.routes"));
const errorHandler_1 = require("./middleware/errorHandler");
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = process.env.PORT || 3001;
// Middleware
app.use((0, cors_1.default)({ origin: process.env.FRONTEND_URL || 'http://localhost:5173' }));
app.use(express_1.default.json());
app.use('/uploads', express_1.default.static(path_1.default.join(__dirname, '../../uploads')));
// Routes
app.use('/api/auth', auth_routes_1.default);
app.use('/api/tenders', tenders_routes_1.default);
app.use('/api/applications', applications_routes_1.default);
app.use('/api/documents', documents_routes_1.default);
app.use('/api/admin', admin_routes_1.default);
app.use('/api/ai', ai_routes_1.default);
// Health Check
app.get('/health', (req, res) => {
    res.json({ status: 'ok', time: new Date() });
});
// Error Handling Middleware
app.use(errorHandler_1.errorHandler);
app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});
