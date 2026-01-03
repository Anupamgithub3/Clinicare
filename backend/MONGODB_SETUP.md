# MongoDB Setup Guide for Windows

## Option 1: MongoDB Atlas (Cloud - Easiest & Free) ⭐ RECOMMENDED

**Best for:** Quick setup, no installation needed, free tier available

### Steps:
1. **Sign up** at https://www.mongodb.com/cloud/atlas/register
2. **Create a free cluster** (M0 Sandbox - Free forever)
3. **Create database user:**
   - Username: `clinicare` (or your choice)
   - Password: Create a strong password
4. **Whitelist IP:** Click "Add My Current IP Address" or use `0.0.0.0/0` for development
5. **Get connection string:**
   - Click "Connect" → "Connect your application"
   - Copy the connection string
   - It looks like: `mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority`
6. **Update `.env` file:**
   ```
   MONGODB_URI=mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/clinicare?retryWrites=true&w=majority
   ```
   (Replace username, password, and cluster URL with your actual values)

**✅ Advantages:**
- No installation needed
- Free tier available
- Works immediately
- Managed service (no maintenance)

---

## Option 2: Install MongoDB Community Edition (Local)

**Best for:** Full control, offline development

### Installation Steps:

1. **Download MongoDB:**
   - Go to: https://www.mongodb.com/try/download/community
   - Select:
     - Version: Latest (7.0+)
     - Platform: Windows
     - Package: MSI
   - Click "Download"

2. **Install MongoDB:**
   - Run the downloaded `.msi` file
   - Choose "Complete" installation
   - ✅ Check "Install MongoDB as a Service"
   - ✅ Check "Install MongoDB Compass" (GUI tool - optional but helpful)
   - Complete the installation

3. **Start MongoDB Service:**
   ```powershell
   # Check if service exists
   Get-Service -Name MongoDB
   
   # Start MongoDB service
   net start MongoDB
   
   # Or use PowerShell
   Start-Service MongoDB
   ```

4. **Verify MongoDB is running:**
   ```powershell
   # Check service status
   Get-Service -Name MongoDB
   
   # Test connection
   mongosh mongodb://localhost:27017
   ```

5. **Your `.env` file should already be correct:**
   ```
   MONGODB_URI=mongodb://localhost:27017/clinicare
   ```

**✅ Advantages:**
- Works offline
- Full control
- No internet required

---

## Option 3: MongoDB via Docker (If Docker is installed)

**Best for:** Isolated environment, easy cleanup

### Steps:

1. **Install Docker Desktop:**
   - Download: https://www.docker.com/products/docker-desktop/
   - Install and start Docker Desktop

2. **Run MongoDB container:**
   ```powershell
   docker run -d `
     --name mongodb `
     -p 27017:27017 `
     -v mongodb-data:/data/db `
     mongo:latest
   ```

3. **Verify it's running:**
   ```powershell
   docker ps
   ```

4. **Your `.env` file should already be correct:**
   ```
   MONGODB_URI=mongodb://localhost:27017/clinicare
   ```

**✅ Advantages:**
- Isolated environment
- Easy to start/stop
- No system-wide installation

---

## Quick Start Commands

### After MongoDB is running:

1. **Test connection:**
   ```powershell
   cd backend
   npm run test:db
   ```

2. **Start your server:**
   ```powershell
   npm run dev
   ```

3. **Verify in browser:**
   - Open: http://localhost:5000/health
   - Should see: `{"success":true,"message":"Server is running",...}`

---

## Troubleshooting

### MongoDB service won't start:
```powershell
# Check if port 27017 is in use
netstat -ano | findstr :27017

# Check MongoDB logs (if installed)
Get-Content "C:\Program Files\MongoDB\Server\7.0\log\mongod.log" -Tail 20
```

### Connection refused error:
- Make sure MongoDB service is running
- Check firewall settings
- Verify connection string in `.env`

### For MongoDB Atlas:
- Make sure IP is whitelisted
- Check username/password are correct
- Verify network connectivity

---

## Recommendation

**For quick start:** Use **MongoDB Atlas** (Option 1) - it's free and works immediately!

**For production-like development:** Use **MongoDB Community Edition** (Option 2)

