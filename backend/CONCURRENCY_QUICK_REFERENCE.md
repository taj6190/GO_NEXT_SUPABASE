# Go Concurrency Quick Reference Card

## Pattern Selector Matrix

```
Need to do?                    → Use This        → Benefit
────────────────────────────────────────────────────────────
2-5 independent fetches        → ParallelExecutor → 50% faster
10+ items to process           → WorkerPool       → 5-10x faster
Limit concurrent DB ops        → Semaphore        → Prevent overload
Call unreliable API            → RetryWithBackoff → Handle failures
External service might fail    → CircuitBreaker   → Prevent cascade
Process items as pipeline      → Pipeline/FanOut  → Scalable design
Multiple data sources          → FanOut/FanIn     → Distributed fetch
Prevent deadlock               → WithTimeout      → Safety net
```

---

## Copy-Paste Snippets

### 1. Parallel Queries (50% faster)

```go
executor := utils.NewParallelExecutor()

executor.Execute(ctx, "key1", func() (interface{}, error) {
    return query1(ctx)
})

executor.Execute(ctx, "key2", func() (interface{}, error) {
    return query2(ctx)
})

results, errors := executor.Wait()
if err, ok := errors["key1"]; ok {
    // handle error
}
data := results["key1"]  // type assert to actual type
```

### 2. Bulk Processing (5-10x faster)

```go
pool := utils.NewWorkerPool(ctx, 5)  // 5 workers

for _, item := range items {
    itemCopy := item  // Important: capture!
    pool.Submit(func(taskCtx context.Context) error {
        return process(taskCtx, itemCopy)
    })
}

pool.Wait()
```

### 3. Rate Limited Queries (Prevent DB overload)

```go
sem := utils.NewSemaphore(3)  // Max 3 concurrent

executor.Execute(ctx, "expensive", func() (interface{}, error) {
    sem.Acquire()
    defer sem.Release()
    return expensiveQuery(ctx)
})
```

### 4. Retry Flaky API (99.9% reliability)

```go
cfg := utils.RetryConfig{
    MaxAttempts: 3,
    InitialWait: 100*time.Millisecond,
    MaxWait: 5*time.Second,
    Multiplier: 2.0,
}

err := utils.RetryWithBackoff(ctx, cfg, func() error {
    return externalAPI.Call()
})
```

### 5. Circuit Breaker (Prevent cascading)

```go
breaker := utils.NewCircuitBreaker(5, 30*time.Second)

err := breaker.Call(func() error {
    return unreliableService.Call()
})
// Returns ErrCircuitBreakerOpen if service failing
```

### 6. Timeout Protection (Prevent hanging)

```go
ctx, cancel := context.WithTimeout(ctx, 5*time.Second)
defer cancel()

executor.Execute(ctx, "task", func() (interface{}, error) {
    return slowOperation(ctx)
})

results, errs := executor.Wait()
// If timeout, ctx.Err() in errors["task"]
```

---

## Performance Gains Checklist

| Optimization                             | Effort | Gain              | Priority  |
| ---------------------------------------- | ------ | ----------------- | --------- |
| Product page (ParallelExecutor)          | 30 min | 30% faster        | 🔴 First  |
| Admin dashboard (Semaphore)              | 45 min | 40% faster        | 🔴 First  |
| Bulk import (WorkerPool)                 | 1 hour | 80% faster        | 🟡 Second |
| Payment retry (RetryWithBackoff)         | 30 min | 99.9% reliability | 🟡 Second |
| Payment circuit breaker (CircuitBreaker) | 45 min | Prevents cascade  | 🟡 Second |

---

## Debugging Concurrent Issues

```go
// 1. See all goroutines
import _ "net/http/pprof"
go http.ListenAndServe(":6060", nil)
// Visit: http://localhost:6060/debug/pprof/goroutine

// 2. Add detailed logging
log.Printf("Starting task pool with %d workers", numWorkers)
log.Printf("Task %s completed in %dms", name, elapsed)

// 3. Use context cancellation
ctx, cancel := context.WithCancel(parentCtx)
defer cancel()

// 4. Detect deadlocks (add to main)
signal.Notify(make(chan os.Signal), syscall.SIGABRT)

// 5. Benchmark your changes
go test -bench=. -benchmem ./...
```

---

## When NOT to Use Concurrency

❌ **Don't parallelize if**:

- Single operation is < 10ms (overhead > benefit)
- Operations depend on each other (sequential)
- Memory is limited (goroutines = memory)
- Simple CRUD with single query

✅ **Do parallelize when**:

- Multiple independent I/O operations (db, API)
- Bulk processing > 10 items
- Response time matters for users
- External service reliability is questionable

---

## Memory Impact

| Pattern          | Goroutines | Memory/Goroutine | Total for 100 tasks |
| ---------------- | ---------- | ---------------- | ------------------- |
| Sequential       | 1          | -                | -                   |
| ParallelExecutor | 5          | ~2KB             | ~10KB               |
| WorkerPool(5)    | 5          | ~2KB             | ~10KB               |
| Unbounded (BAD)  | 100        | ~2KB             | ~200KB              |

**Rule**: Always bound concurrency (WorkerPool) never unlimited goroutines!

---

## Common Pattern Combinations

### Pattern A: API Fetch with Safety

```go
breaker := utils.NewCircuitBreaker(5, 30*time.Second)
cfg := utils.RetryConfig{MaxAttempts: 3, InitialWait: 100*time.Millisecond, ...}

err := breaker.Call(func() error {
    return utils.RetryWithBackoff(ctx, cfg, func() error {
        return externalAPI.Fetch()
    })
})
```

### Pattern B: Heavy Processing Pipeline

```go
pool := utils.NewWorkerPool(ctx, numCPU)
sem := utils.NewSemaphore(3)

for item := range items {
    itemCopy := item
    pool.Submit(func(taskCtx context.Context) error {
        sem.Acquire()
        defer sem.Release()
        return processWithDB(taskCtx, itemCopy)
    })
}
pool.Wait()
```

### Pattern C: Real-time Dashboard

```go
sem := utils.NewSemaphore(3)
executor := utils.NewParallelExecutor()

for query := range dashboardQueries {
    q := query
    executor.Execute(ctx, q.name, func() (interface{}, error) {
        sem.Acquire()
        defer sem.Release()
        return q.fn(ctx)
    })
}

results, _ := executor.Wait()
return dashboard(results)
```

---

## Testing Concurrent Code

```go
func TestParallelFetch(t *testing.T) {
    ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
    defer cancel()

    executor := utils.NewParallelExecutor()

    executor.Execute(ctx, "test", func() (interface{}, error) {
        return "result", nil
    })

    results, errors := executor.Wait()

    if len(errors) > 0 {
        t.Fatalf("got errors: %v", errors)
    }

    if result, ok := results["test"]; !ok || result != "result" {
        t.Fatalf("unexpected result: %v", result)
    }
}

func BenchmarkParallel(b *testing.B) {
    for i := 0; i < b.N; i++ {
        executor := utils.NewParallelExecutor()
        executor.Execute(context.Background(), "test", func() (interface{}, error) {
            return "result", nil
        })
        executor.Wait()
    }
}
```

---

## Monitoring & Alerting

```go
// Track concurrency metrics
type Metrics struct {
    ActiveGoroutines   int
    DBConnections      int
    AvgResponseTime    time.Duration
    P95ResponseTime    time.Duration
    ErrorRate          float64
}

// Alert if:
// - Goroutines > 1000 (memory leak?)
// - DB Connections > MaxPoolSize * 0.8 (bottleneck?)
// - ErrorRate > 1% (degradation?)
// - P95 > 2s (timeout risk?)
```

---

## Production Checklist

- [ ] All external API calls use CircuitBreaker
- [ ] Payment processing uses RetryWithBackoff
- [ ] Bulk operations use WorkerPool (not unlimited goroutines)
- [ ] Admin queries use Semaphore (protect DB)
- [ ] Context timeouts set (prevent hanging)
- [ ] Error handling for all concurrent paths
- [ ] Metrics collected for all patterns
- [ ] Benchmarks show improvements (go test -bench)
- [ ] Load test with concurrent users (hey, vegeta, etc)
- [ ] Graceful shutdown in main() (completed ✅)

---

## One-Liner Decisions

1. **Q: How many workers?** A: NumCPU for CPU-bound, NumCPU\*4 for I/O-bound
2. **Q: Semaphore size?** A: Pool max connections / number of handlers
3. **Q: Retry attempts?** A: 3 for APIs, 5 for critical
4. **Q: Circuit threshold?** A: 5-10 failures
5. **Q: Timeout?** A: 5s for external, 30s for DB, 60s for batch

---

Made for your Go e-commerce backend! 🚀
