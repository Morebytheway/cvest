#!/bin/bash
# MongoDB initialization script for Soccerzone
# This script creates the initial database structure and collections

echo "Initializing Soccerzone database..."

# Wait for MongoDB to be ready
mongosh --eval "
try {
  db = db.getSiblingDB('soccerzone');
  
  // Create collections (they will be created automatically when first used)
  print('Creating collections...');
  
  // Create indexes for better performance
  db.users.createIndex({ email: 1 }, { unique: true });
  db.bookings.createIndex({ userId: 1 });
  db.bookings.createIndex({ slotId: 1 });
  db.slots.createIndex({ date: 1 });
  db.wallets.createIndex({ userId: 1 }, { unique: true });
  
  print('Database initialization completed successfully!');
  
} catch (error) {
  print('Error during initialization: ' + error);
  exit(1);
}
"