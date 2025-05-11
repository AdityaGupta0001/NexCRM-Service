const GoogleStrategy = require("passport-google-oauth20").Strategy;
const { User } = require("../models/mongoClient"); // Make sure this path is correct for your User model

// Ensure environment variables are set
if (
  !process.env.GOOGLE_CLIENT_ID ||
  !process.env.GOOGLE_CLIENT_SECRET ||
  !process.env.GOOGLE_CALLBACK_URL
) {
  console.error(
    "FATAL ERROR: Google OAuth environment variables (GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_CALLBACK_URL) are not set."
  );
  process.exit(1);
}

function configurePassport(passport) {
  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: process.env.GOOGLE_CALLBACK_URL, // Should be like http://localhost:3000/api/auth/google/callback
        scope: ["profile", "email"], // 'scope' is deprecated, use 'scope: ['profile', 'email']' if needed, but usually set in authenticate call
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          if (!profile.id || !profile.emails || profile.emails.length === 0) {
            return done(
              new Error("Profile information from Google is incomplete."),
              null
            );
          }

          let user = await User.findOne({ googleId: profile.id });

          if (user) {
            // Optional: Update user details if they have changed (e.g., displayName)
            // user.displayName = profile.displayName;
            // user.avatarUrl = profile.photos && profile.photos.length > 0 ? profile.photos[0].value : null;
            // await user.save();
            return done(null, user);
          } else {
            // Create a new user
            const newUser = new User({
              googleId: profile.id,
              displayName: profile.displayName || "User",
              email: profile.emails[0].value,
              // avatarUrl: profile.photos && profile.photos.length > 0 ? profile.photos[0].value : null,
              role: "employee", // Default role
            });

            // Example: Make the first registered user an admin
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
          console.error("Error in GoogleStrategy:", err);
          return done(err, null);
        }
      }
    )
  );

  // Stores user ID in the session
  // authMiddleware.js
  passport.serializeUser((user, done) => {
    console.log(
      "[SerializeUser] Attempting to serialize user:",
      user.displayName,
      "with ID:",
      user.id
    );
    if (!user || !user.id) {
      console.error(
        "[SerializeUser] Error: User object or user.id is missing."
      );
      return done(
        new Error("Cannot serialize user without a valid user object and ID.")
      );
    }
    done(null, user.id); // user.id should be the MongoDB _id
    console.log("[SerializeUser] User ID serialized successfully:", user.id);
  });

  // Retrieves user details from the session using the ID
  // authMiddleware.js
  passport.deserializeUser(async (id, done) => {
    console.log(
      "[DeserializeUser] Attempting to deserialize user with ID:",
      id
    );
    if (!id) {
      console.error("[DeserializeUser] Error: ID is undefined or null.");
      return done(
        new Error("User ID missing from session for deserialization.")
      );
    }
    try {
      const user = await User.findById(id);
      if (!user) {
        console.log("[DeserializeUser] No user found in DB for ID:", id);
        return done(null, false); // IMPORTANT: Signals no user found, req.user will be undefined
      }
      console.log(
        "[DeserializeUser] User found in DB:",
        user.displayName,
        user.email
      );
      return done(null, user); // User deserialized successfully, req.user will be populated
    } catch (err) {
      console.error(
        "[DeserializeUser] Error during DB lookup for ID:",
        id,
        err
      );
      return done(err, null); // Pass DB error to Passport
    }
  });
}

// Middleware to check if the user is authenticated
// authMiddleware.js
function isAuthenticated(req, res, next) {
  console.log(`[isAuthenticated] Check for path: ${req.path}`);
  // console.log(`[isAuthenticated] req.session:`, JSON.stringify(req.session, null, 2)); // Already logged above
  console.log(
    `[isAuthenticated] req.user (populated by deserializeUser):`,
    req.user
      ? { id: req.user.id, displayName: req.user.displayName }
      : "undefined"
  );
  console.log(
    `[isAuthenticated] req.isAuthenticated() result:`,
    req.isAuthenticated()
  );

  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ error: "User not authenticated. Please log in." });
}

module.exports = {
  configurePassport,
  isAuthenticated,
};
