# Use the official Node.js 18 image
FROM node:18.12.0

# Set the working directory in the container
WORKDIR /app

# Copy package.json and package-lock.json (if available)
COPY package*.json ./

# Install dependencies
RUN npm install

# Install ffmpeg
RUN apt-get update && \
  apt-get install -y ffmpeg

# Copy the rest of the application code
COPY . .

# Run the application
CMD ["node", "index.js"]
