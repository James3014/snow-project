# Use an official Python runtime as a parent image
FROM python:3.11-slim

# Set the working directory in the container
WORKDIR /app

# Add the app directory to the python path
ENV PYTHONPATH="/app"

# Install dependencies
COPY platform/user_core/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy the application code into the container
COPY platform/user_core/ ./

# Make the start script executable
RUN chmod +x start.sh

# Expose the port the app runs on
EXPOSE 8001

# Define the command to run the application
# This will run migrations before starting the server
CMD ["./start.sh"]
