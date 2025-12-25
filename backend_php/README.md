# Line Connect Puzzle - Backend API

PHP-based REST API for the Line Connect Puzzle game.

## Setup

### 1. Database Setup
```bash
mysql -u root -p < schema.sql
```

### 2. Configuration
Copy `.env.example` to `.env` and update with your database credentials:
```bash
cp .env.example .env
```

### 3. Start Server
```bash
php -S localhost:8000
```

## API Endpoints

### Levels
- `GET /api/levels` - Get all levels
- `GET /api/levels/{id}` - Get single level
- `POST /api/levels` - Create new level
- `PUT /api/levels/{id}` - Update level
- `DELETE /api/levels/{id}` - Delete level

### Sync
- `GET /api/sync/check?since={timestamp}` - Check for updates

### Progress
- `POST /api/progress` - Save user progress
- `GET /api/progress?userId={id}` - Get user progress

## Testing

Test with curl:
```bash
# Get all levels
curl http://localhost:8000/api/levels

# Create a level
curl -X POST http://localhost:8000/api/levels \
  -H "Content-Type: application/json" \
  -d '{"name":"Test Level","gridWidth":800,"gridHeight":600,"dots":[],"requiredConnections":[]}'

# Check sync
curl http://localhost:8000/api/sync/check?since=2025-01-01
```

## Directory Structure
```
backend/
├── api/              # API endpoints
├── config/           # Database configuration
├── models/           # Data models
├── utils/            # Helper functions
├── index.php         # API router
├── schema.sql        # Database schema
└── .htaccess         # Apache configuration
```

## Requirements
- PHP 7.4+
- MySQL 8.0+
- Apache (with mod_rewrite) or PHP built-in server
