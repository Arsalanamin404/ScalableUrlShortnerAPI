# Scalable URL Shortener API

A production-grade backend service for shortening URLs, built with **NestJS + Prisma + PostgreSQL + Redis + BullMQ**, designed for **high scalability, reliability, and clean architecture**.

---

## Core Features

* Short URL generation using **NanoID**
* Collision handling with retry mechanism
* Optional expiration support for URLs
* Resolve short URL → original URL
* Background cleanup of expired URLs (BullMQ workers)
* Distributed rate limiting using Redis
* Clean architecture (Service + Repository pattern)
* Type-safe error handling (Prisma + strict TypeScript)

---

### NanoID-based Short Code

* Random, URL-safe IDs
* Fixed length: `7`
* Handles collisions via retry mechanism
* Optimized for high concurrency scenarios

---

### Distributed Rate Limiting

To ensure scalability and protect the system from abuse, the API implements **distributed rate limiting using Redis** via `rate-limiter-flexible`.

* Uses **fixed-window algorithm**
* Keys are based on:

  * User ID (if authenticated)
  * IP address (fallback)
  * Route

#### Behavior

* Each request decrements a counter
* Once limit is exceeded, request blocked with `HTTP 429`
* TTL ensures automatic cleanup

#### Strategy

* Strict limits → write-heavy endpoints (URL creation)
* Relaxed limits → read-heavy endpoints (URL resolution)

---

### Background Cleanup (BullMQ)

Expired URLs are cleaned asynchronously using **BullMQ queues and workers**, ensuring the API remains fast and responsive.

#### Architecture

``` 
CleanupProducer → Redis Queue → CleanupProcessor (Worker)
```

#### Implementation Details

* Runs every **1 hour** using repeatable jobs
* Processes data in **batches (50 records)**
* Loops until all expired records are cleaned
* Uses **idempotent operations** (safe retries)

#### Responsibilities

##### Producer

* Schedules recurring cleanup jobs
* Ensures no duplicate jobs using `jobId`

##### Worker (Processor)

* Fetches expired URLs
* Deletes:

  * DB records (PostgreSQL via Prisma)
  * Cached entries (Redis)
* Runs with controlled concurrency

#### Reliability Features

* Retry strategy with exponential backoff
* QueueScheduler for delayed/repeat job consistency
* Graceful shutdown handling
* Batch processing to avoid DB overload

---

### Performance Considerations

* Redis caching for fast URL resolution
* Batch cleanup to reduce DB pressure
* Background jobs to offload heavy tasks
* Controlled concurrency in workers

---

