# Netlify Deployment Setup

## Environment Variables Setup

After deploying to Netlify, you **must** set these environment variables in your Netlify dashboard:

1. Go to: **Site settings → Environment variables**
2. Add these three variables:

```
VITE_GEMINI_API_KEY=AIzaSyAxEZg9Aa3qvJDrfDbAAm3_bPwkFsJLo1I
VITE_ELEVENLABS_API_KEY=sk_b4730d2bbc79c89499773ee6f9dc64bf722019e7f9be96ad
VITE_ELEVENLABS_AGENT_ID=agent_6001k8c100vce8yrhe4dtbzzv3xg
```

3. **Redeploy** the site after adding the environment variables.

## Deployment Steps

1. Push your code to GitHub (already done)
2. Connect your GitHub repo to Netlify
3. Netlify will auto-detect the build settings from `netlify.toml`
4. Add the environment variables (see above)
5. Trigger a redeploy

## Build Configuration

The `netlify.toml` file is already configured with:
- Build command: `npm run build`
- Publish directory: `dist`
- SPA redirect rules

## Important Security Note

- ⚠️ **Never commit `.env` to Git** (it's already in `.gitignore`)
- ✅ Always use Netlify's environment variables dashboard
- 🔒 The API keys above are for your deployment only

## Testing Locally

To test with environment variables:

```bash
npm run dev
```

The local `.env` file will be used automatically.

