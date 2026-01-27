# Use a combined Node and Python base image
FROM nikolaik/python-nodejs:python3.11-nodejs20

# Create app directory
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    python3-pip \
    && rm -rf /var/lib/apt/lists/*

# Copy root files
COPY package*.json ./
COPY runner.js ./

# Install root dependencies (if any)
RUN npm install || true

# Copy sub-projects
COPY dashboard ./dashboard
COPY rectification ./rectification
COPY Carne_Univarsario ./Carne_Univarsario

# Install Dashboard dependencies
WORKDIR /app/dashboard
RUN npm install

# Install Rectification dependencies
WORKDIR /app/rectification
RUN npm install

# Install Carne service dependencies
WORKDIR /app/Carne_Univarsario/Carne_Univarsario
RUN npm install

# Setup Python Virtual Environment for Photo Validator
# Note: We create it in /app/... to match runner.js logic
WORKDIR /app/Carne_Univarsario/Carne_Univarsario/photo
RUN python3 -m venv .venv
RUN .venv/bin/pip install --upgrade pip
RUN .venv/bin/pip install fastapi uvicorn pillow requests python-dotenv

# Final setup: move back to root
WORKDIR /app

# Expose the dashboard port (which proxies others)
EXPOSE 3002

# The port environment variable provided by Render
ENV PORT=3002

# Run the sequential starter
CMD ["node", "runner.js"]
