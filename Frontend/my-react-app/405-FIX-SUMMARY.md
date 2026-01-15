# 405 Method Not Allowed - Fix Summary

## Problem
The frontend deployed on Vercel was receiving 405 Method Not Allowed errors because it was trying to communicate with the Vercel domain instead of the Render backend.

## Solution Implemented

### 1. API Configuration (src/api/config.js) ✅
- **Added BASE_URL export** with fallback to Render backend
- **Environment Variable**: Uses `import.meta.env.VITE_API_URL`
- **Hardcoded Fallback**: Defaults to `https://toggle-nest-1.onrender.com`

```javascript
export const BASE_URL = import.meta.env.VITE_API_URL || "https://toggle-nest-1.onrender.com";

const API = axios.create({
    baseURL: BASE_URL,
});
```

### 2. Frontend Components Fixed ✅

#### App.jsx
- Imported `BASE_URL` from config
- Added console logging: `console.log("Frontend is now talking to Backend at:", BASE_URL);`

#### RegisterPage.jsx
- Imported `BASE_URL`
- Updated fetch call to use `${BASE_URL}/api/auth/verify`

#### LoginPage.jsx
- Imported `BASE_URL`
- Updated all 4 fetch calls to use `${BASE_URL}` instead of `import.meta.env.VITE_API_URL`
  - `/api/auth/verify` (2 instances)
  - `/api/onboarding/user/${user.email}` (2 instances)

#### OnboardingPage.jsx
- Imported `BASE_URL` (for consistency)
- Uses `API.post('/api/onboarding')` with relative path (correct since API instance has baseURL)

### 3. Backend CORS Configuration (server.js) ✅
Already correctly configured:
```javascript
app.use(cors({
  origin: true,
  credentials: true
}));
```

### 4. Environment Variables ✅
Frontend `.env` file already configured:
```
VITE_API_URL=https://toggle-nest-1.onrender.com
```

## Key Principles Applied

1. **For fetch() calls**: Always use full URL with `${BASE_URL}/api/...`
2. **For API instance calls**: Use relative paths `/api/...` (baseURL is already configured)
3. **Fallback safety**: If env variable is missing, defaults to Render backend
4. **CORS flexibility**: Backend accepts all origins with credentials

## Testing Checklist

- [ ] Registration flow works (fetch call to `/api/auth/verify`)
- [ ] Login flow works (fetch calls to verify and user endpoint)
- [ ] Onboarding flow works (API.post to `/api/onboarding`)
- [ ] Console shows: "Frontend is now talking to Backend at: https://toggle-nest-1.onrender.com"
- [ ] No 405 errors in browser console
- [ ] All API calls go to Render backend, not Vercel domain

## Files Modified

1. `src/api/config.js` - Added BASE_URL export with fallback
2. `src/App.jsx` - Imported BASE_URL and added logging
3. `src/pages/RegisterPage.jsx` - Updated fetch call to use BASE_URL
4. `src/pages/LoginPage.jsx` - Updated all fetch calls to use BASE_URL
5. `src/pages/OnboardingPage.jsx` - Imported BASE_URL for consistency

## Deployment Notes

When deploying to Vercel, ensure the environment variable is set:
- **Variable Name**: `VITE_API_URL`
- **Value**: `https://toggle-nest-1.onrender.com`

The fallback ensures the app works even if the env variable is not set.
