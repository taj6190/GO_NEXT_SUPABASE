package utils

import (
	"context"
	"sync"
	"time"

	"github.com/gonext-ecommerce/backend/internal/domain"
)

// ==================== SEMAPHORE FOR RATE LIMITING ====================

// Semaphore limits concurrent access to a resource
type Semaphore struct {
	semaChan chan struct{}
}

// NewSemaphore creates a semaphore with max concurrent access
// Example: sem := NewSemaphore(3) // max 3 concurrent operations
func NewSemaphore(maxConcurrent int) *Semaphore {
	return &Semaphore{
		semaChan: make(chan struct{}, maxConcurrent),
	}
}

// Acquire waits for and takes a semaphore slot
func (s *Semaphore) Acquire() {
	s.semaChan <- struct{}{}
}

// AcquireCtx acquires a semaphore or returns error if context times out
func (s *Semaphore) AcquireCtx(ctx context.Context) error {
	select {
	case s.semaChan <- struct{}{}:
		return nil
	case <-ctx.Done():
		return ctx.Err()
	}
}

// Release releases a semaphore slot
func (s *Semaphore) Release() {
	<-s.semaChan
}

// ==================== PIPELINE FOR SEQUENTIAL PROCESSING ====================

// PipelineStage represents a processing stage in a pipeline
type PipelineStage func(ctx context.Context, in <-chan interface{}) <-chan interface{}

// Pipeline chains multiple stages of concurrent processing
// Example: data flow from producer -> transform stage 1 -> transform stage 2 -> consumer
func Pipeline(ctx context.Context, input <-chan interface{}, stages ...PipelineStage) <-chan interface{} {
	result := input
	for _, stage := range stages {
		result = stage(ctx, result)
	}
	return result
}

// ==================== BOUNDED CHANNEL FOR BACKPRESSURE ====================

// ChanWithTimeout sends a value on channel with timeout
func ChanWithTimeout(ch chan<- interface{}, value interface{}, timeout time.Duration) error {
	select {
	case ch <- value:
		return nil
	case <-time.After(timeout):
		return context.DeadlineExceeded
	}
}

// ==================== FAN-OUT/FAN-IN ====================

// FanOut distributes input to multiple workers
// Returns a function to send values and a slice of output channels
func FanOut(ctx context.Context, numWorkers int, fn func(context.Context, interface{}) interface{}) (chan<- interface{}, []<-chan interface{}) {
	in := make(chan interface{})
	outputs := make([]<-chan interface{}, numWorkers)

	for i := 0; i < numWorkers; i++ {
		out := make(chan interface{})
		outputs[i] = out

		go func(output chan<- interface{}) {
			defer close(output)
			for {
				select {
				case val, ok := <-in:
					if !ok {
						return
					}
					result := fn(ctx, val)
					select {
					case output <- result:
					case <-ctx.Done():
						return
					}
				case <-ctx.Done():
					return
				}
			}
		}(out)
	}

	return in, outputs
}

// FanIn merges multiple channels into one
func FanIn(ctx context.Context, channels ...<-chan interface{}) <-chan interface{} {
	var wg sync.WaitGroup
	out := make(chan interface{})

	output := func(c <-chan interface{}) {
		defer wg.Done()
		for {
			select {
			case val, ok := <-c:
				if !ok {
					return
				}
				select {
				case out <- val:
				case <-ctx.Done():
					return
				}
			case <-ctx.Done():
				return
			}
		}
	}

	wg.Add(len(channels))
	for _, c := range channels {
		go output(c)
	}

	go func() {
		wg.Wait()
		close(out)
	}()

	return out
}

// ==================== CIRCUIT BREAKER ====================

// CircuitBreakerState represents circuit breaker state
type CircuitBreakerState int

const (
	CBClosed CircuitBreakerState = iota
	CBOpen
	CBHalfOpen
)

// CircuitBreaker prevents cascading failures
type CircuitBreaker struct {
	mu              sync.RWMutex
	state           CircuitBreakerState
	failures        int
	threshold       int
	timeout         time.Duration
	lastFailureTime time.Time
}

// NewCircuitBreaker creates a new circuit breaker
// threshold: number of failures before opening
// timeout: duration to wait before half-open
func NewCircuitBreaker(threshold int, timeout time.Duration) *CircuitBreaker {
	return &CircuitBreaker{
		state:     CBClosed,
		threshold: threshold,
		timeout:   timeout,
	}
}

// Call executes fn if circuit is closed, returns error if open
func (cb *CircuitBreaker) Call(fn func() error) error {
	cb.mu.Lock()
	defer cb.mu.Unlock()

	switch cb.state {
	case CBOpen:
		if time.Since(cb.lastFailureTime) > cb.timeout {
			cb.state = CBHalfOpen
			cb.failures = 0
		} else {
			return domain.ErrCircuitBreakerOpen
		}
	}

	err := fn()
	if err != nil {
		cb.failures++
		cb.lastFailureTime = time.Now()
		if cb.failures >= cb.threshold {
			cb.state = CBOpen
		}
		return err
	}

	if cb.state == CBHalfOpen {
		cb.state = CBClosed
		cb.failures = 0
	}

	return nil
}

// ==================== RETRY WITH BACKOFF ====================

// RetryConfig holds retry configuration
type RetryConfig struct {
	MaxAttempts int
	InitialWait time.Duration
	MaxWait     time.Duration
	Multiplier  float64
}

// RetryWithBackoff retries fn with exponential backoff
// Example:
//
//	cfg := RetryConfig{
//		MaxAttempts: 3,
//		InitialWait: 100 * time.Millisecond,
//		MaxWait: 5 * time.Second,
//		Multiplier: 2.0,
//	}
//	err := RetryWithBackoff(ctx, cfg, func() error {
//		return someFlakeyOperation()
//	})
func RetryWithBackoff(ctx context.Context, cfg RetryConfig, fn func() error) error {
	var lastErr error
	wait := cfg.InitialWait

	for attempt := 0; attempt < cfg.MaxAttempts; attempt++ {
		lastErr = fn()
		if lastErr == nil {
			return nil
		}

		if attempt < cfg.MaxAttempts-1 {
			select {
			case <-time.After(wait):
				// Calculate next wait duration with multiplier
				nextWait := time.Duration(float64(wait) * cfg.Multiplier)
				if nextWait > cfg.MaxWait {
					nextWait = cfg.MaxWait
				}
				wait = nextWait
			case <-ctx.Done():
				return ctx.Err()
			}
		}
	}

	return lastErr
}

// ==================== TIMEOUT WRAPPER ====================

// DoWithTimeout executes fn with timeout
// Example: err := DoWithTimeout(ctx, 5*time.Second, func() error { ... })
func DoWithTimeout(ctx context.Context, timeout time.Duration, fn func() error) error {
	ctx, cancel := context.WithTimeout(ctx, timeout)
	defer cancel()

	done := make(chan error, 1)
	go func() {
		done <- fn()
	}()

	select {
	case err := <-done:
		return err
	case <-ctx.Done():
		return ctx.Err()
	}
}
