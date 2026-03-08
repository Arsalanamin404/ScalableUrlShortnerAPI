# Scalable URL Shortener API

A production-grade backend service for shortening URLs, built with **NestJS, Prisma, PostgreSQL, Redis, and BullMQ**. The system is designed for **high scalability, reliability, and clean architecture**, supporting asynchronous processing, distributed rate limiting, caching, and analytics tracking.

---

# System Architecture

``` bash
Client
   ↓
API Layer (NestJS)
   ↓
Redis
 ├─ Cache (URL resolution)
 └─ Queue (BullMQ jobs)
   ↓
PostgreSQL (Primary Database)

Background Workers
 ├─ Cleanup Worker
 ├─ Analytics Worker
 ├─ Email Worker (planned)
 └─ Notification Worker (planned)
```

The architecture separates synchronous request handling from heavy operations using background workers and queues.

---

# Core Features

* Short URL generation using NanoID
* Collision handling with retry mechanism
* Optional expiration support for URLs
* Fast URL resolution using Redis caching
* Click analytics tracking
* Aggregated statistics per URL
* Distributed rate limiting using Redis
* Asynchronous job processing using BullMQ
* Background cleanup of expired URLs
* OpenAPI documentation using Swagger
* Structured logging using Pino
* Clean architecture using Service and Repository patterns
* Strict TypeScript and Prisma type safety

---

# Technology Stack

| Layer         | Technology            |
| ------------- | --------------------- |
| API Framework | NestJS                |
| Database      | PostgreSQL            |
| ORM           | Prisma                |
| Cache         | Redis                 |
| Queue System  | BullMQ                |
| Rate Limiting | rate-limiter-flexible |
| Logging       | Pino                  |
| API Docs      | Swagger               |

---

# NanoID-Based Short Code Generation

The system generates short URLs using **NanoID**, which produces secure and URL-safe identifiers.

### Characteristics

* URL-safe random IDs
* Fixed length of 7 characters
* Very low collision probability
* Suitable for high-concurrency environments

### Collision Handling

If a generated code already exists:

1. The system retries up to **5 times**
2. Prisma unique constraint error (`P2002`) is detected
3. A new NanoID is generated and retried

---

# URL Resolution Flow

```
Client Request
     ↓
Redis Cache Lookup
     ↓
Cache Hit → Immediate Redirect
     ↓
Cache Miss → Database Query
     ↓
Cache Result in Redis
     ↓
Redirect to Original URL
     ↓
Analytics Job Enqueued
```

This approach ensures fast responses while capturing analytics asynchronously.

---

# Caching Strategy

Redis is used as a **distributed cache** for URL resolution.

### Pattern Used

Cache-aside pattern:

1. Check Redis cache
2. If miss → query database
3. Store result in Redis

### Benefits

* Reduced database load
* Faster URL resolution
* Better scalability under high traffic

---

# Analytics Tracking

Each redirect generates an **analytics event** containing:

* URL ID
* IP address
* User agent
* Timestamp

Analytics processing is handled asynchronously through BullMQ workers.

---

# Analytics Storage Design

Analytics data is stored in two forms:

## Raw Click Events

```
ClickEvent
```

Each click stores:

* URL identifier
* IP address
* User agent
* timestamp

This allows detailed traffic analysis.

---

## Aggregated URL Statistics

```
UrlStats
```

Stores aggregated metrics:

* totalClicks per URL
* last update timestamp

This allows fast analytics queries without scanning large datasets.

---

# Analytics Processing Pipeline

```
Redirect Request
      ↓
AnalyticsProducer
      ↓
BullMQ Queue
      ↓
Analytics Worker
      ↓
Database Transaction
   ├─ Insert ClickEvent
   └─ Increment UrlStats
```

### Advantages

* Non-blocking redirects
* Reliable background processing
* High scalability for analytics ingestion

---

# Distributed Rate Limiting

Rate limiting protects the API from abuse using **Redis-backed counters**.

### Algorithm

Fixed Window Counter

### Key Generation

Rate limits are calculated based on:

* Authenticated user ID (if available)
* Client IP address
* Route handler

### Behavior

* Each request decrements a counter
* Requests exceeding the limit return **HTTP 429**
* Counters expire automatically using Redis TTL

### Example Policy

| Endpoint    | Limit   |
| ----------- | ------- |
| Create URL  | Strict  |
| Resolve URL | Relaxed |

---

# Background Processing (BullMQ)

BullMQ handles asynchronous tasks to keep API responses fast.

### Queue Architecture

```
Producer → Redis Queue → Worker
```

### Current Queues

* Cleanup Queue
* Analytics Queue

### Planned Queues

* Email Queue
* Notification Queue

---

# Cleanup Worker

Expired URLs are removed automatically by a scheduled worker.

### Schedule

Cleanup job runs every:

```
1 hour
```

### Processing Strategy

* Batch size: 50 records
* Iterates until no expired URLs remain

### Responsibilities

1. Fetch expired URLs
2. Delete records from PostgreSQL
3. Remove cached entries from Redis

---

# Worker Architecture

Workers run **independently from the API server**.

### Benefits

* Fault isolation
* Horizontal scalability
* Improved performance under load

Workers can be scaled independently depending on traffic.

---

# Performance Considerations

The system is optimized for high performance:

* Redis caching for fast URL resolution
* Asynchronous analytics processing
* Background cleanup jobs
* Indexed database queries
* Controlled worker concurrency

---

# Benchmark

Load testing performed using **Autocannon**.

``` bash
npx autocannon -c 100 -d 10 http://localhost:4000/api/v1/url/fzlhrBX
```

This will simulate 100 concurrent users

Example benchmark:

``` bash
Concurrency: 100
Duration: 10 seconds

Requests/sec: ~8500
Average latency: ~11 ms
p99 latency: ~40 ms
```

These results demonstrate the system's ability to handle **high request throughput** efficiently.

---

# Scaling Strategy

API instances can be scaled independently:

```
Load Balancer
     ↓
API Instance 1
API Instance 2
API Instance 3
     ↓
Shared Redis + PostgreSQL
```

Workers can also be scaled independently for heavy background workloads.

---

# API Endpoints

| Method | Endpoint                  | Description              |
| ------ | ------------------------- | ------------------------ |
| POST   | `/api/v1/url`             | Create a short URL       |
| GET    | `/api/v1/url/:code`       | Redirect to original URL |
| GET    | `/api/v1/analytics/:code` | Retrieve click analytics |

---

# API Documentation

Swagger documentation is available at:

```
/api/docs
```

Swagger provides:

* Interactive API exploration
* Request/response examples
* Schema documentation

---

# Failure Handling

The system ensures reliability through:

* BullMQ job retries with exponential backoff
* Idempotent job design
* Structured error logging
* Safe database transactions

Failed jobs can be inspected and retried.

---

# Project Structure

```bash
src
 ├─ modules
 │   ├─ url
 │   └─ analytics
 ├─ common
 │   ├─ redis
 │   ├─ rate-limit
 │   └─ jobs
 ├─ prisma
 └─ config
```

The architecture enforces clear separation between:

* controllers
* services
* repositories
* background workers

---

# Summary

This project implements a **scalable URL shortener backend** using an event-driven architecture. Redis provides caching and queue infrastructure, BullMQ handles asynchronous workloads, and PostgreSQL stores persistent data.

The system supports:

* high read throughput
* reliable background processing
* scalable analytics collection
* clean modular architecture

It is designed to perform efficiently under high traffic while maintaining maintainability and operational reliability.
