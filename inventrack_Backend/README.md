# InvenTrack — Spring Boot Backend API

A production-ready REST API for the InvenTrack Inventory Management System.

## 🚀 Tech Stack

| Layer | Technology |
|---|---|
| Framework | Spring Boot 3.2.3 |
| Language | Java 17 |
| Database | PostgreSQL 15+ |
| ORM | Spring Data JPA / Hibernate |
| Security | Spring Security + JWT (JJWT) |
| Migrations | Flyway |
| Docs | SpringDoc OpenAPI 3 (Swagger UI) |
| Build | Maven |

---

## 📁 Project Structure

```
src/main/java/com/inventrack/
├── config/               # Security, OpenAPI, JPA auditing
├── controller/           # REST controllers (12 modules)
├── dto/
│   ├── request/          # Request body DTOs
│   └── response/         # Response DTOs
├── entity/               # JPA entities
├── enums/                # UserRole, ProductStatus, etc.
├── exception/            # Global exception handler
├── repository/           # Spring Data JPA repositories
├── security/             # JWT filter & utility
└── service/impl/         # Business logic services

src/main/resources/
├── application.properties
├── application-test.properties
└── db/migration/
    ├── V1__Initial_Schema.sql
    └── V2__Seed_Data.sql
```

---

## ⚙️ Prerequisites

- Java 17+
- Maven 3.9+
- PostgreSQL 15+
- (Optional) Docker

---

## 🛠️ Setup & Run

### 1. Clone / get the project
```bash
# If starting fresh
mkdir inventrack && cd inventrack
# Copy all files from the zip
```

### 2. Create PostgreSQL database
```bash
psql -U postgres
CREATE DATABASE inventrack;
\q
```

### 3. Configure database credentials
Edit `src/main/resources/application.properties`:
```properties
spring.datasource.url=jdbc:postgresql://localhost:5432/inventrack
spring.datasource.username=YOUR_PG_USERNAME
spring.datasource.password=YOUR_PG_PASSWORD
```

### 4. Build and run
```bash
# Build
mvn clean install

# Run
mvn spring-boot:run

# Or run the JAR
java -jar target/inventrack-api-1.0.0.jar
```

### 5. Verify it's running
```
GET http://localhost:8080/api/v1/actuator/health
```

---

## 🐳 Docker Quick Start

```bash
# Start PostgreSQL
docker run -d \
  --name inventrack-db \
  -e POSTGRES_DB=inventrack \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  -p 5432:5432 \
  postgres:15

# Build and run the app
mvn clean package -DskipTests
java -jar target/inventrack-api-1.0.0.jar
```

### Docker Compose (recommended)
```yaml
# docker-compose.yml
version: '3.8'
services:
  db:
    image: postgres:15
    environment:
      POSTGRES_DB: inventrack
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
    ports:
      - "5432:5432"

  app:
    build: .
    ports:
      - "8080:8080"
    depends_on:
      - db
    environment:
      SPRING_DATASOURCE_URL: jdbc:postgresql://db:5432/inventrack
      SPRING_DATASOURCE_USERNAME: postgres
      SPRING_DATASOURCE_PASSWORD: postgres
```

```bash
docker-compose up -d
```

---

## 📖 API Documentation

Once running, open Swagger UI:
```
http://localhost:8080/api/v1/swagger-ui.html
```

OpenAPI JSON:
```
http://localhost:8080/api/v1/api-docs
```

---

## 🔐 Authentication

All endpoints (except `/auth/**`) require a Bearer token.

### Login
```bash
curl -X POST http://localhost:8080/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@inventrack.com","password":"admin123"}'
```

### Use the token
```bash
curl http://localhost:8080/api/v1/products \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Demo Users (seeded by V2 migration)
| Email | Password | Role |
|---|---|---|
| admin@inventrack.com | admin123 | ADMIN |
| manager@inventrack.com | admin123 | MANAGER |
| staff@inventrack.com | admin123 | STAFF |
| viewer@inventrack.com | admin123 | VIEWER |

---

## 🔗 Key API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| POST | `/auth/login` | Login |
| GET | `/products` | List products |
| POST | `/products` | Create product |
| GET | `/products/{id}` | Get product |
| PATCH | `/products/{id}` | Update product |
| GET | `/products/low-stock` | Low stock alerts |
| POST | `/movements` | Record stock movement |
| GET | `/inventory/alerts` | Inventory alerts |
| GET | `/reports/inventory-valuation` | Valuation report |
| GET | `/reports/stock-movement` | Movement report |
| GET | `/reports/reorder` | Reorder report |
| GET | `/reports/top-products` | Top products |
| GET | `/users` | List users (Admin) |
| POST | `/users` | Create user (Admin) |

---

## 🧪 Run Tests

```bash
mvn test
```

---

## 🔧 Common Issues

**Port already in use:**
```bash
server.port=8090  # change in application.properties
```

**Flyway migration error:**
```bash
# Reset and rerun migrations
mvn flyway:clean flyway:migrate -Dflyway.url=jdbc:postgresql://localhost:5432/inventrack \
  -Dflyway.user=postgres -Dflyway.password=postgres
```

**JWT token expired:** Use `/auth/refresh` with your refresh token.

---

## 🌐 CORS Configuration

By default allows:
- `http://localhost:5173` (Vite React dev)
- `http://localhost:3000` (Create React App)

To add more origins, update `application.properties`:
```properties
app.cors.allowed-origins=http://localhost:5173,https://yourdomain.com
```
