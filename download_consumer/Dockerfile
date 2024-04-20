FROM node:18.12.0

# Install python wget unzip chrome
RUN apt-get update
RUN wget https://dl.google.com/linux/direct/google-chrome-stable_current_amd64.deb
RUN apt install -y ./google-chrome-stable_current_amd64.deb
RUN rm google-chrome-stable_current_amd64.deb
RUN apt-get clean

# Set working directory
WORKDIR /app

# Install Node.js dependencies
COPY package.json yarn.lock ./
RUN npm install

# Copy files
COPY . .

# Command to run
CMD [ "node", "index.js" ]
