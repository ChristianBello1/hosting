# client/Dockerfile
# Build stage
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies with specific flags per maggiore affidabilità
RUN npm install --legacy-peer-deps

# Add common UI libraries that usiamo nel progetto
RUN npm install lucide-react @radix-ui/react-tabs @radix-ui/react-alert-dialog @radix-ui/react-dialog

# Copy project files
COPY . .

# Expose port 5173 (Vite default port)
EXPOSE 5173

# Start the app
CMD ["npm", "run", "dev", "--", "--host"]