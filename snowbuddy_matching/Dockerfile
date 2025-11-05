# Use an official Python runtime as a parent image
FROM python:3.11-slim

# Set the working directory in the container
WORKDIR /app

# Add the app directory to the python path
ENV PYTHONPATH="/app"

# Install dependencies
COPY snowbuddy_matching/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy the application code into the container
COPY snowbuddy_matching/app ./app

# Expose the port the app runs on
EXPOSE 8002

# Define the command to run the application
CMD ["uvicorn", "snowbuddy_matching.app.main:app", "--host", "0.0.0.0", "--port", "8002"]
