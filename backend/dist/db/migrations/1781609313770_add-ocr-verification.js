"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.shorthands = void 0;
exports.up = up;
exports.down = down;
exports.shorthands = undefined;
async function up(pgm) {
    pgm.addColumn('ocr_results', {
        verified: { type: 'boolean', default: false },
        verification_json: { type: 'jsonb' },
    });
}
async function down(pgm) {
    pgm.dropColumn('ocr_results', ['verified', 'verification_json']);
}
