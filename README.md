# Scalable URL Shortener API

A production-grade backend service for shortening URLs, built with **NestJS + Prisma + PostgreSQL + Redis + BullMQ**, designed for high scalability, reliability, and clean architecture.

---

## System Architecture

```
Client → API (NestJS)
        ↓
     Redis (Cache + Queue)
        ↓
   PostgreSQL (Primary DB)

Background Workers:
- Cleanup Worker
- Email Worker (future)
- Notification Worker (future)
- Analytics Worker (future)
```

---

## Core Features

- Short URL generation using NanoID
- Collision handling with retry mechanism
- Optional expiration support for URLs
- Resolve short URL to original URL
- Background cleanup of expired URLs (BullMQ workers)
- Distributed rate limiting using Redis
- Clean architecture (Service + Repository pattern)
- Type-safe error handling with Prisma and strict TypeScript

---

## NanoID-based Short Code

- Random, URL-safe IDs
- Fixed length of 7 characters
- Collision handling via retry mechanism
- Optimized for high concurrency scenarios

---

## Distributed Rate Limiting

To ensure scalability and protect the system from abuse, the API implements distributed rate limiting using Redis via `rate-limiter-flexible`.

### Strategy

- Algorithm: Fixed Window Counter
- Storage: Redis (shared across instances)
- Keys are based on:
  - User ID (if authenticated)
  - IP address (fallback)
  - Route

### Behavior

- Each request decrements a counter
- Once the limit is exceeded, the request is blocked with HTTP 429
- TTL ensures automatic cleanup of rate limit data

### Policy

- Strict limits for write-heavy endpoints (URL creation)
- Relaxed limits for read-heavy endpoints (URL resolution)

---

## Background Processing (BullMQ)

The system uses BullMQ for asynchronous job processing to offload heavy operations from the request lifecycle.

### Queues

- Cleanup Queue (expired URLs)
- Email Queue (planned)
- Notification Queue (planned)
- Analytics Queue (planned)

### Architecture

```
Producer → Redis Queue → Worker (Processor)
```

---

## Cleanup Job

### Overview

Expired URLs are cleaned asynchronously using a background worker to keep the database and cache optimized.

### Scheduling

- Runs every 1 hour using repeatable jobs

### Processing Strategy

- Batch size: 50 records
- Iterative processing until no expired records remain

### Responsibilities

#### Producer

- Schedules recurring cleanup jobs
- Prevents duplicate jobs using a fixed jobId

#### Worker (Processor)

- Fetches expired URLs from the database
- Deletes:
  - Records from PostgreSQL via Prisma
  - Cached entries from Redis
- Executes with controlled concurrency

---

## Worker Architecture

Workers are designed to run independently from the API service.

### Benefits

- Horizontal scalability
- Fault isolation
- Improved performance under load

---

## Caching Strategy

- Redis is used for caching short URL lookups
- Cache-aside pattern is implemented
- Expired URLs are invalidated during cleanup
- Reduces database load for high-frequency read operations

---

## Failure Handling

- Jobs are retried using exponential backoff
- Idempotent operations ensure safe retries
- Failures do not corrupt system state
- Failed jobs can be inspected and retried manually

---

## Performance Considerations

- Redis caching for fast URL resolution
- Batch processing to reduce database load
- Background jobs to offload heavy operations
- Controlled concurrency in workers

---

## Scalability

The system is designed for horizontal scalability.

### Key Principles

- Stateless API servers
- Shared Redis instance for queues and caching
- Independently scalable worker processes
- Optimized database queries with indexing

### Capabilities

- High read throughput using caching
- Efficient background processing using queues
- Isolation of workloads across multiple queues

---

## Summary

This system implements a scalable, event-driven backend architecture using Redis and BullMQ for asynchronous processing. It is designed to handle high traffic efficiently while maintaining responsiveness, reliability, and clean separation of concerns.
