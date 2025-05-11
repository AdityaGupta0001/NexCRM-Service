require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const passport = require('passport');
const cors = require('cors');

const { configurePassport, isAuthenticated } = require('./middlewares/authMiddleware');


const authRoutes = require('./routes/authRoutes');
const dataRoutes = require('./routes/dataRoutes');
const segmentRoutes = require('./routes/segmentRoutes');
const campaignRoutes = require('./routes/campaignRoutes');
const aiRoutes = require('./routes/aiRoutes');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors({
    origin: 'http://localhost:8080', 
    credentials: true              
}));

// Body parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

if (!process.env.SESSION_SECRET) {
    console.error("FATAL ERROR: SESSION_SECRET is not set in .env file.");
    process.exit(1);
}

app.set('trust proxy', 1);

app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true,                               
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
        maxAge: 24 * 60 * 60 * 1000
    }
}));

configurePassport(passport);
app.use(passport.initialize());
app.use(passport.session());


app.use((req, res, next) => {
    console.log('-----------------------------------------');
    console.log(`[SERVER] Path: ${req.path}`);
    console.log(`[SERVER] Incoming Cookie Header: ${req.headers.cookie}`);
    console.log(`[SERVER] req.session (after session middleware):`, JSON.stringify(req.session, null, 2));
    console.log(`[SERVER] req.sessionID: ${req.sessionID}`);
    console.log(`[SERVER] req.user (from Passport session):`, req.user ? {id: req.user.id, name: req.user.displayName} : 'undefined');
    console.log(`[SERVER] req.isAuthenticated() (from Passport session):`, req.isAuthenticated());
    console.log('-----------------------------------------');
    next();
});

if (!process.env.MONGODB_URI) {
    console.error("FATAL ERROR: MONGODB_URI is not set in .env file.");
    process.exit(1); // Exit if DB URI is not set
}
mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log('MongoDB Connected Successfully'))
    .catch(err => {
        console.error('MongoDB Connection Error:', err);
        process.exit(1); // Exit on DB connection error
    });

// Routes
app.use('/api/auth', authRoutes);

app.use('/api/data', isAuthenticated, dataRoutes);
app.use('/api/segments', isAuthenticated, segmentRoutes);
app.use('/api/campaigns', isAuthenticated, campaignRoutes);
app.use('/api/ai', isAuthenticated, aiRoutes);


// Basic root route
app.get('/', (req, res) => {
    res.send('Mini CRM Backend is running!');
});

// Global Error Handler (Basic)
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(err.status || 500).json({
        error: err.message || 'Something went wrong!',
        ...(process.env.NODE_ENV === 'development' && { details: err.stack })
    });
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
