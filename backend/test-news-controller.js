import { getAllNews } from './controllers/news.controller.js';

// Mock request and response objects
const mockReq = {};
const mockRes = {
  json: (data) => {
    console.log('Response data:', JSON.stringify(data, null, 2));
  },
  status: (code) => {
    console.log('Status code:', code);
    return mockRes;
  }
};

console.log('Testing getAllNews function...');
getAllNews(mockReq, mockRes);