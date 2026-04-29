require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '25mb' }));

// Routes
app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/exams', require('./routes/exam.routes'));
app.use('/api/monitoring', require('./routes/monitoring.routes'));

// Basic health check route
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'API is running' });
});

const connectDB = async () => {
  try {
    let uri = process.env.MONGO_URI;
    if (!uri || uri.includes('localhost') || uri.includes('127.0.0.1')) {
      const { MongoMemoryServer } = require('mongodb-memory-server');
      const mongod = await MongoMemoryServer.create();
      uri = mongod.getUri();
      console.log('Using MongoDB Memory Server for local testing.');
    }
    const conn = await mongoose.connect(uri);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

connectDB();
