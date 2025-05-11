const GoogleStrategy = require('passport-google-oauth20').Strategy;
const { User } = require('../models/mongoClient');

function configurePassport(passport) {
    passport.use(new GoogleStrategy({
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: process.env.GOOGLE_CALLBACK_URL, // Use full URL
        scope: ['profile', 'email']
    },
    async (accessToken, refreshToken, profile, done) => {
        try {
            let user = await User.findOne({ googleId: profile.id });
            if (user) {
                return done(null, user);
            } else {
                // For a new user, default role is 'employee'.
                // Admin role should be assigned manually or through a separate process.
                // For simplicity, the first user could be made an admin, or check against a predefined admin email.
                // Here, we just default to 'employee'.
                const newUser = new User({
                    googleId: profile.id,
                    displayName: profile.displayName,
                    email: profile.emails[0].value,
                    role: 'employee' // Default role
                });

                // Example: Make first registered user an admin (not recommended for production without care)
                // const userCount = await User.countDocuments();
                // if (userCount === 0) {
                //     newUser.role = 'admin';
                // }
                // Or check against a predefined admin email from .env
                // if (process.env.ADMIN_EMAIL && newUser.email === process.env.ADMIN_EMAIL) {
                //     newUser.role = 'admin';
                // }


                await newUser.save();
                return done(null, newUser);
            }
        } catch (err) {
            return done(err, null);
        }
    }));

    passport.serializeUser((user, done) => {
        done(null, user.id); // user.id is the MongoDB _id
    });

    passport.deserializeUser(async (id, done) => {
        try {
            const user = await User.findById(id);
            done(null, user);
        } catch (err) {
            done(err, null);
        }
    });
}

function isAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
        return next();
    }
    res.status(401).json({ error: "User not authenticated. Please log in." });
}

module.exports = {
    configurePassport,
    isAuthenticated
};