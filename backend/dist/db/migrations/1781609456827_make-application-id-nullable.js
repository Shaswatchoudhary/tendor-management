"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.shorthands = void 0;
exports.up = up;
exports.down = down;
exports.shorthands = undefined;
async function up(pgm) {
    pgm.alterColumn('documents', 'application_id', { notNull: false });
}
async function down(pgm) {
    pgm.alterColumn('documents', 'application_id', { notNull: true });
}
