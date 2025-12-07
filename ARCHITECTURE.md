# Architecture Overview - Line Connect Puzzle

## System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         FRONTEND (SvelteKit)                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐     │
│  │   UI Layer   │    │  Game Logic  │    │    Editor    │     │
│  │  (Svelte)    │    │   (Canvas)   │    │              │     │
│  └──────┬───────┘    └──────┬───────┘    └──────┬───────┘     │
│         │                   │                    │              │
│         └───────────────────┼────────────────────┘              │
│                             │                                   │
│                    ┌────────▼────────┐                          │
│                    │  Sync Manager   │                          │
│                    │  (syncManager)  │                          │
│                    └────────┬────────┘                          │
│                             │                                   │
│         ┌───────────────────┼───────────────────┐              │
│         │                   │                   │              │
│  ┌──────▼───────┐   ┌──────▼───────┐   ┌──────▼───────┐      │
│  │API Service   │   │   Storage    │   │Network Check │      │
│  │(api.ts)      │   │  (storage.ts)│   │ (online/off) │      │
│  └──────┬───────┘   └──────┬───────┘   └──────────────┘      │
│         │                   │                                   │
│         │            ┌──────▼───────┐                          │
│         │            │ localStorage │                          │
│         │            │   (Cache)    │                          │
│         │            └──────────────┘                          │
└─────────┼───────────────────────────────────────────────────────┘
          │
          │ HTTP/HTTPS (REST API)
          │
┌─────────▼───────────────────────────────────────────────────────┐
│                        BACKEND (PHP)                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────┐                                               │
│  │   Router     │  ◄── CORS Headers                            │
│  │  (index.php) │                                               │
│  └──────┬───────┘                                               │
│         │                                                        │
│  ┌──────▼────────────────────────────────────────┐             │
│  │            API Endpoints                       │             │
│  ├────────────────────────────────────────────────┤             │
│  │  /levels          - CRUD operations            │             │
│  │  /sync/check      - Check for updates         │             │
│  │  /progress        - Save/Load progress         │             │
│  └──────┬────────────────────────────────────────┘             │
│         │                                                        │
│  ┌──────▼───────┐    ┌──────────────┐                          │
│  │   Models     │    │  Validation  │                          │
│  │  Level.php   │    │              │                          │
│  │  Progress.php│    └──────────────┘                          │
│  └──────┬───────┘                                               │
│         │                                                        │
│  ┌──────▼────────────────────────────────────┐                 │
│  │         MySQL Database                    │                 │
│  ├───────────────────────────────────────────┤                 │
│  │  Tables:                                  │                 │
│  │  - levels (id, name, dots, connections)   │                 │
│  │  - user_progress (user, level, stats)     │                 │
│  │  - level_sync (tracking updates)          │                 │
│  └───────────────────────────────────────────┘                 │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

## Data Flow

### 1. Online Mode - Level Sync
```
User Opens App
      │
      ▼
Check Network Status (Online)
      │
      ▼
Get Last Sync Time (localStorage)
      │
      ▼
API: GET /api/sync/check?since={lastSync}
      │
      ▼
Server Returns: {hasUpdates, updated[], deleted[], created[]}
      │
      ▼
Download Updated Levels
      │
      ▼
Merge with Local Storage
      │
      ▼
Update Last Sync Time
      │
      ▼
Display Levels to User
```

### 2. Offline Mode - Use Cache
```
User Opens App
      │
      ▼
Check Network Status (Offline)
      │
      ▼
Load from localStorage
      │
      ▼
Display Cached Levels
      │
      ▼
Queue Any Changes
      │
      ▼
(Wait for Online)
      │
      ▼
Sync Queued Changes
```

### 3. Creating/Editing Levels
```
User Creates/Edits Level
      │
      ▼
Save to localStorage (Optimistic)
      │
      ▼
Check Online Status
      │
      ├─ Online ──────────────────┐
      │                           │
      │                           ▼
      │                    API: POST/PUT /api/levels
      │                           │
      │                           ▼
      │                    Get Server ID/Version
      │                           │
      │                           ▼
      │                    Update Local Copy
      │
      └─ Offline ─────────────────┐
                                  │
                                  ▼
                          Add to Offline Queue
                                  │
                                  ▼
                          (Sync When Online)
```

### 4. Progress Tracking
```
User Completes Level
      │
      ▼
Save to localStorage
      │
      ▼
Check Online Status
      │
      ├─ Online ──────────────────┐
      │                           │
      │                           ▼
      │                    API: POST /api/progress
      │
      └─ Offline ─────────────────┐
                                  │
                                  ▼
                          Queue for Later Sync
```

## Sync Strategy Details

### Built-in Levels (ID < 1000)
- **Source**: Server (authoritative)
- **Sync Direction**: Server → Client (one-way)
- **Conflict**: Server always wins
- **Cache**: Stored locally for offline use

### Custom Levels (ID >= 1000)
- **Source**: User-created (client)
- **Sync Direction**: Client → Server (push-based)
- **Conflict**: Last-write-wins with version check
- **Cache**: Primary storage is local

### Progress Data
- **Source**: User-specific
- **Sync Direction**: Bi-directional
- **Conflict**: Merge (max attempts, best lives)
- **Cache**: Always stored locally

## State Management

```typescript
// Frontend State
interface AppState {
  levels: Level[];              // All levels (built-in + custom)
  progress: Record<number, LevelProgress>;
  syncStatus: 'idle' | 'syncing' | 'error' | 'success';
  isOnline: boolean;
  lastSync: Date | null;
  offlineQueue: OfflineAction[];
}
```

## Error Handling

```
API Call
   │
   ▼
Try Request
   │
   ├─ Success ────────► Return Data
   │
   ├─ Network Error ──► Check Offline
   │                      │
   │                      ├─ Add to Queue
   │                      └─ Return Cached
   │
   ├─ 4xx Error ──────► Validation Error
   │                      │
   │                      └─ Show User Message
   │
   └─ 5xx Error ──────► Server Error
                          │
                          ├─ Retry (3x)
                          └─ Fallback to Cache
```

## Security & Performance

### Security Layers
1. **Input Validation** (Backend)
   - Sanitize all inputs
   - Validate JSON structure
   - Check data types

2. **CORS Protection**
   - Whitelist frontend domain
   - Restrict methods

3. **Rate Limiting**
   - Limit API calls per IP
   - Prevent abuse

### Performance Optimizations
1. **Caching Strategy**
   - Cache levels in localStorage
   - Only sync changes (delta updates)
   - Compress large payloads

2. **Lazy Loading**
   - Load levels on-demand
   - Paginate level lists

3. **Background Sync**
   - Sync during idle time
   - Use Web Workers for heavy operations

## Technology Stack

### Frontend
- **Framework**: SvelteKit
- **State**: Svelte $state runes
- **Storage**: localStorage API
- **Network**: Fetch API
- **Build**: Vite

### Backend
- **Language**: PHP 7.4+
- **Database**: MySQL 8.0+
- **Server**: Apache/Nginx
- **API**: REST (JSON)

### DevOps
- **Frontend Deploy**: Vercel/Netlify
- **Backend Deploy**: Shared hosting/VPS
- **Database**: MySQL hosting

---

This architecture ensures:
✅ Works offline-first
✅ Seamless sync when online
✅ No data loss
✅ Fast performance
✅ Scalable design
