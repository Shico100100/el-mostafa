#!/bin/bash

# Update package list
sudo apt update

# Install PostgreSQL
sudo apt install -y postgresql postgresql-contrib

# Start the service
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Create the database and user matching .env
# Default user is 'postgres', we just need to set the password and create the DB
sudo -u postgres psql -c "ALTER USER postgres PASSWORD 'postgres';"
sudo -u postgres psql -c "CREATE DATABASE elmostafa_db;"

echo "PostgreSQL installed and configured successfully!"
echo "Database: elmostafa_db"
echo "User: postgres"
echo "Password: postgres"
