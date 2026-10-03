require('dotenv').config(); // must load before app.js reads process.env

const connectDB = require('./config/db');
const app = require('./app');

const PORT = process.env.PORT || 5000;

const start = async () => {
  if (!process.env.JWT_SECRET) throw new Error('JWT_SECRET is not defined in the environment');
  await connectDB();
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
};

start().catch((err) => {
  console.error('Failed to start server:', err.message);
  process.exit(1);
});
