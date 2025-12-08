// Test file to verify API URL construction
import { auth, domains as domainsApi, news as newsApi, users as usersApi, subscribers as subscribersApi } from './services/api';

console.log('Testing API URL resolution...');
console.log('Check the browser console to see if the API calls are using the correct URL');

// This will trigger the API calls that are failing
setTimeout(() => {
  console.log('Attempting to fetch domains...');
  domainsApi.getAll().catch(err => console.error('Domain fetch error:', err));
}, 1000);