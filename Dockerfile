# Use the official Node.js 20 Alpine image as a base
FROM node:20-alpine

# The 'node' image already comes with a user named 'node' (UID 1000).
# Hugging Face runs Docker spaces using user ID 1000.

# Set the working directory
WORKDIR /app

# Change ownership of the working directory to the 'node' user
RUN chown -R node:node /app

# Switch to the 'node' user
USER node

# Copy package configurations and install dependencies
COPY --chown=node:node package*.json ./
RUN npm ci

# Copy the rest of the source code
COPY --chown=node:node . .

# Build the TypeScript project into JavaScript
RUN npm run build

# Hugging Face Spaces require applications to run on port 7860
ENV PORT=7860
EXPOSE 7860

# Start the Node.js application
CMD ["npm", "start"]
