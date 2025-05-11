const passport = require("passport");

// Initiates the Google OAuth 2.0 authentication flow
const googleLogin = passport.authenticate("google", {
  scope: ["profile", "email"],
});

// Handles the callback from Google after authentication
// authController.js
const googleCallback = (req, res, next) => {
    // SUPER SIMPLE TEST LOG
    console.log("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!");
    console.log("!!!! [GoogleCallback TEMPORARY TEST] Route /api/auth/google/callback was HIT !!!!");
    console.log("!!!! Query parameters received:", JSON.stringify(req.query, null, 2));
    console.log("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!");

    // Now call the original passport.authenticate logic
    passport.authenticate('google', { failureRedirect: 'http://localhost:8080/login?error=google_auth_failed' }, (err, user, info) => {
        // ALL THE DETAILED LOGGING WE ADDED BEFORE SHOULD BE HERE
        if (err) {
            console.error("[GoogleCallback] Passport authentication error:", err);
            return res.redirect('http://localhost:8080/login?error=server_error');
        }
        if (!user) {
            console.warn("[GoogleCallback] No user returned from Google strategy. Info:", info);
            return res.redirect('http://localhost:8080/login?error=authentication_failed');
        }

        console.log("[GoogleCallback] User received from Google strategy:", user.displayName, user.id);

        req.logIn(user, (loginErr) => {
            if (loginErr) {
                console.error("[GoogleCallback] Error during req.logIn:", loginErr);
                return res.redirect('http://localhost:8080/login?error=session_login_error');
            }
            console.log("[GoogleCallback] req.logIn successful!");
            console.log("[GoogleCallback] req.session AFTER logIn:", JSON.stringify(req.session, null, 2));
            console.log("[GoogleCallback] req.user AFTER logIn:", req.user ? req.user.displayName : 'undefined');
            console.log("[GoogleCallback] req.isAuthenticated() AFTER logIn:", req.isAuthenticated());

            req.session.save(saveErr => {
                if (saveErr) {
                    console.error("[GoogleCallback] Error saving session after req.logIn:", saveErr);
                    return res.redirect('http://localhost:8080/login?error=session_save_error');
                }
                console.log("[GoogleCallback] Session saved successfully after req.logIn.");
                return res.redirect('http://localhost:8080/dashboard');
            });
        });
    })(req, res, next);
};


// Handles user logout
const logout = (req, res, next) => {
  req.logout((err) => {
    if (err) {
      console.error("Error during req.logout:", err);
      return res
        .status(500)
        .json({ error: "Logout failed. Please try again." });
    }
    req.session.destroy((err) => {
      if (err) {
        console.error("Error destroying session:", err);
        // Still proceed to clear cookie and send success, as logout mostly succeeded
        res.clearCookie("connect.sid", { path: "/" }); // Ensure path matches session cookie path
        return res
          .status(500)
          .json({
            error:
              "Failed to fully destroy session during logout, but logout initiated.",
          });
      }
      res.clearCookie("connect.sid", { path: "/" }); // Clear the session cookie
      return res.status(200).json({ message: "Successfully logged out." });
    });
  });
};

// Gets the currently authenticated user's details
const getCurrentUser = (req, res) => {
  if (req.isAuthenticated() && req.user) {
    // Send a subset of user data or the full user object as needed
    // For example, to avoid sending sensitive data:
    // const { googleId, _id, __v, ...userDataToSend } = req.user.toObject();
    // res.status(200).json(userDataToSend);
    res.status(200).json(req.user);
  } else {
    res.status(401).json({ error: "No user currently logged in." });
  }
};

module.exports = {
  googleLogin,
  googleCallback,
  logout,
  getCurrentUser,
};
