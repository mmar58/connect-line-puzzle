# Backend Implementation Plan - Line Connect Puzzle

## Overview
Add a PHP backend to synchronize levels between server and clients, with offline support through local storage caching.

---

## 📁 Backend Structure (PHP)

### Directory Structure
```
backend/
├── config/
│   └── database.php          # Database configuration
├── api/
│   ├── levels/
│   │   ├── get.php          # GET /api/levels - Fetch all levels
│   │   ├── get_single.php   # GET /api/levels/{id} - Fetch single level
│   │   ├── create.php       # POST /api/levels - Create new level
│   │   ├── update.php       # PUT /api/levels/{id} - Update level
│   │   └── delete.php       # DELETE /api/levels/{id} - Delete level
│   ├── sync/
│   │   └── check.php        # GET /api/sync/check - Check for updates
│   └── progress/
│       ├── save.php         # POST /api/progress - Save progress
│       └── get.php          # GET /api/progress - Get progress
├── models/
│   ├── Level.php            # Level model
│   └── Progress.php         # Progress model
├── utils/
│   ├── cors.php             # CORS headers
│   ├── response.php         # JSON response helper
│   └── validation.php       # Input validation
└── index.php                # API router
```

### Database Schema

#### `levels` Table
```sql
CREATE TABLE levels (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    grid_width INT NOT NULL DEFAULT 800,
    grid_height INT NOT NULL DEFAULT 600,
    dots JSON NOT NULL,
    required_connections JSON NOT NULL,
    is_official BOOLEAN DEFAULT FALSE,
    created_by VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    version INT DEFAULT 1,
    INDEX idx_official (is_official),
    INDEX idx_created_at (created_at)
);
```

#### `user_progress` Table
```sql
CREATE TABLE user_progress (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id VARCHAR(100) NOT NULL,
    level_id INT NOT NULL,
    completed BOOLEAN DEFAULT FALSE,
    best_lives INT DEFAULT 0,
    attempts INT DEFAULT 0,
    completed_at TIMESTAMP NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY unique_user_level (user_id, level_id),
    FOREIGN KEY (level_id) REFERENCES levels(id) ON DELETE CASCADE,
    INDEX idx_user_completed (user_id, completed)
);
```

#### `level_sync` Table (for tracking updates)
```sql
CREATE TABLE level_sync (
    id INT AUTO_INCREMENT PRIMARY KEY,
    level_id INT NOT NULL,
    action ENUM('created', 'updated', 'deleted') NOT NULL,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (level_id) REFERENCES levels(id) ON DELETE CASCADE,
    INDEX idx_timestamp (timestamp)
);
```

---

## 🔌 API Endpoints

### 1. **GET /api/levels**
Fetch all levels with pagination and filtering
```json
Response:
{
  "success": true,
  "data": {
    "levels": [
      {
        "id": 1,
        "name": "Tutorial",
        "gridWidth": 800,
        "gridHeight": 600,
        "dots": [...],
        "requiredConnections": [...],
        "isOfficial": true,
        "version": 1,
        "updatedAt": "2025-12-05T10:00:00Z"
      }
    ],
    "total": 50,
    "page": 1,
    "perPage": 20
  }
}
```

### 2. **GET /api/levels/{id}**
Fetch single level by ID
```json
Response:
{
  "success": true,
  "data": {
    "id": 1,
    "name": "Tutorial",
    ...
  }
}
```

### 3. **POST /api/levels**
Create new level
```json
Request:
{
  "name": "My Custom Level",
  "gridWidth": 800,
  "gridHeight": 600,
  "dots": [...],
  "requiredConnections": [...],
  "createdBy": "user123"
}

Response:
{
  "success": true,
  "data": {
    "id": 1001,
    "message": "Level created successfully"
  }
}
```

### 4. **PUT /api/levels/{id}**
Update existing level
```json
Request:
{
  "name": "Updated Level Name",
  "dots": [...],
  "requiredConnections": [...]
}

Response:
{
  "success": true,
  "data": {
    "message": "Level updated successfully",
    "version": 2
  }
}
```

### 5. **DELETE /api/levels/{id}**
Delete level (only custom levels)
```json
Response:
{
  "success": true,
  "data": {
    "message": "Level deleted successfully"
  }
}
```

### 6. **GET /api/sync/check**
Check for level updates since last sync
```json
Request: ?since=2025-12-05T10:00:00Z

Response:
{
  "success": true,
  "data": {
    "hasUpdates": true,
    "updated": [1, 2, 5],
    "deleted": [10],
    "created": [1001, 1002],
    "lastSync": "2025-12-05T12:00:00Z"
  }
}
```

### 7. **POST /api/progress**
Save user progress
```json
Request:
{
  "userId": "user123",
  "levelId": 1,
  "completed": true,
  "bestLives": 3,
  "attempts": 5
}

Response:
{
  "success": true,
  "data": {
    "message": "Progress saved successfully"
  }
}
```

### 8. **GET /api/progress**
Get user progress
```json
Request: ?userId=user123

Response:
{
  "success": true,
  "data": {
    "progress": [
      {
        "levelId": 1,
        "completed": true,
        "bestLives": 3,
        "attempts": 5
      }
    ]
  }
}
```

---

## 🎨 Frontend Updates

### 1. **New Service Layer** (`src/lib/services/api.ts`)
```typescript
// API service for backend communication
export class APIService {
  private baseURL: string;
  
  async fetchLevels(): Promise<Level[]>
  async fetchLevel(id: number): Promise<Level>
  async createLevel(level: Level): Promise<number>
  async updateLevel(level: Level): Promise<void>
  async deleteLevel(id: number): Promise<void>
  async checkSync(lastSync: Date): Promise<SyncResponse>
  async saveProgress(progress: LevelProgress): Promise<void>
  async fetchProgress(userId: string): Promise<LevelProgress[]>
}
```

### 2. **Enhanced Storage Service** (`src/lib/services/storage.ts`)
```typescript
// Local storage with sync capabilities
export class StorageService {
  async syncLevels(): Promise<void>
  async saveLevelOffline(level: Level): Promise<void>
  async getOfflineLevels(): Promise<Level[]>
  async mergeLevels(serverLevels: Level[]): Promise<void>
  async getLastSyncTime(): Promise<Date>
  async setLastSyncTime(time: Date): Promise<void>
}
```

### 3. **Sync Manager** (`src/lib/services/syncManager.ts`)
```typescript
// Handles sync logic between server and local storage
export class SyncManager {
  async performSync(): Promise<SyncResult>
  async syncOnline(): Promise<void>
  async workOffline(): Promise<void>
  async queueOfflineChanges(action: Action): Promise<void>
  async processOfflineQueue(): Promise<void>
}
```

### 4. **Updated levels.ts Store**
Add these functions:
```typescript
// Network-aware functions
export async function syncWithServer(): Promise<void>
export async function isOnline(): Promise<boolean>
export async function getServerLevels(): Promise<Level[]>
export async function pushLevelToServer(level: Level): Promise<void>
export async function pullLevelFromServer(id: number): Promise<Level>
```

### 5. **Configuration** (`src/lib/config/api.ts`)
```typescript
export const API_CONFIG = {
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000/api',
  syncInterval: 5 * 60 * 1000, // 5 minutes
  retryAttempts: 3,
  timeout: 10000
};
```

### 6. **User ID Management** (`src/lib/utils/user.ts`)
```typescript
// Generate/store unique user ID for progress tracking
export function getUserId(): string
export function generateUserId(): string
```

---

## 🔄 Sync Strategy

### Sync Flow
```
1. App Startup
   ↓
2. Check if online
   ↓
3. If online → Fetch last sync time from localStorage
   ↓
4. Call /api/sync/check with lastSync timestamp
   ↓
5. Download new/updated levels
   ↓
6. Merge with local storage (keep user's custom levels)
   ↓
7. Save new sync timestamp
   ↓
8. If offline → Use cached levels from localStorage
```

### Conflict Resolution
- **Server Priority**: Official levels (id < 1000) always sync from server
- **Local Priority**: Custom levels (id >= 1000) stay local unless explicitly pushed
- **Version Check**: Use version numbers to detect conflicts
- **Last-Write-Wins**: For progress, latest timestamp wins

### Offline Queue
Store pending actions when offline:
```typescript
interface OfflineAction {
  type: 'create' | 'update' | 'delete' | 'progress';
  payload: any;
  timestamp: Date;
  retries: number;
}
```

---

## 🛠️ Implementation Steps

### Phase 1: Backend Setup (Days 1-2)
1. ✅ Set up PHP project structure
2. ✅ Create database and tables
3. ✅ Implement CORS and basic routing
4. ✅ Build Level CRUD endpoints
5. ✅ Build Sync endpoint
6. ✅ Build Progress endpoints
7. ✅ Add input validation
8. ✅ Test all endpoints with Postman

### Phase 2: Frontend Service Layer (Days 3-4)
1. ✅ Create API service (`api.ts`)
2. ✅ Create Storage service (`storage.ts`)
3. ✅ Create Sync manager (`syncManager.ts`)
4. ✅ Add environment configuration
5. ✅ Implement user ID generation
6. ✅ Add network status detection

### Phase 3: Integration (Days 5-6)
1. ✅ Update `levels.ts` store with sync functions
2. ✅ Modify editor to push/pull from server
3. ✅ Add sync indicator to UI
4. ✅ Implement background sync
5. ✅ Add offline indicator
6. ✅ Handle sync errors gracefully

### Phase 4: Testing & Polish (Day 7)
1. ✅ Test online sync
2. ✅ Test offline mode
3. ✅ Test conflict resolution
4. ✅ Test error handling
5. ✅ Add loading states
6. ✅ Performance optimization

---

## 🎯 Key Features

### Frontend
- ✅ Automatic background sync every 5 minutes
- ✅ Manual sync button in settings
- ✅ Offline mode indicator
- ✅ Sync status (syncing, synced, error)
- ✅ Local-first architecture (works without internet)
- ✅ Optimistic updates (instant UI feedback)

### Backend
- ✅ RESTful API design
- ✅ JSON responses
- ✅ Error handling
- ✅ Input validation
- ✅ CORS support for frontend
- ✅ Pagination for large datasets
- ✅ Version control for levels

---

## 🔐 Security Considerations

1. **Input Validation**: Sanitize all inputs on backend
2. **Rate Limiting**: Prevent API abuse
3. **CORS**: Restrict origins in production
4. **SQL Injection**: Use prepared statements
5. **XSS Protection**: Sanitize JSON data
6. **User Authentication** (Future): Add JWT tokens for user accounts

---

## 📦 Environment Variables

### Frontend (`.env`)
```env
VITE_API_URL=http://localhost:8000/api
VITE_SYNC_INTERVAL=300000
VITE_ENABLE_OFFLINE=true
```

### Backend (`.env`)
```env
DB_HOST=localhost
DB_NAME=line_puzzle
DB_USER=root
DB_PASS=
CORS_ORIGIN=http://localhost:5173
```

---

## 🚀 Deployment

### Backend
- Deploy to shared hosting with PHP 7.4+
- Configure Apache/Nginx for clean URLs
- Set up MySQL database
- Configure CORS for production domain

### Frontend
- Update `VITE_API_URL` to production URL
- Build: `pnpm build`
- Deploy static files to CDN/hosting

---

## 📊 Success Metrics

- ✅ Levels sync within 5 seconds
- ✅ App works 100% offline after first load
- ✅ Zero data loss during sync
- ✅ <100ms API response time
- ✅ Handles 1000+ levels efficiently

---

## 🔄 Future Enhancements

1. User authentication system
2. Level rating/voting system
3. Level categories/tags
4. Search and filtering
5. Social features (share levels)
6. Leaderboards
7. WebSocket for real-time sync
8. Level thumbnails/previews
9. Multi-device sync with accounts
10. Analytics and usage tracking

---

This plan provides a complete roadmap for implementing a PHP backend with offline-first frontend architecture. The system is designed to be resilient, performant, and user-friendly.
