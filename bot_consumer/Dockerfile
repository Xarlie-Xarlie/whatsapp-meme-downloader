FROM node:18-slim

# Install python wget unzip chrome
RUN apt-get update
RUN apt-get install -y python3 python3-pip  wget unzip
RUN wget https://dl.google.com/linux/direct/google-chrome-stable_current_amd64.deb
RUN apt install -y ./google-chrome-stable_current_amd64.deb
RUN rm google-chrome-stable_current_amd64.deb
RUN apt install -y python3.11-venv
RUN apt-get clean
RUN rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Install Node.js dependencies
COPY package.json yarn.lock ./
RUN npm install

# Create virtual environment and install Python dependencies
RUN python3 -m venv venv
ENV PATH="/app/venv/bin:$PATH"
COPY requirements.txt .
RUN pip install --trusted-host pypi.python.org -r requirements.txt

# Copy files
COPY . .

# Command to run
CMD [ "node", "index.js" ]
