require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const passport = require('passport');
const cors = require('cors'); // Import the cors middleware

const { configurePassport } = require('./middlewares/authMiddleware'); // Passport configuration
const mongoClient = require('./models/mongoClient'); // For MongoDB connection logic (primarily schemas are defined here)

const authRoutes = require('./routes/authRoutes');
const dataRoutes = require('./routes/dataRoutes');
const segmentRoutes = require('./routes/segmentRoutes');
const campaignRoutes = require('./routes/campaignRoutes');
const aiRoutes = require('./routes/aiRoutes');

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares

// CORS Configuration
const corsOptions = {
    origin: "*", // Allow requests from this origin
    optionsSuccessStatus: 200, // For legacy browser support
    credentials: true // Important if you need to send cookies or authorization headers
};
app.use(cors(corsOptions)); // Enable CORS with specific options

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session Middleware
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true, // Set to true to save new sessions; false if you don't want to save uninitialized sessions
    cookie: {
        secure: process.env.NODE_ENV === 'production', // Use secure cookies in production
        httpOnly: true, // Helps prevent XSS attacks
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax' // 'none' for cross-site cookies in prod (requires secure: true), 'lax' for development
    }
}));

// Passport Middleware
configurePassport(passport); // Configure Passport strategies
app.use(passport.initialize());
app.use(passport.session());

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log('MongoDB Connected Successfully'))
    .catch(err => console.error('MongoDB Connection Error:', err));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/data', dataRoutes);
app.use('/api/segments', segmentRoutes);
app.use('/api/campaigns', campaignRoutes);
app.use('/api/ai', aiRoutes);

// Basic root route
app.get('/', (req, res) => {
    res.send('Mini CRM Backend is running!');
});

// Global Error Handler (Basic)
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Something went wrong!', details: err.message });
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
