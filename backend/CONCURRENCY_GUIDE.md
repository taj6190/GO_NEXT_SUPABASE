# Go Concurrency Patterns - Backend Implementation Guide

## 🎯 Current Status

Your backend **already uses basic concurrency**:

- ✅ Goroutine for HTTP server startup (line 281-286 in main.go)
- ✅ Context for request cancellation
- ❌ **Missing**: Concurrent query execution, worker pools, fan-out/fan-in

---

## 📚 Patterns & Use Cases

### 1. **ParallelExecutor** - Best for Independent Queries

**Use when**: You need multiple independent data fetches (product + reviews + images)

```go
// Example: Product detail page
func (h *ProductHandler) GetBySlug(c *gin.Context) {
    slug := c.Param("slug")
    ctx := c.Request.Context()

    executor := utils.NewParallelExecutor()

    // Fetch product, reviews, and related products in parallel
    executor.Execute(ctx, "product", func() (interface{}, error) {
        return h.productService.GetBySlug(ctx, slug)
    })

    executor.Execute(ctx, "reviews", func() (interface{}, error) {
        return h.reviewService.GetByProduct(ctx, productID)
    })

    executor.Execute(ctx, "related", func() (interface{}, error) {
        return h.productService.GetRelated(ctx, productID)
    })

    results, errors := executor.Wait()

    // Handle results
    if err, exists := errors["product"]; exists {
        c.JSON(400, gin.H{"error": err.Error()})
        return
    }

    product := results["product"].(*domain.Product)
    reviews := results["reviews"].([]domain.Review)
    related := results["related"].([]domain.Product)

    c.JSON(200, gin.H{
        "product": product,
        "reviews": reviews,
        "related": related,
    })
}
```

### 2. **WorkerPool** - Best for Bulk Operations

**Use when**: Processing many items (bulk product import, batch updates)

```go
// Example: Bulk product import
func (h *ProductHandler) BulkImport(c *gin.Context) {
    var items []domain.CreateProductInput
    c.BindJSON(&items)

    // Create pool with 5 concurrent workers
    pool := utils.NewWorkerPool(c.Request.Context(), 5)
    successCount := 0
    mu := sync.Mutex{}

    for _, item := range items {
        itemCopy := item // capture for closure
        pool.Submit(func(ctx context.Context) error {
            _, err := h.productService.Create(ctx, itemCopy)
            if err == nil {
                mu.Lock()
                successCount++
                mu.Unlock()
            }
            return err
        })
    }

    pool.Wait()
    c.JSON(200, gin.H{"imported": successCount, "total": len(items)})
}
```

### 3. **Semaphore** - Best for Rate Limiting

**Use when**: You need to limit concurrent database connections (e.g., expensive queries)

```go
// Example: Admin dashboard with multiple heavy queries
func (h *OrderHandler) GetDashboard(c *gin.Context) {
    // Allow max 3 concurrent database queries
    sem := utils.NewSemaphore(3)
    executor := utils.NewParallelExecutor()

    tasks := []struct{
        key string
        fn func() (interface{}, error)
    }{
        {
            key: "total_revenue",
            fn: func() (interface{}, error) {
                sem.Acquire()
                defer sem.Release()
                return h.orderService.GetTotalRevenue(c.Request.Context())
            },
        },
        {
            key: "order_count",
            fn: func() (interface{}, error) {
                sem.Acquire()
                defer sem.Release()
                return h.orderService.GetOrderCount(c.Request.Context())
            },
        },
        {
            key: "top_products",
            fn: func() (interface{}, error) {
                sem.Acquire()
                defer sem.Release()
                return h.productService.GetTopSelling(c.Request.Context(), 5)
            },
        },
    }

    for _, task := range tasks {
        t := task
        executor.Execute(c.Request.Context(), t.key, t.fn)
    }

    results, _ := executor.Wait()
    c.JSON(200, results)
}
```

### 4. **RetryWithBackoff** - Best for Unreliable Operations

**Use when**: Calling external APIs, payment gateways, or flaky services

```go
// Example: Payment processing
func (h *PaymentHandler) ProcessPayment(c *gin.Context) {
    orderID := c.Param("orderId")
    ctx := c.Request.Context()

    cfg := utils.RetryConfig{
        MaxAttempts: 3,
        InitialWait: 100 * time.Millisecond,
        MaxWait: 5 * time.Second,
        Multiplier: 2.0, // exponential backoff
    }

    err := utils.RetryWithBackoff(ctx, cfg, func() error {
        return h.paymentService.VerifyPayment(ctx, orderID)
    })

    if err != nil {
        c.JSON(500, gin.H{"error": "Payment verification failed after retries"})
        return
    }

    c.JSON(200, gin.H{"status": "verified"})
}
```

---

## 🏗️ Architecture Patterns

### Pattern 1: Concurrent Order Processing

```
Order Received
    ↓
    ├→ [Worker 1] Validate Payment (concurrent)
    ├→ [Worker 2] Update Inventory (concurrent)
    ├→ [Worker 3] Send Confirmation Email (concurrent)
    ↓
All Tasks Complete → Update Order Status
```

**Implementation**:

```go
func (s *OrderService) ProcessOrder(ctx context.Context, orderID string) error {
    processor := utils.NewBatchProcessor(ctx, 3) // 3 concurrent workers

    processor.Add(func(ctx context.Context) error {
        return s.validatePayment(ctx, orderID)
    })

    processor.Add(func(ctx context.Context) error {
        return s.updateInventory(ctx, orderID)
    })

    processor.Add(func(ctx context.Context) error {
        return s.sendEmail(ctx, orderID)
    })

    if errs := processor.Wait(); len(errs) > 0 {
        return fmt.Errorf("order processing failed: %v", errs)
    }

    return nil
}
```

### Pattern 2: Circuit Breaker for External Services

```
Request → Circuit Closed → Call External Service
                             ↓
                        Success? → Closed
                             ↓
                          Fail? → Count failures
                             ↓
                        Max failures? → Open (reject all)
                             ↓
                        Timeout? → HalfOpen (test)
```

**Implementation**:

```go
var paymentGB = utils.NewCircuitBreaker(
    5,                  // open after 5 consecutive failures
    30*time.Second,     // wait 30s before half-open
)

func (s *PaymentService) ProcessPayment(ctx context.Context, order *domain.Order) error {
    return paymentGB.Call(func() error {
        // Call unreliable external payment service
        return s.externalPaymentGateway.Process(order)
    })
}
```

---

## ⚙️ Enterprise Patterns

### Concurrent Service with Context Deadline

```go
// Set deadline for entire operation
ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
defer cancel()

executor := utils.NewParallelExecutor()

// All these must complete within 10 seconds
executor.Execute(ctx, "payment", func() (interface{}, error) {
    return paymentService.Verify(ctx, paymentID)
})

executor.Execute(ctx, "inventory", func() (interface{}, error) {
    return inventoryService.Reserve(ctx, items)
})

results, errors := executor.Wait()

// If any error or context timeout, handle it
if len(errors) > 0 {
    // Rollback operations
}
```

### Fan-Out/Fan-In for Notification System

```go
// Send email to multiple recipients in parallel
recipients := []string{"user@example.com", "admin@example.com"}
in, outputs := utils.FanOut(ctx, 2, func(ctx context.Context, v interface{}) interface{} {
    recipient := v.(string)
    err := emailService.Send(ctx, recipient, subject, body)
    return gin.H{"recipient": recipient, "error": err}
})

// Send recipients
go func() {
    for _, r := range recipients {
        in <- r
    }
    close(in)
}()

// Collect results
results := utils.FanIn(ctx, outputs...)
for result := range results {
    log.Printf("Sent to %v", result)
}
```

---

## 🚀 Performance Impact

| Pattern              | Best For               | Performance      | Complexity |
| -------------------- | ---------------------- | ---------------- | ---------- |
| **ParallelExecutor** | 2-5 concurrent queries | 50% faster       | ⭐         |
| **WorkerPool**       | 10+ bulk items         | 70% faster       | ⭐⭐       |
| **Semaphore**        | Rate limiting          | Context aware    | ⭐⭐       |
| **RetryWithBackoff** | Flaky APIs             | Fault tolerant   | ⭐⭐       |
| **CircuitBreaker**   | Cascading failures     | Prevents outages | ⭐⭐⭐     |

---

## ✅ Checklist for Your Project

- [ ] Replace sequential product + reviews + related queries with ParallelExecutor
- [ ] Add WorkerPool to bulk import/update operations
- [ ] Implement Semaphore for admin dashboard queries
- [ ] Add RetryWithBackoff to external payment API calls
- [ ] Implement CircuitBreaker around payment provider
- [ ] Add timeouts with context.WithTimeout
- [ ] Use sync.WaitGroup for coordinating goroutines
- [ ] Add metrics/logging for concurrent operations

---

## 🔍 Debugging Concurrent Code

```go
// Add timeouts to catch deadlocks
ctx, cancel := context.WithTimeout(ctx, 30*time.Second)
defer cancel()

// Use pprof to profile goroutines
import _ "net/http/pprof"
go func() {
    log.Println(http.ListenAndServe("localhost:6060", nil))
}()
// Visit http://localhost:6060/debug/pprof/goroutine

// Add structured logging
log.Printf("Starting %d workers...", numWorkers)
log.Printf("Task completed: %s in %dms", taskName, elapsed)
```

---

## Key Takeaways

1. **Use ParallelExecutor for 2-5 independent fetches** (product detail pages)
2. **Use WorkerPool for bulk operations** (>10 items)
3. **Use Semaphore to limit concurrency** (expensive DB queries)
4. **Always handle context errors** (timeouts, cancellation)
5. **Use Circuit Breaker for external services** (payment, email)
6. **Measure improvements with benchmarks** (go test -bench)
