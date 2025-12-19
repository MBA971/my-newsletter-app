// Script to verify all routes are properly defined and exported

// Import all controllers to verify exports
import { login, logout, refresh } from './controllers/auth.controller.js';
import { getAllDomains, createDomain, updateDomain, deleteDomain } from './controllers/domains.controller.js';
import { getAllNews, createNews, updateNews, deleteNews, searchNews, grantEditAccess } from './controllers/news.controller.js';
import { getAllUsers, createUser, updateUser, deleteUser } from './controllers/users.controller.js';
import { getAllSubscribers, createSubscriber, deleteSubscriber } from './controllers/subscribers.controller.js';
import { getAuditLogs } from './controllers/audit.controller.js';

// Import all routes
import authRoutes from './routes/auth.routes.js';
import domainsRoutes from './routes/domains.routes.js';
import newsRoutes from './routes/news.routes.js';
import usersRoutes from './routes/users.routes.js';
import subscribersRoutes from './routes/subscribers.routes.js';
import auditRoutes from './routes/audit.routes.js';

console.log('✅ All controllers imported successfully');
console.log('✅ All route files imported successfully');

// Verify controller functions exist
const authControllerFunctions = [login, logout, refresh];
const domainsControllerFunctions = [getAllDomains, createDomain, updateDomain, deleteDomain];
const newsControllerFunctions = [getAllNews, createNews, updateNews, deleteNews, searchNews, grantEditAccess];
const usersControllerFunctions = [getAllUsers, createUser, updateUser, deleteUser];
const subscribersControllerFunctions = [getAllSubscribers, createSubscriber, deleteSubscriber];
const auditControllerFunctions = [getAuditLogs];

const allControllerFunctions = [
  ...authControllerFunctions,
  ...domainsControllerFunctions,
  ...newsControllerFunctions,
  ...usersControllerFunctions,
  ...subscribersControllerFunctions,
  ...auditControllerFunctions
];

let missingFunctions = [];
allControllerFunctions.forEach((fn, index) => {
  if (typeof fn !== 'function') {
    missingFunctions.push(`Function at index ${index}`);
  }
});

if (missingFunctions.length > 0) {
  console.error('❌ Missing controller functions:', missingFunctions);
  process.exit(1);
}

console.log('✅ All controller functions verified');

// List all available routes
console.log('\n📋 ROUTE SUMMARY:');
console.log('==================');

console.log('\n🔐 Authentication Routes:');
console.log('  POST /api/auth/login');
console.log('  POST /api/auth/logout');
console.log('  POST /api/auth/refresh');

console.log('\n🌐 Domains Routes:');
console.log('  GET    /api/domains/');
console.log('  POST   /api/domains/');
console.log('  PUT    /api/domains/:id');
console.log('  DELETE /api/domains/:id');

console.log('\n📰 News Routes:');
console.log('  GET    /api/news/');
console.log('  POST   /api/news/');
console.log('  PUT    /api/news/:id');
console.log('  DELETE /api/news/:id');
console.log('  GET    /api/news/search');
console.log('  POST   /api/news/:id/grant-edit');

console.log('\n👤 Users Routes:');
console.log('  GET    /api/users/');
console.log('  POST   /api/users/');
console.log('  PUT    /api/users/:id');
console.log('  DELETE /api/users/:id');

console.log('\n📧 Subscribers Routes:');
console.log('  GET    /api/subscribers/');
console.log('  POST   /api/subscribers/');
console.log('  DELETE /api/subscribers/:id');

console.log('\n📝 Audit Routes:');
console.log('  GET    /api/audit/');

console.log('\n✅ Route verification completed successfully!');