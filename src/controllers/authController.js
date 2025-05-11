const passport = require('passport');

const googleLogin = passport.authenticate('google', { scope: ['profile', 'email'] });

const googleCallback = (req, res, next) => {
    passport.authenticate('google', (err, user, info) => {
        if (err) { return next(err); }
        if (!user) { return res.redirect('/login-failure'); } // Or some error page/message
        req.logIn(user, (err) => {
            if (err) { return next(err); }
            // Successful authentication, redirect to a frontend route or send success message
            // For a backend-only setup, you might just send user info or a success status
            res.redirect('http://localhost:8080/dashboard');
            // res.status(200).json({ message: "Login successful", user: req.user });
        });
    })(req, res, next);
};

const logout = (req, res, next) => {
    req.logout((err) => {
        if (err) { return next(err); }
        req.session.destroy((err) => {
            if (err) {
                return res.status(500).json({ error: "Failed to destroy session during logout." });
            }
            res.clearCookie('connect.sid'); // Clear the session cookie
            res.status(200).json({ message: "Successfully logged out." });
        });
    });
};

const getCurrentUser = (req, res) => {
    if (req.user) {
        res.status(200).json(req.user);
    } else {
        res.status(401).json({ error: "No user currently logged in." });
    }
};

module.exports = {
    googleLogin,
    googleCallback,
    logout,
    getCurrentUser
};