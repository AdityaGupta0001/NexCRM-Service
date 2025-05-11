const passport = require("passport");

const googleLogin = passport.authenticate("google", {
  scope: ["profile", "email"],
});

const googleCallback = (req, res, next) => {

    passport.authenticate('google', { failureRedirect: 'http://localhost:8080/login?error=google_auth_failed' }, (err, user, info) => {
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
        res.clearCookie("connect.sid", { path: "/" });
        return res
          .status(500)
          .json({
            error:
              "Failed to fully destroy session during logout, but logout initiated.",
          });
      }
      res.clearCookie("connect.sid", { path: "/" });
      return res.status(200).json({ message: "Successfully logged out." });
    });
  });
};

const getCurrentUser = (req, res) => {
  if (req.isAuthenticated() && req.user) {
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
