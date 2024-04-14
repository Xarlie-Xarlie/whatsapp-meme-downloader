#!/bin/bash

# Run the main Python script
python scraper.py

# Check the exit code of the Python script
if [ $? -eq 0 ]; then
  echo "Script executed successfully. Shutting down container."
  # Sleep for a short while to allow time for any final output to be printed
  sleep 5
  # Shut down the container gracefully
  shutdown -h now
else
  echo "Script failed. Container will remain running."
  # Wait indefinitely to keep the container running if the script fails
  tail -f /dev/null
fi
