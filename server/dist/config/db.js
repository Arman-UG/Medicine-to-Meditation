"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.query = exports.pool = void 0;
const pg_1 = require("pg");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
exports.pool = new pg_1.Pool({
    host: process.env.PGHOST || '127.0.0.1',
    port: parseInt(process.env.PGPORT || '5434', 10),
    database: process.env.PGDATABASE || 'calm_db',
    user: process.env.PGUSER || 'postgres',
    password: process.env.PGPASSWORD || undefined,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 3000,
});
exports.pool.on('error', (err) => {
    console.error('Unexpected error on idle PostgreSQL client:', err);
});
const query = (text, params) => exports.pool.query(text, params);
exports.query = query;
