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

### 1. NanoID-based Short Code

- Random, URL-safe IDs
- Length: `7`
- Requires collision handling

### 2. Collision Handling 

Handled using retry + DB constraint:

```ts
for (let attempt = 0; attempt < 5; attempt++) {
  try {
    // insert
  } catch (err) {
    // retry on unique constraint (P2002)
  }
}
```

---

## Current Flow
