const mongoose = require('mongoose');
const mongo_uri = "mongodb://127.0.0.1:27017/users";

exports.connect = () => {
    mongoose.connect(mongo_uri)
        .then(() => {
            console.log('Successfully connected to the database');
        })
        .catch((error) => {
            console.error('Database connection failed:', error);
            // Exit the process if the database connection fails
            process.exit(1);
        });

    // Event listener for successful MongoDB connection
    mongoose.connection.on('connected', () => {
        console.log('MongoDB connected');
    });

    // Event listener for MongoDB connection error
    mongoose.connection.on('error', (err) => {
        console.error('MongoDB connection error:', err);
    });

    // Event listener for MongoDB disconnection
    mongoose.connection.on('disconnected', () => {
        console.log('MongoDB disconnected');
    });

    // Close MongoDB connection if the Node.js process is terminated
    process.on('SIGINT', () => {
        mongoose.connection.close(() => {
            console.log('MongoDB connection closed through app termination');
            process.exit(0);
        });
    });
};
