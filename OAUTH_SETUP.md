# OAuth Setup Guide

This guide will help you set up social login for Google, Facebook, LinkedIn, and GitHub.

## Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Google+ API
4. Go to "Credentials" → "Create Credentials" → "OAuth client ID"
5. Application type: "Web application"
6. Authorized redirect URIs: 
   - `http://localhost:3000/api/auth/google/callback` (development)
   - `https://yourdomain.com/api/auth/google/callback` (production)
7. Copy your Client ID and Client Secret
8. Add to `.env`:
   ```
   GOOGLE_CLIENT_ID=your-client-id
   GOOGLE_CLIENT_SECRET=your-client-secret
   ```

## Facebook OAuth Setup

1. Go to [Facebook Developers](https://developers.facebook.com/)
2. Create a new app or use an existing one
3. Add "Facebook Login" product
4. Settings → Basic: Copy App ID and App Secret
5. Facebook Login → Settings:
   - Valid OAuth Redirect URIs:
     - `http://localhost:3000/api/auth/facebook/callback`
     - `https://yourdomain.com/api/auth/facebook/callback`
6. Add to `.env`:
   ```
   FACEBOOK_APP_ID=your-app-id
   FACEBOOK_APP_SECRET=your-app-secret
   ```

## LinkedIn OAuth Setup

1. Go to [LinkedIn Developers](https://www.linkedin.com/developers/)
2. Create a new app
3. Go to "Auth" tab
4. Copy Client ID and Client Secret
5. Add redirect URLs:
   - `http://localhost:3000/api/auth/linkedin/callback`
   - `https://yourdomain.com/api/auth/linkedin/callback`
6. Add to `.env`:
   ```
   LINKEDIN_CLIENT_ID=your-client-id
   LINKEDIN_CLIENT_SECRET=your-client-secret
   ```

## GitHub OAuth Setup

1. Go to [GitHub Settings → Developer settings → OAuth Apps](https://github.com/settings/developers)
2. Click "New OAuth App"
3. Fill in:
   - Application name: Your app name
   - Homepage URL: `http://localhost:3000`
   - Authorization callback URL: `http://localhost:3000/api/auth/github/callback`
4. Copy Client ID and generate a Client Secret
5. Add to `.env`:
   ```
   GITHUB_CLIENT_ID=your-client-id
   GITHUB_CLIENT_SECRET=your-client-secret
   ```

## Production Setup

When deploying to production:

1. Update `CALLBACK_BASE_URL` in `.env`:
   ```
   CALLBACK_BASE_URL=https://yourdomain.com
   ```

2. Add production callback URLs to each OAuth provider:
   - Google: `https://yourdomain.com/api/auth/google/callback`
   - Facebook: `https://yourdomain.com/api/auth/facebook/callback`
   - LinkedIn: `https://yourdomain.com/api/auth/linkedin/callback`
   - GitHub: `https://yourdomain.com/api/auth/github/callback`

## Testing

1. Restart your development server after adding credentials
2. Go to `http://localhost:3000/auth`
3. Click on any social login button
4. You should be redirected to the provider's login page
5. After authentication, you'll be redirected back and logged in

## Notes

- OAuth providers are optional - the app will work with just email/password if you don't configure them
- Each provider requires email permission to work properly
- Users logging in with different providers but the same email will share the same account
- Tokens are valid for 7 days
