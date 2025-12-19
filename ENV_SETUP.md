# Environment Variables Setup Guide

## 📁 Two .env Files Required

You need to create **TWO separate .env files** in different locations:

---

## 1. Frontend .env File (Root Directory)

**Location:** `C:\Users\nalla\Downloads\POS\.env`  
(Same level as `vite.config.ts` and `package.json`)

**Purpose:** Frontend environment variables for Vite

**Required Variables:**
```env
# Super Admin Credentials (for frontend login)
VITE_SUPER_ADMIN_EMAIL=superadmin@dineflow.com
VITE_SUPER_ADMIN_PASSWORD=superadmin123

# API Configuration (for frontend to connect to backend)
VITE_API_URL=http://localhost:3001/api
```

**Important Notes:**
- ✅ Must use `VITE_` prefix (Vite requirement)
- ✅ These variables are accessible in frontend code via `import.meta.env.VITE_*`
- ✅ Used by `views/Auth.tsx` for super admin login

---

## 2. Server .env File (Server Folder)

**Location:** `C:\Users\nalla\Downloads\POS\server\.env`  
(Same level as `server/index.js`)

**Purpose:** Backend environment variables for Node.js

**Required Variables:**
```env
# Database Configuration
DATABASE_URL=postgresql://postgres:root@localhost:5432/pos

# Server Port (optional, defaults to 3001)
PORT=3001

# Node Environment
NODE_ENV=development
```

**Important Notes:**
- ❌ Do NOT use `VITE_` prefix (these are for Node.js)
- ✅ These variables are accessible via `process.env.*`
- ✅ Used by `server/index.js` for database connection

---

## 🚀 Quick Setup Steps

1. **Create Frontend .env:**
   ```bash
   # In root directory
   cd C:\Users\nalla\Downloads\POS
   # Create .env file with VITE_ prefixed variables
   ```

2. **Create Server .env:**
   ```bash
   # In server directory
   cd C:\Users\nalla\Downloads\POS\server
   # Create .env file with DATABASE_URL and other server variables
   ```

3. **Restart Development Servers:**
   - Restart Vite dev server (frontend) to load new env variables
   - Restart Node.js server (backend) to load new env variables

---

## 📝 Example .env Files

### Root Directory `.env`:
```env
VITE_SUPER_ADMIN_EMAIL=superadmin@dineflow.com
VITE_SUPER_ADMIN_PASSWORD=superadmin123
VITE_API_URL=http://localhost:3001/api
```

### Server Directory `server/.env`:
```env
DATABASE_URL=postgresql://postgres:root@localhost:5432/pos
PORT=3001
NODE_ENV=development
```

---

## ⚠️ Security Notes

- Both `.env` files are in `.gitignore` and won't be committed to Git
- Never commit actual credentials to version control
- Use different passwords in production
- Keep `.env` files secure and private

---

## 🔍 How to Verify

**Frontend variables:**
- Check browser console: `console.log(import.meta.env.VITE_SUPER_ADMIN_EMAIL)`
- Should show your email (only in development)

**Server variables:**
- Check server logs when starting: `console.log(process.env.DATABASE_URL)`
- Should show your database URL

---

## ❓ Troubleshooting

**Problem:** Super admin login not working
- ✅ Check if `.env` is in root directory (not server folder)
- ✅ Check if variables have `VITE_` prefix
- ✅ Restart Vite dev server after creating/updating `.env`

**Problem:** Database connection failing
- ✅ Check if `server/.env` exists in server folder
- ✅ Verify `DATABASE_URL` format is correct
- ✅ Restart Node.js server after creating/updating `.env`

