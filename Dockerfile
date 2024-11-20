FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install Next 14
RUN npm install next@14.2.16

# Install dependencies
RUN npm install

# Copy the rest of the application
COPY . .

# Expose port 3000
EXPOSE 3000

# Run next dev instead of production build
CMD ["npx", "next", "dev"] 