# Getting Started with Edify LMS

This guide will help you set up and run the Edify LMS application on your local machine.

## Prerequisites

Before you begin, ensure you have the following installed:

- **.NET 9 SDK** - [Download here](https://dotnet.microsoft.com/download/dotnet/9.0)
- **PostgreSQL** - Version 12 or higher
  - [Download PostgreSQL](https://www.postgresql.org/download/)
- **IDE** (choose one):
  - Visual Studio 2022 (recommended for Windows)
  - Visual Studio Code with C# Dev Kit extension (cross-platform)
  - JetBrains Rider

## Quick Start

### Step 1: Verify .NET Installation

```bash
dotnet --version
# Should show 9.0.x or higher
```

### Step 2: Clone and Navigate to Project

```bash
cd /Users/prince/Developer/Edify
```

### Step 3: Set Up PostgreSQL

Make sure PostgreSQL is running on your system:

**macOS (Homebrew):**
```bash
brew services start postgresql
```

**Linux:**
```bash
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

**Windows:**
PostgreSQL should start automatically as a service.

### Step 4: Create Database User (If Needed)

```bash
# Connect to PostgreSQL
psql -U postgres

# Create user
CREATE USER prince WITH PASSWORD 'postgres';

# Grant privileges
ALTER USER prince CREATEDB;

# Exit
\q
```

### Step 5: Configure Connection String

The connection string is already configured in `src/Edify.API/appsettings.json`:

```json
"ConnectionStrings": {
  "DefaultConnection": "Host=localhost;Port=5432;Database=EdifyDB;Username=prince;Password=postgres"
}
```

Update if needed with your PostgreSQL credentials.

### Step 6: Restore Packages

```bash
dotnet restore
```

### Step 7: Create Database Schema

```bash
cd src/Edify.API

# Create migration (if not already created)
dotnet ef migrations add InitialCreate --project ../Edify.DAL

# Apply migration to database
dotnet ef database update
```

This will create the following tables:
- `Users` - User accounts with roles
- `Courses` - Teacher-created courses
- `Enrollments` - Student course enrollments

### Step 8: Run the Application

```bash
# From src/Edify.API directory
dotnet run

# Or use watch mode for auto-reload during development
dotnet watch run
```

You should see:
```
info: Microsoft.Hosting.Lifetime[14]
      Now listening on: https://localhost:7050
      Now listening on: http://localhost:5050
info: Microsoft.Hosting.Lifetime[0]
      Application started. Press Ctrl+C to shut down.
```

### Step 9: Open Swagger UI

The API documentation and testing interface is available at:

- **HTTPS (Primary)**: https://localhost:7050/swagger
- **HTTP**: http://localhost:5050/swagger

## Test the Authentication API

### 1. Register a Teacher

In Swagger UI, expand `POST /api/auth/register` and try:

```json
{
  "firstName": "Maria",
  "lastName": "Smith",
  "email": "maria@teacher.com",
  "password": "Teacher123!",
  "role": 1
}
```

**Response:**
```json
{
  "userId": 1,
  "firstName": "Maria",
  "lastName": "Smith",
  "email": "maria@teacher.com",
  "role": 1,
  "groupClass": null,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Copy the `token` value for testing protected endpoints.**

### 2. Register a Student

```json
{
  "firstName": "Ivan",
  "lastName": "Petrov",
  "email": "ivan@student.com",
  "password": "Student123!",
  "role": 0,
  "groupClass": "CS-2024-A"
}
```

### 3. Login

Try logging in with the registered user:

```json
{
  "email": "maria@teacher.com",
  "password": "Teacher123!"
}
```

### 4. Using Authentication in Swagger

To test protected endpoints:

1. Click the **Authorize** button (lock icon, top right in Swagger UI)
2. Enter: `Bearer YOUR_TOKEN_HERE` (replace with actual token)
3. Click **Authorize**, then **Close**
4. Now you can access protected endpoints

### 5. Logout

```http
POST /api/auth/logout
```

Note: In JWT architecture, logout is client-side - just delete the token from storage.

## Database Management

### View Your Data

**Using psql:**
```bash
psql -U prince -d EdifyDB -h localhost

# List tables
\dt

# View users
SELECT * FROM "Users";

# View courses
SELECT * FROM "Courses";

# View enrollments
SELECT * FROM "Enrollments";

# Exit
\q
```

**Using pgAdmin:**
1. Open pgAdmin
2. Connect to localhost:5432
3. Navigate to EdifyDB database
4. Browse tables

### Useful EF Core Commands

All commands should be run from `src/Edify.API` directory:

```bash
cd src/Edify.API

# Create a new migration
dotnet ef migrations add MigrationName --project ../Edify.DAL

# Apply migrations
dotnet ef database update --project ../Edify.DAL

# Rollback to specific migration
dotnet ef database update PreviousMigrationName --project ../Edify.DAL

# Remove last migration (if not applied)
dotnet ef migrations remove --project ../Edify.DAL

# List all migrations
dotnet ef migrations list --project ../Edify.DAL

# Drop database (CAUTION!)
dotnet ef database drop --project ../Edify.DAL --force
```

### Reset Database (Fresh Start)

```bash
cd src/Edify.API

# Drop and recreate
dotnet ef database drop --project ../Edify.DAL --force
dotnet ef database update --project ../Edify.DAL
```

## Project Structure

```
Edify/
├── Edify.sln                          ← Solution file
├── src/
│   ├── Edify.API/                     ← Web API Layer
│   │   ├── Controllers/
│   │   │   └── AuthController.cs      ← Authentication endpoints
│   │   ├── Middleware/
│   │   │   └── ExceptionHandlingMiddleware.cs
│   │   ├── Properties/
│   │   │   └── launchSettings.json    ← Port configuration
│   │   ├── Program.cs                 ← App startup & DI config
│   │   ├── appsettings.json           ← Configuration
│   │   └── Edify.API.csproj
│   │
│   ├── Edify.Core/                    ← Domain Layer
│   │   ├── Entities/
│   │   │   ├── BaseEntity.cs          ← Base class for all entities
│   │   │   ├── User.cs                ← User entity
│   │   │   ├── Course.cs              ← Course entity
│   │   │   └── Enrollment.cs          ← Enrollment entity
│   │   ├── DTOs/
│   │   │   └── Auth/
│   │   │       ├── RegisterDto.cs     ← Registration request
│   │   │       ├── LoginDto.cs        ← Login request
│   │   │       └── AuthResponseDto.cs ← Auth response with token
│   │   ├── Enums/
│   │   │   ├── UserRole.cs            ← Student/Teacher roles
│   │   │   └── EnrollmentStatus.cs    ← Pending/Approved/Rejected
│   │   ├── Interfaces/
│   │   │   ├── IAuthService.cs
│   │   │   ├── ITokenService.cs
│   │   │   ├── IRepository.cs
│   │   │   └── IUnitOfWork.cs
│   │   └── Edify.Core.csproj
│   │
│   ├── Edify.DAL/                     ← Data Access Layer
│   │   ├── Data/
│   │   │   └── EdifyDbContext.cs      ← EF Core DbContext
│   │   ├── Repositories/
│   │   │   ├── Repository.cs          ← Generic repository
│   │   │   └── UnitOfWork.cs          ← Unit of Work pattern
│   │   ├── Migrations/                ← EF Core migrations
│   │   └── Edify.DAL.csproj
│   │
│   └── Edify.BLL/                     ← Business Logic Layer
│       ├── Services/
│       │   ├── AuthService.cs         ← Authentication logic
│       │   ├── TokenService.cs        ← JWT token generation
│       │   └── CourseService.cs       ← Course management logic
│       ├── Exceptions/
│       │   ├── BadRequestException.cs
│       │   ├── NotFoundException.cs
│       │   └── UnauthorizedException.cs
│       └── Edify.BLL.csproj
│
├── .gitignore
└── README.md
```

## Configuration

### Connection String

Located in `src/Edify.API/appsettings.json`:

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Host=localhost;Port=5432;Database=EdifyDB;Username=prince;Password=postgres"
  }
}
```

### JWT Settings

```json
{
  "JwtSettings": {
    "SecretKey": "YourSuperSecretKeyForJWTTokenGenerationMustBeAtLeast32Characters",
    "Issuer": "EdifyAPI",
    "Audience": "EdifyClient",
    "ExpiryMinutes": "60"
  }
}
```

**Important for Production:**
- Change the `SecretKey` to a secure random string
- Store secrets in environment variables or Azure Key Vault
- Never commit secrets to source control

### Port Configuration

Located in `src/Edify.API/Properties/launchSettings.json`:

```json
{
  "https": {
    "applicationUrl": "https://localhost:7050;http://localhost:5050",
    "environmentVariables": {
      "ASPNETCORE_ENVIRONMENT": "Development"
    }
  }
}
```

## Development Tips

### Hot Reload (Recommended)

```bash
cd src/Edify.API
dotnet watch run
```

This will automatically restart the app when you make code changes.

### Build Solution

```bash
# From solution root
dotnet build

# Clean build
dotnet clean
dotnet build
```

### Run Tests (When Added)

```bash
dotnet test
```

### Check for Code Issues

```bash
# Restore, build, and check
dotnet restore
dotnet build --no-restore
```

## Troubleshooting

### Issue: "Failed to bind to address... address already in use"

**Solution:** Kill the process using the port:

```bash
# macOS/Linux
lsof -ti:7050 | xargs kill -9
lsof -ti:5050 | xargs kill -9

# Windows
netstat -ano | findstr :7050
taskkill /PID <PID> /F
```

### Issue: "Could not connect to PostgreSQL"

**Solutions:**

1. **Check if PostgreSQL is running:**
   ```bash
   # macOS (Homebrew)
   brew services list
   
   # Linux
   systemctl status postgresql
   
   # Windows
   services.msc
   # Look for "postgresql" service
   ```

2. **Verify connection string** in `appsettings.json`

3. **Test connection manually:**
   ```bash
   psql -U prince -h localhost -p 5432 -d EdifyDB
   ```

4. **Check PostgreSQL logs:**
   ```bash
   # macOS (Homebrew)
   tail -f /usr/local/var/log/postgres.log
   
   # Linux
   sudo journalctl -u postgresql -f
   ```

### Issue: "Migration not found" or "No DbContext was found"

**Solution:** Ensure you're in the correct directory:

```bash
cd src/Edify.API
dotnet ef database update --project ../Edify.DAL
```

### Issue: "JWT token expired" or "401 Unauthorized"

**Solutions:**

1. **Get a new token** by logging in again (tokens expire after 60 minutes)
2. **Check Authorization header format** in Swagger: `Bearer YOUR_TOKEN`
3. **Verify token** at [jwt.io](https://jwt.io)

### Issue: "NuGet package restore failed"

**Solution:**

```bash
# Clear NuGet cache
dotnet nuget locals all --clear

# Restore packages
dotnet restore
```

### Issue: Build errors after git pull

**Solution:**

```bash
# Clean and rebuild
dotnet clean
dotnet restore
dotnet build
```

### Issue: "permission denied" when creating database

**Solution:**

```bash
# Grant privileges to your user
psql -U postgres

ALTER USER prince CREATEDB;
GRANT ALL PRIVILEGES ON DATABASE "EdifyDB" TO prince;
\q
```

## API Endpoints

### Authentication (`/api/auth`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/auth/register` | Register new user | No |
| POST | `/api/auth/login` | Login user | No |
| POST | `/api/auth/logout` | Logout user | Yes |

### Courses (`/api/courses`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/courses` | Create course (Teacher) | Yes |
| POST | `/api/courses/join` | Join course (Student) | Yes |
| GET | `/api/courses/my-courses` | Get enrolled courses | Yes |
| GET | `/api/courses/{id}/enrollment-requests` | View requests (Teacher) | Yes |
| POST | `/api/courses/enrollment/approve` | Approve/deny request | Yes |

## User Roles

### Role Values:
- `0` = **Student**
- `1` = **Teacher**

### Permissions:

**Students can:**
- Register and login
- Join courses with invitation code
- View their enrolled courses

**Teachers can:**
- Register and login
- Create courses
- View enrollment requests
- Approve/deny student enrollments

## Security Features

- Password Hashing: BCrypt with automatic salting
- JWT Authentication: Stateless, scalable tokens
- Role-Based Authorization: Separate permissions for roles
- Input Validation: Data annotations on all DTOs
- HTTPS: Enforced in production
- CORS: Configurable for production
- Exception Handling: Global middleware for consistent errors

## Technologies Used

| Category | Technology | Version |
|----------|------------|---------|
| Framework | .NET | 9.0 |
| Database | PostgreSQL | 16+ |
| ORM | Entity Framework Core | 9.0 |
| Authentication | JWT Bearer | 9.0 |
| Password Hashing | BCrypt.Net | 4.0.3 |
| API Docs | Swagger/OpenAPI | 6.5.0 |

## Next Steps

Now that you have the basic setup running:

1. Test the registration and login endpoints
2. Explore the API in Swagger UI
3. Read the [Sprint Plan](SPRINT_PLAN.md) for upcoming features
4. Review the [README](README.md) for architecture details
5. Start implementing Sprint 2 features (Learning Materials)

## Common Workflows

### Daily Development Workflow

```bash
# 1. Ensure PostgreSQL is running
brew services list  # macOS
systemctl status postgresql  # Linux

# 2. Navigate to API project
cd /Users/prince/Developer/Edify/src/Edify.API

# 3. Run with hot reload
dotnet watch run

# 4. Open Swagger
# https://localhost:7050/swagger
```

### Adding a New Migration

```bash
# 1. Make changes to entities in Edify.Core/Entities/

# 2. Create migration
cd src/Edify.API
dotnet ef migrations add YourMigrationName --project ../Edify.DAL

# 3. Review the migration in src/Edify.DAL/Migrations/

# 4. Apply to database
dotnet ef database update
```

### Checking Database Changes

```bash
# Connect to database
psql -U prince -d EdifyDB -h localhost

# View schema
\d "Users"
\d "Courses"
\d "Enrollments"

# Query data
SELECT * FROM "Users";

# Exit
\q
```

## Tips for Success

1. Use Swagger for testing - it's faster than writing curl commands
2. Keep PostgreSQL running as a service
3. Use `dotnet watch run` - saves time during development
4. Copy JWT tokens to test protected endpoints
5. Check logs - the console output shows useful debugging info
6. Use pgAdmin for visual database management
7. Review migration files before applying them

## Getting Help

If you encounter issues:

1. Check the troubleshooting section above
2. Review error messages in the console
3. Check the logs in the terminal
4. Verify PostgreSQL is running and accessible
5. Ensure all NuGet packages are restored
6. Check that .NET 9 SDK is installed

## You're Ready

Your Edify LMS backend is ready for development. The authentication system is fully functional and you can now:

- Register students and teachers
- Authenticate with JWT tokens
- Test all endpoints via Swagger UI

Happy coding!

---

**Last Updated:** Sprint 1 - Authentication Complete  
**Current Version:** .NET 9.0 with PostgreSQL
