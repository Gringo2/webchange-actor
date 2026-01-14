# Use Apify's official Node.js image with pre-installed browsers (if needed later)
FROM apify/actor-node:20

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install --include=dev

# Copy source code and build TypeScript
COPY . ./
RUN npm run build

# Prune dev dependencies for a smaller production image
RUN npm prune --omit=dev

# Set the command to run the actor
CMD ["npm", "start"]
