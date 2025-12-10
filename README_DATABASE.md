# Database Setup Instructions

## Prerequisites
- PostgreSQL installed and running
- Database `pos` created

## Environment Variables

Create a `.env` file in the root directory with:

```
DATABASE_URL="postgresql://postgres:root@localhost:5432/pos"
```

## Database Schema

The application creates 4 tables automatically:

### 1. Admin Table
- `id` (SERIAL PRIMARY KEY)
- `email` (VARCHAR(255) UNIQUE NOT NULL)
- `password` (VARCHAR(255) NOT NULL) - bcrypt hashed
- `name` (VARCHAR(255) NOT NULL)
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)

### 2. Staff Table
- Same structure as Admin

### 3. Kitchen Table
- Same structure as Admin

### 4. Customer Table
- Same structure as Admin

## Seeded Users

The following demo users are automatically created:

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@pos.com | admin123 |
| Staff | staff@pos.com | staff123 |
| Kitchen | kitchen@pos.com | kitchen123 |
| Customer | customer@pos.com | customer123 |

## Installation

1. Install dependencies:
```bash
npm install
```

2. Make sure PostgreSQL is running and the `pos` database exists:
```bash
createdb pos
```

3. Start the backend server:
```bash
npm run server
```

4. In another terminal, start the frontend:
```bash
npm run dev
```

Or run both together:
```bash
npm run dev:all
```

## API Endpoints

### POST /api/auth/login


Login with email and password.

Request:
```json
{
  "email": "admin@pos.com",
  "password": "admin123"
}
```

Response:
```json
{
  "id": "1",
  "email": "admin@pos.com",
  "name": "Admin User",
  "role": "ADMIN"
}
```

### POST /api/auth/register
Register a new user.

Request:
```json
{
  "email": "newuser@example.com",
  "password": "password123",
  "name": "New User",
  "role": "CUSTOMER"
}
```

Response:
```json
{
  "id": "5",
  "email": "newuser@example.com",
  "name": "New User",
  "role": "CUSTOMER"
}
```

## Notes

- Passwords are hashed using bcryptjs
- Each role has its own table for better data separation
- Email addresses must be unique across all tables
- The server automatically creates tables and seeds demo users on first run

