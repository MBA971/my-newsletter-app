# Use Node.js 20 as base image
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies (both production and development)
RUN npm ci

# Copy application code
COPY . .

# Expose port for Vite development server
EXPOSE 5173

# Start the Vite development server
CMD ["npm", "run", "dev", "--", "--host"]