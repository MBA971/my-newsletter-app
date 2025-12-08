# Alenia Pulse - Restructured Project

This project has been restructured for better organization and maintainability.

## New Directory Structure

```
.
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── auth/
│   │   │   ├── ui/
│   │   │   └── views/
│   │   │       ├── admin/
│   │   │       ├── contributor/
│   │   │       └── public/
│   │   ├── hooks/
│   │   ├── services/
│   │   ├── App.jsx
│   │   ├── App.css
│   │   └── main.jsx
│   ├── public/
│   ├── index.html
│   └── vite.config.js
├── backend/
│   ├── controllers/
│   ├── routes/
│   ├── middleware/
│   ├── utils/
│   ├── models/ (future use)
│   └── server.js
└── package.json
```

## Key Improvements

1. **Separation of Concerns**: Frontend and backend code are now in separate directories
2. **Better Backend Organization**: 
   - Controllers handle business logic
   - Routes handle URL mappings
   - Middleware handles authentication and authorization
   - Utils contain shared utilities
3. **Scalability**: Easy to add new features without cluttering existing files
4. **Maintainability**: Smaller, focused files are easier to understand and modify

## Running the Application

```bash
# Install dependencies
npm install

# Start both frontend and backend
npm start

# Start only the backend server
npm run server

# Start only the frontend development server
npm run dev
```

## Testing the Structure

```bash
# Test the new project structure
npm run test-structure
```