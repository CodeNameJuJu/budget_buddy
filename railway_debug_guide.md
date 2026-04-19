# Railway Build Debugging Guide

## Common Railway Build Issues and Solutions

### 1. Check Railway Build Logs
First, check the exact error in Railway build logs:
- Go to your Railway project
- Click on your service
- Go to "Build" tab
- Look at the build logs for specific error messages

### 2. Common Issues:

#### Issue: Dockerfile not found
**Solution**: Make sure Dockerfile is in the right location
- Should be at `backend/Dockerfile`
- Check that it's committed to Git

#### Issue: Go module issues
**Solution**: Ensure go.mod and go.sum are present
- Check `backend/go.mod` exists
- Check `backend/go.sum` exists
- Run `go mod tidy` locally

#### Issue: Build context issues
**Solution**: Simplify Dockerfile
- Use simpler COPY commands
- Ensure all required files are in the right place

### 3. Quick Fix: Use Nixpacks Instead

If Docker keeps failing, try this simpler nixpacks.toml:

```toml
[phases.setup]
nixPkgs = ["go", "git", "ca-certificates"]

[phases.build]
cmds = [
  "cd backend && go mod download",
  "cd backend && go build -o budget-buddy ."
]

[start]
cmd = "cd backend && ./budget-buddy"
```

### 4. Alternative: Use Railway CLI

If web interface keeps failing:
```bash
npm install -g @railway/cli
railway login
railway init
railway up
```

### 5. Manual Build Test

Test the build locally:
```bash
cd backend
docker build -t budget-buddy .
docker run -p 8080:8080 budget-buddy
```

### 6. Check File Structure

Ensure this structure in your repo:
```
budget_buddy/
- backend/
  - Dockerfile
  - go.mod
  - go.sum
  - main.go
- railway.toml
- nixpacks.toml
```

### 7. Environment Variables

If build succeeds but app fails:
- Check environment variables in Railway
- Ensure PORT=8080 is set
- Check database connection string

### 8. Health Check

If app starts but health check fails:
- Ensure `/api/health` endpoint exists
- Check if the app is listening on correct port
- Verify CORS settings

### What to Send Me for Help:

1. **Exact error message** from Railway build logs
2. **Screenshot** of Railway build logs
3. **Current file structure** of your repository
4. **Railway service settings** (environment variables, etc.)

### Next Steps:

1. Check Railway build logs for exact error
2. Try the simplified nixpacks configuration
3. Test local Docker build
4. Share the specific error with me
