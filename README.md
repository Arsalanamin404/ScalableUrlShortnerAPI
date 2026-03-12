# Scalable URL Shortener API

A **production-grade URL shortening service** built with **NestJS, PostgreSQL, Redis, Prisma, and BullMQ**.

The system is designed with **scalability, reliability, and clean architecture** in mind, using distributed caching, asynchronous job processing, and background workers to handle heavy workloads efficiently.

---

## System Architecture

![Architecture Diagram](./assets/architecture.jpeg)

---

## Table of Contents

* Live API
* Architecture Overview
* Core Features
* Technology Stack
* Setup and Installation
* Environment Variables
* NanoID Short Code Generation
* URL Resolution Flow
* Caching Strategy
* Analytics Tracking
* Distributed Rate Limiting
* Background Processing
* Cleanup Worker
* Worker Architecture
* Performance Benchmark
* Scaling Strategy
* API Endpoints
* API Documentation
* Failure Handling
* Project Structure
* Summary

---

## Live API

**Base URL**

`https://scalableurlshortnerapi.onrender.com/api/v1`

**Swagger Documentation**

`https://scalableurlshortnerapi.onrender.com/api/v1/docs`

**Health Endpoint**

`https://scalableurlshortnerapi.onrender.com/api/v1/health`

---

### Example Request

```bash
curl -X POST https://scalableurlshortnerapi.onrender.com/api/v1/url \
-H "Content-Type: application/json" \
-d '{"url":"https://google.com"}'
```

---

## Architecture Overview

```text
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

Heavy operations are delegated to **background workers**, allowing the API to respond quickly while processing analytics and maintenance tasks asynchronously.

---

## Core Features

* Short URL generation using **NanoID**
* Collision detection with retry mechanism
* Optional URL expiration support
* High-speed URL resolution using **Redis caching**
* Click analytics tracking
* Aggregated statistics per URL
* Distributed **rate limiting using Redis**
* **Asynchronous job processing with BullMQ**
* Background cleanup of expired URLs
* OpenAPI documentation via **Swagger**
* Structured logging using **Pino**
* Modular architecture using **Service and Repository patterns**
* Full **TypeScript + Prisma type safety**

---

## Technology Stack

| Layer             | Technology            |
| ----------------- | --------------------- |
| API Framework     | NestJS                |
| Database          | PostgreSQL            |
| ORM               | Prisma                |
| Cache             | Redis                 |
| Queue System      | BullMQ                |
| Rate Limiting     | rate-limiter-flexible |
| Logging           | Pino                  |
| API Documentation | Swagger               |

---

## Setup and Installation

Clone the repository:

```bash
git clone https://github.com/Arsalanamin404/ScalableUrlShortnerAPI.git
cd ScalableUrlShortnerAPI
```

Install dependencies:

```bash
npm install
```

Start required services:

```bash
docker compose up -d
```

Run database migrations:

```bash
npx prisma migrate deploy
```

Start the application:

```bash
npm run start:dev
```

---

## Environment Variables

Example `.env` configuration:

```env
NODE_ENV=development
PORT=1234
VERSION=1.0.0
APP_NAME=app_name
POSTGRES_USER=psql_user_name
POSTGRES_PASSWORD=psql_pw
POSTGRES_DB=psql_db_name
DATABASE_URL=postgresql://psql_user_name:psql_pw@postgres:5432/psql_db_name
REDIS_HOST=redis
REDIS_PORT=6379
ENABLE_SWAGGER=true
```

---

## NanoID-Based Short Code Generation

The system generates short URLs using **NanoID**, a secure and URL-safe ID generator.

### Characteristics

* URL-safe identifiers
* Fixed length of **7 characters**
* Extremely low collision probability
* Suitable for **high-concurrency systems**

### Collision Handling

If a generated code already exists:

1. The system retries up to **5 times**
2. Prisma unique constraint error (`P2002`) is detected
3. A new NanoID is generated

---

## URL Resolution Flow

```text
Client Request
     ↓
Redis Cache Lookup
     ↓
Cache Hit → Immediate Redirect
     ↓
Cache Miss → Database Query
     ↓
Cache Result Stored in Redis
     ↓
Redirect to Original URL
     ↓
Analytics Job Enqueued
```

This ensures **fast redirects while processing analytics asynchronously**.

---

## Caching Strategy

Redis is used as a **distributed caching layer** for URL resolution.

### Pattern

Cache-aside pattern:

1. Check Redis
2. If cache miss → query database
3. Store result in Redis

### Benefits

* Reduced database load
* Faster response times
* Improved scalability under heavy traffic

---

## Analytics Tracking

Each redirect produces an analytics event containing:

* URL ID
* IP address
* User agent
* Timestamp

Analytics processing is performed asynchronously using **BullMQ workers**.

---

## Analytics Storage Design

### Raw Click Events

Each redirect inserts a **ClickEvent** record containing:

* URL identifier
* IP address
* user agent
* timestamp

---

### Aggregated Statistics

The **UrlStats** table stores:

* totalClicks per URL
* last update timestamp

This enables **fast analytics queries without scanning raw events**.

---

## Analytics Processing Pipeline

```text
Redirect Request
      ↓
Analytics Producer
      ↓
BullMQ Queue
      ↓
Analytics Worker
      ↓
Database Transaction
   ├─ Insert ClickEvent
   └─ Increment UrlStats
```

Advantages:

* Non-blocking redirects
* Reliable event processing
* Scalable analytics ingestion

---

## Distributed Rate Limiting

API endpoints are protected using **Redis-backed rate limiting**.

### Algorithm

Fixed Window Counter

### Rate Limit Keys

Generated using:

* User ID (if authenticated)
* Client IP address
* API endpoint

### Behavior

* Requests decrement a counter
* When limit is exceeded → **HTTP 429**
* Redis TTL automatically resets limits

---

## Background Processing (BullMQ)

BullMQ enables asynchronous task execution.

### Queue Architecture

```text
Producer → Redis Queue → Worker
```

### Current Queues

* Analytics Queue
* Cleanup Queue

### Planned Queues

* Email Queue
* Notification Queue

---

## Cleanup Worker

Expired URLs are removed automatically by a scheduled worker.

### Schedule

Runs every:

```
1 hour
```

### Processing Strategy

* Batch size: **50 records**
* Continues until no expired URLs remain

### Responsibilities

1. Fetch expired URLs
2. Remove from PostgreSQL
3. Delete cached Redis entries

---

## Worker Architecture

Workers run independently from the API server.

Benefits:

* Fault isolation
* Horizontal scalability
* Improved performance under load

---

## Performance Benchmark

Load testing performed using **Autocannon**.

```bash
npx autocannon -c 100 -d 10 http://localhost:4000/api/v1/url/fzlhrBX
```

Example results:

```text
Concurrency: 100
Duration: 10 seconds

Requests/sec: ~8500
Average latency: ~11 ms
p99 latency: ~40 ms
```

These results demonstrate **high throughput and low latency under concurrent load**.

---

## Scaling Strategy

```text
Load Balancer
     ↓
API Instance 1
API Instance 2
API Instance 3
     ↓
Shared Redis + PostgreSQL
```

Workers can also be scaled independently depending on queue workload.

---

## API Endpoints

| Method | Endpoint                  | Description              |
| ------ | ------------------------- | ------------------------ |
| POST   | `/api/v1/url`             | Create a short URL       |
| GET    | `/api/v1/url/:code`       | Redirect to original URL |
| GET    | `/api/v1/analytics/:code` | Retrieve analytics       |

---

## API Documentation

Swagger documentation is available at:

``` bash
/api/docs
```

Provides:

* Interactive API exploration
* Request and response examples
* Schema documentation

---

## Failure Handling

Reliability mechanisms include:

* BullMQ retry with exponential backoff
* Idempotent job processing
* Structured logging
* Safe database transactions

Failed jobs can be inspected and retried from the queue.

---

## Project Structure

```text
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

## Summary

This project demonstrates a **scalable backend architecture** for a URL shortener service.

Key design principles include:

* Redis-based caching
* asynchronous job processing with BullMQ
* scalable analytics collection
* modular NestJS architecture
* distributed rate limiting

The system is designed to maintain **high performance and reliability under heavy traffic conditions**.
