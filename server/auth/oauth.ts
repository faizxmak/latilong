import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { Strategy as FacebookStrategy } from "passport-facebook";
import { Strategy as LinkedInStrategy } from "passport-linkedin-oauth2";
import { Strategy as GitHubStrategy } from "passport-github2";
import type { Express } from "express";
import session from "express-session";
import { authStorage } from "./storage";
import { generateToken } from "./jwt-auth";

const CALLBACK_BASE_URL = process.env.CALLBACK_BASE_URL || "http://localhost:3000";

// Session setup
export function setupSession(app: Express) {
  app.use(
    session({
      secret: process.env.SESSION_SECRET || "your-session-secret",
      resave: false,
      saveUninitialized: false,
      cookie: {
        secure: process.env.NODE_ENV === "production",
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
      },
    })
  );
  
  app.use(passport.initialize());
  app.use(passport.session());
}

// Passport serialization
passport.serializeUser((user: any, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id: string, done) => {
  try {
    const user = await authStorage.getUserById(id);
    done(null, user);
  } catch (error) {
    done(error);
  }
});

// Google OAuth Strategy
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: `${CALLBACK_BASE_URL}/api/auth/google/callback`,
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          const email = profile.emails?.[0]?.value;
          if (!email) {
            return done(new Error("No email found in Google profile"));
          }

          let user = await authStorage.getUserByEmail(email);
          
          if (!user) {
            user = await authStorage.createUser({
              email,
              firstName: profile.name?.givenName,
              lastName: profile.name?.familyName,
              profileImageUrl: profile.photos?.[0]?.value,
            });
          }

          done(null, user);
        } catch (error) {
          done(error as Error);
        }
      }
    )
  );
}

// Facebook OAuth Strategy
if (process.env.FACEBOOK_APP_ID && process.env.FACEBOOK_APP_SECRET) {
  passport.use(
    new FacebookStrategy(
      {
        clientID: process.env.FACEBOOK_APP_ID,
        clientSecret: process.env.FACEBOOK_APP_SECRET,
        callbackURL: `${CALLBACK_BASE_URL}/api/auth/facebook/callback`,
        profileFields: ["id", "emails", "name", "picture"],
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          const email = profile.emails?.[0]?.value;
          if (!email) {
            return done(new Error("No email found in Facebook profile"));
          }

          let user = await authStorage.getUserByEmail(email);
          
          if (!user) {
            user = await authStorage.createUser({
              email,
              firstName: profile.name?.givenName,
              lastName: profile.name?.familyName,
              profileImageUrl: profile.photos?.[0]?.value,
            });
          }

          done(null, user);
        } catch (error) {
          done(error as Error);
        }
      }
    )
  );
}

// LinkedIn OAuth Strategy
if (process.env.LINKEDIN_CLIENT_ID && process.env.LINKEDIN_CLIENT_SECRET) {
  passport.use(
    new LinkedInStrategy(
      {
        clientID: process.env.LINKEDIN_CLIENT_ID,
        clientSecret: process.env.LINKEDIN_CLIENT_SECRET,
        callbackURL: `${CALLBACK_BASE_URL}/api/auth/linkedin/callback`,
        scope: ["r_emailaddress", "r_liteprofile"],
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          const email = profile.emails?.[0]?.value;
          if (!email) {
            return done(new Error("No email found in LinkedIn profile"));
          }

          let user = await authStorage.getUserByEmail(email);
          
          if (!user) {
            user = await authStorage.createUser({
              email,
              firstName: profile.name?.givenName,
              lastName: profile.name?.familyName,
              profileImageUrl: profile.photos?.[0]?.value,
            });
          }

          done(null, user);
        } catch (error) {
          done(error as Error);
        }
      }
    )
  );
}

// GitHub OAuth Strategy
if (process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET) {
  passport.use(
    new GitHubStrategy(
      {
        clientID: process.env.GITHUB_CLIENT_ID,
        clientSecret: process.env.GITHUB_CLIENT_SECRET,
        callbackURL: `${CALLBACK_BASE_URL}/api/auth/github/callback`,
        scope: ["user:email"],
      },
      async (accessToken: string, refreshToken: string, profile: any, done: any) => {
        try {
          const email = profile.emails?.[0]?.value;
          if (!email) {
            return done(new Error("No email found in GitHub profile"));
          }

          let user = await authStorage.getUserByEmail(email);
          
          if (!user) {
            const nameParts = profile.displayName?.split(" ") || [];
            user = await authStorage.createUser({
              email,
              firstName: nameParts[0] || profile.username,
              lastName: nameParts.slice(1).join(" ") || undefined,
              profileImageUrl: profile.photos?.[0]?.value,
            });
          }

          done(null, user);
        } catch (error) {
          done(error as Error);
        }
      }
    )
  );
}

// OAuth Routes
export function registerOAuthRoutes(app: Express) {
  // Google
  app.get("/api/auth/google", passport.authenticate("google", { scope: ["profile", "email"] }));
  app.get(
    "/api/auth/google/callback",
    passport.authenticate("google", { failureRedirect: "/auth?error=google" }),
    async (req, res) => {
      const user = req.user as any;
      const token = generateToken({ userId: user.id, email: user.email });
      res.redirect(`/auth?token=${token}`);
    }
  );

  // Facebook
  app.get("/api/auth/facebook", passport.authenticate("facebook", { scope: ["email"] }));
  app.get(
    "/api/auth/facebook/callback",
    passport.authenticate("facebook", { failureRedirect: "/auth?error=facebook" }),
    async (req, res) => {
      const user = req.user as any;
      const token = generateToken({ userId: user.id, email: user.email });
      res.redirect(`/auth?token=${token}`);
    }
  );

  // LinkedIn
  app.get("/api/auth/linkedin", passport.authenticate("linkedin"));
  app.get(
    "/api/auth/linkedin/callback",
    passport.authenticate("linkedin", { failureRedirect: "/auth?error=linkedin" }),
    async (req, res) => {
      const user = req.user as any;
      const token = generateToken({ userId: user.id, email: user.email });
      res.redirect(`/auth?token=${token}`);
    }
  );

  // GitHub
  app.get("/api/auth/github", passport.authenticate("github", { scope: ["user:email"] }));
  app.get(
    "/api/auth/github/callback",
    passport.authenticate("github", { failureRedirect: "/auth?error=github" }),
    async (req, res) => {
      const user = req.user as any;
      const token = generateToken({ userId: user.id, email: user.email });
      res.redirect(`/auth?token=${token}`);
    }
  );
}
