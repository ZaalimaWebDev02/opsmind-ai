require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const uploadRoutes = require('./routes/upload');

const app = express();
connectDB();

app.use(cors({ origin: 'http://localhost:5173' }));
app.use(express.json());
app.use('/api/upload', uploadRoutes);

app.listen(process.env.PORT, () => {
  console.log(`OpsMind backend running on port ${process.env.PORT}`);
});