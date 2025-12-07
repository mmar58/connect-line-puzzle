# Quick Start Guide - Backend Integration

## 🚀 Getting Started

This guide will help you implement the PHP backend and integrate it with the frontend.

---

## Prerequisites

- PHP 7.4 or higher
- MySQL 8.0 or higher
- Composer (optional, for dependencies)
- Node.js 18+ and pnpm (already installed)

---

## Step 1: Backend Setup (30 minutes)

### 1.1 Create Backend Directory
```bash
cd /home/mmar58/Documents/node/connect-line-puzzle
mkdir -p backend/api/{levels,sync,progress}
mkdir -p backend/{config,models,utils}
```

### 1.2 Create Database
```sql
-- Run in MySQL
CREATE DATABASE line_puzzle CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE line_puzzle;

-- Create tables (see BACKEND_IMPLEMENTATION_PLAN.md for full schema)
-- Or run: mysql -u root -p line_puzzle < backend/schema.sql
```

### 1.3 Configure Database Connection
Create `backend/config/database.php`:
```php
<?php
$host = getenv('DB_HOST') ?: 'localhost';
$dbname = getenv('DB_NAME') ?: 'line_puzzle';
$username = getenv('DB_USER') ?: 'root';
$password = getenv('DB_PASS') ?: '';

try {
    $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8mb4", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $pdo->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
} catch(PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Database connection failed']);
    exit;
}
```

### 1.4 Set up CORS
Create `backend/utils/cors.php`:
```php
<?php
header('Access-Control-Allow-Origin: http://localhost:5173');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}
```

### 1.5 Test Backend
```bash
cd backend
php -S localhost:8000
```
Visit: http://localhost:8000 - should see empty JSON or welcome message

---

## Step 2: Frontend Service Layer (45 minutes)

### 2.1 Create API Service
Create `src/lib/services/api.ts`:
```typescript
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

export class APIService {
  private async request(endpoint: string, options: RequestInit = {}) {
    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      }
    });
    
    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`);
    }
    
    return response.json();
  }

  async fetchLevels() {
    return this.request('/levels');
  }

  async createLevel(level: any) {
    return this.request('/levels', {
      method: 'POST',
      body: JSON.stringify(level)
    });
  }

  async checkSync(since: string) {
    return this.request(`/sync/check?since=${since}`);
  }
}

export const api = new APIService();
```

### 2.2 Create Environment Config
Create `.env` in project root:
```env
VITE_API_URL=http://localhost:8000/api
VITE_SYNC_INTERVAL=300000
VITE_ENABLE_OFFLINE=true
```

### 2.3 Create Storage Service
Create `src/lib/services/storage.ts`:
```typescript
const SYNC_TIME_KEY = 'line-puzzle-last-sync';

export class StorageService {
  getLastSyncTime(): Date | null {
    const time = localStorage.getItem(SYNC_TIME_KEY);
    return time ? new Date(time) : null;
  }

  setLastSyncTime(time: Date) {
    localStorage.setItem(SYNC_TIME_KEY, time.toISOString());
  }

  async mergeLevels(serverLevels: any[], localLevels: any[]) {
    // Merge logic: server levels override built-in, keep custom local
    const merged = [...serverLevels];
    localLevels.forEach(local => {
      if (local.id >= 1000 && !merged.find(s => s.id === local.id)) {
        merged.push(local);
      }
    });
    return merged;
  }
}

export const storage = new StorageService();
```

---

## Step 3: Integration (30 minutes)

### 3.1 Update levels.ts Store
Add to `src/lib/stores/levels.ts`:
```typescript
import { api } from '../services/api';
import { storage } from '../services/storage';

export async function syncWithServer(): Promise<boolean> {
  try {
    const lastSync = storage.getLastSyncTime();
    const syncData = await api.checkSync(lastSync?.toISOString() || '');
    
    if (syncData.hasUpdates) {
      const serverLevels = await api.fetchLevels();
      const localLevels = loadCustomLevels();
      const merged = await storage.mergeLevels(serverLevels, localLevels);
      
      // Update localStorage
      localStorage.setItem(LEVELS_KEY, JSON.stringify(merged));
      storage.setLastSyncTime(new Date());
      
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('Sync failed:', error);
    return false;
  }
}

export async function isOnline(): Promise<boolean> {
  try {
    const response = await fetch(`${import.meta.env.VITE_API_URL}/ping`, {
      method: 'HEAD',
      mode: 'no-cors'
    });
    return true;
  } catch {
    return false;
  }
}
```

### 3.2 Add Sync to App
Update `src/routes/+layout.svelte`:
```svelte
<script lang="ts">
  import { onMount } from 'svelte';
  import { syncWithServer } from '$lib/stores/levels';
  
  let syncStatus = $state<'idle' | 'syncing' | 'success' | 'error'>('idle');
  
  onMount(() => {
    // Initial sync
    performSync();
    
    // Auto-sync every 5 minutes
    const interval = setInterval(performSync, 5 * 60 * 1000);
    
    return () => clearInterval(interval);
  });
  
  async function performSync() {
    syncStatus = 'syncing';
    const success = await syncWithServer();
    syncStatus = success ? 'success' : 'error';
    
    setTimeout(() => {
      syncStatus = 'idle';
    }, 3000);
  }
</script>

<!-- Add sync indicator to UI -->
{#if syncStatus === 'syncing'}
  <div class="sync-indicator">Syncing...</div>
{/if}

<slot />
```

---

## Step 4: Testing (20 minutes)

### 4.1 Test Backend Endpoints
```bash
# Test levels endpoint
curl http://localhost:8000/api/levels

# Test create level
curl -X POST http://localhost:8000/api/levels \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","gridWidth":800,"gridHeight":600,"dots":[],"requiredConnections":[]}'
```

### 4.2 Test Frontend Integration
1. Start backend: `cd backend && php -S localhost:8000`
2. Start frontend: `pnpm dev`
3. Open browser DevTools → Network tab
4. Refresh app → Should see API calls to localhost:8000
5. Create a level in editor → Should POST to server
6. Check MySQL database → Level should be saved

---

## Step 5: Deploy (Production)

### Backend Deployment
1. Upload `backend/` folder to web host
2. Import database schema
3. Update CORS origin in `cors.php` to production domain
4. Configure `.htaccess` for clean URLs:
```apache
RewriteEngine On
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule ^api/(.*)$ /api/$1 [L]
```

### Frontend Deployment
1. Update `.env.production`:
```env
VITE_API_URL=https://yourdomain.com/api
```

2. Build and deploy:
```bash
pnpm build
# Deploy dist/ folder to hosting (Vercel, Netlify, etc.)
```

---

## 📋 Checklist

### Backend
- [ ] MySQL database created
- [ ] Tables created with correct schema
- [ ] PHP backend running on port 8000
- [ ] CORS configured correctly
- [ ] All endpoints responding (test with curl/Postman)

### Frontend
- [ ] API service created
- [ ] Storage service created
- [ ] Environment variables set
- [ ] Sync function integrated
- [ ] UI shows sync status
- [ ] Offline mode works

### Integration
- [ ] Levels load from server
- [ ] New levels save to server
- [ ] Progress syncs correctly
- [ ] Offline mode uses cache
- [ ] No console errors

---

## 🐛 Troubleshooting

### CORS Errors
- Check `backend/utils/cors.php` has correct origin
- Ensure browser allows CORS for localhost
- Try OPTIONS request manually

### Database Connection Failed
- Check MySQL is running
- Verify credentials in `database.php`
- Test connection: `mysql -u root -p`

### Sync Not Working
- Check browser DevTools → Network tab for errors
- Verify API_URL in `.env` is correct
- Check backend logs for PHP errors

### Offline Mode Not Working
- Check localStorage in DevTools → Application tab
- Verify levels are cached
- Test with airplane mode / offline DevTools setting

---

## 📚 Next Steps

1. Implement remaining API endpoints (see BACKEND_IMPLEMENTATION_PLAN.md)
2. Add user authentication (JWT tokens)
3. Implement offline queue for pending actions
4. Add loading states and error messages to UI
5. Optimize performance (caching, compression)
6. Add unit tests for API and sync logic

---

## 🆘 Need Help?

- Check `BACKEND_IMPLEMENTATION_PLAN.md` for detailed specs
- Check `ARCHITECTURE.md` for system design
- Review code examples in each section
- Test each component individually before integration

---

Good luck! 🚀
