FROM node:20-bullseye

# Install Python 3 and pip
RUN apt-get update && \
    apt-get install -y python3 python3-pip && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy the whole project into the container
COPY . /app/

# Install Node dependencies for backend
WORKDIR /app/backend
RUN npm install

# Install Python dependencies for the ML model
WORKDIR /app/ml-model
RUN pip3 install --no-cache-dir -r requirements.txt

# Set the working directory back to backend and start the server
WORKDIR /app/backend
CMD ["npm", "start"]
