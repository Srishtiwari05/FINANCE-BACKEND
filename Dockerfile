# Use the official Node.js 20 Alpine image as a base
FROM node:20-alpine

# Hugging Face runs Docker spaces using user ID 1000. 
# It's a best practice to create a non-root user matching this ID.
RUN adduser -D -u 1000 user

# Set the working directory
WORKDIR /app

# Change ownership of the working directory to the 'user'
RUN chown -R user:user /app

# Switch to the 'user'
USER user

# Copy package configurations and install dependencies
# We use root for the copy to keep things simple, but because 
# the user owns /app, they can run npm properly.
COPY --chown=user:user package*.json ./
RUN npm ci

# Copy the rest of the source code
COPY --chown=user:user . .

# Build the TypeScript project into JavaScript
RUN npm run build

# Hugging Face Spaces require applications to run on port 7860
ENV PORT=7860
EXPOSE 7860

# Start the Node.js application
CMD ["npm", "start"]
