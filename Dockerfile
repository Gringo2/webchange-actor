# Step 1: Build the TypeScript source code
FROM apify/actor-node:22 AS builder

# Copy package files and install ALL dependencies (including dev)
COPY package*.json ./
RUN npm install --include=dev --audit=false

# Copy source code and build
COPY . ./
RUN npm run build

# Step 2: Create the production image
FROM apify/actor-node:22

# Copy built files from the builder stage
COPY --from=builder /usr/src/app/dist ./dist

# Copy package files and install only production dependencies
COPY package*.json ./
RUN npm install --omit=dev --omit=optional --audit=false \
    && rm -rf ~/.npm

# Copy the rest of the files (configs, assets, etc.)
COPY . ./

# Set environment variables
ENV APIFY_DISABLE_OUTDATED_WARNING=1

# Run the actor
CMD ["npm", "run", "start:prod"]
