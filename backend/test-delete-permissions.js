// Test script to verify delete permissions for news articles

// Mock request and response objects for testing
const createMockReq = (user, params) => ({
  user,
  params
});

const createMockRes = () => {
  const res = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
    send: jest.fn().mockReturnThis()
  };
  return res;
};

// Mock database pool
const mockPool = {
  query: jest.fn()
};

// Mock the database pool in the news controller
jest.mock('./utils/database.js', () => mockPool);

// Import the deleteNews function
import { deleteNews } from './controllers/news.controller.js';

describe('Delete News Permissions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('Admin can delete any article', async () => {
    const req = createMockReq({ role: 'admin', username: 'admin' }, { id: 1 });
    const res = createMockRes();
    
    mockPool.query
      .mockResolvedValueOnce({ rows: [{ id: 1, author: 'other_user' }] }) // SELECT query
      .mockResolvedValueOnce({}); // DELETE query
    
    await deleteNews(req, res);
    
    expect(res.json).toHaveBeenCalledWith({ message: 'News deleted' });
  });

  test('Author can delete their own article', async () => {
    const req = createMockReq({ role: 'contributor', username: 'author' }, { id: 1 });
    const res = createMockRes();
    
    mockPool.query
      .mockResolvedValueOnce({ rows: [{ id: 1, author: 'author' }] }) // SELECT query
      .mockResolvedValueOnce({}); // DELETE query
    
    await deleteNews(req, res);
    
    expect(res.json).toHaveBeenCalledWith({ message: 'News deleted' });
  });

  test('Non-author contributor cannot delete article', async () => {
    const req = createMockReq({ role: 'contributor', username: 'other_user' }, { id: 1 });
    const res = createMockRes();
    
    mockPool.query
      .mockResolvedValueOnce({ rows: [{ id: 1, author: 'author' }] }); // SELECT query
    
    await deleteNews(req, res);
    
    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({ error: 'You do not have permission to delete this article' });
  });
});

console.log('✅ Delete permissions test structure verified');