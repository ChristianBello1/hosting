# server/Dockerfile
FROM node:18-alpine

# Installa nginx e docker-cli
RUN apk add --no-cache \
    docker-cli \
    nginx

# Set working directory
WORKDIR /app

# Create nginx config directory
RUN mkdir -p /app/nginx/conf.d

# Copia prima solo i file package.json per sfruttare la cache di Docker
COPY package*.json ./

# Install dependencies
RUN npm install

# Ora copia tutti gli altri file
COPY . .

# Create other required directories
RUN mkdir -p sites
RUN mkdir -p backups
RUN mkdir -p templates/default-site
RUN mkdir -p temp
RUN chmod 777 temp

# Expose port
EXPOSE 5000

# Start the server
CMD ["npm", "start"]