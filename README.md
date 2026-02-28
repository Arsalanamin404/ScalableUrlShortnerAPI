# Scalable URL Shortener API

A backend service for shortening URLs, built with **NestJS + Prisma + PostgreSQL**, focusing on **scalability and production-grade patterns**.

---

## Current Features

- Short URL generation using **NanoID**
- Collision handling with retry mechanism
- Optional expiration support
- Resolve short URL → original URL
- Clean architecture (Service + Repository pattern)
- Type-safe error handling (Prisma + TypeScript strict mode)

---

### NanoID-based Short Code

- Random, URL-safe IDs
- Length: `7`
- Requires collision handling

### Rate Limiting

To ensure scalability and protect the system from abuse, the API implements distributed rate limiting using Redis. It uses a fixed-window algorithm via `rate-limiter-flexible`, where each request is tracked using a unique key based on user ID or IP along with the route. Each key has a defined limit (number of requests) and duration (time window). On every request, the counter is decremented, and once the limit is exceeded, further requests are blocked with an HTTP 429 response until the key expires. Redis handles this with atomic operations and automatic TTL-based cleanup, ensuring consistency across multiple instances. Strict rate limits are applied to write-heavy endpoints like URL creation to prevent spam, while read-heavy endpoints like URL resolution are kept less restrictive to support high traffic.
