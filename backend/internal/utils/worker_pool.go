package utils

import (
	"context"
	"sync"
)

// Task defines a unit of work to be executed by workers
type Task func(context.Context) error

// WorkerPool manages concurrent execution of tasks with a limited number of workers
// This prevents goroutine explosion and controls resource usage
type WorkerPool struct {
	numWorkers int
	tasksChan  chan Task
	wg         sync.WaitGroup
	ctx        context.Context
	cancel     context.CancelFunc
}

// NewWorkerPool creates a new worker pool with specified number of workers
// Example: pool := NewWorkerPool(context.Background(), 10) // 10 concurrent workers
func NewWorkerPool(ctx context.Context, numWorkers int) *WorkerPool {
	workerCtx, cancel := context.WithCancel(ctx)
	pool := &WorkerPool{
		numWorkers: numWorkers,
		tasksChan:  make(chan Task, numWorkers*2), // buffer tasks
		ctx:        workerCtx,
		cancel:     cancel,
	}

	// Start worker goroutines
	for i := 0; i < numWorkers; i++ {
		pool.wg.Add(1)
		go pool.worker()
	}

	return pool
}

// worker processes tasks from the channel
func (p *WorkerPool) worker() {
	defer p.wg.Done()
	for {
		select {
		case task, ok := <-p.tasksChan:
			if !ok {
				return // channel closed, exit worker
			}
			if task != nil {
				_ = task(p.ctx) // execute task, ignore error here (caller handles via results)
			}
		case <-p.ctx.Done():
			return // context cancelled, exit worker
		}
	}
}

// Submit adds a task to the worker pool queue
// Returns error if pool is closed
func (p *WorkerPool) Submit(task Task) {
	select {
	case p.tasksChan <- task:
	case <-p.ctx.Done():
		// pool is closed
	}
}

// Wait blocks until all submitted tasks are completed
// Should be called after all Submit() calls to ensure completion
func (p *WorkerPool) Wait() {
	close(p.tasksChan)
	p.wg.Wait()
}

// Close cancels all work and waits for workers to finish
func (p *WorkerPool) Close() {
	p.cancel()
	p.Wait()
}

// ==================== BATCH PROCESSING ====================

// BatchProcessor processes items concurrently and collects results
type BatchProcessor struct {
	pool *WorkerPool
	mu   sync.Mutex
	errs []error
}

// NewBatchProcessor creates a processor for concurrent batch operations
// Example: processor := NewBatchProcessor(ctx, 5) // 5 parallel workers
func NewBatchProcessor(ctx context.Context, numWorkers int) *BatchProcessor {
	return &BatchProcessor{
		pool: NewWorkerPool(ctx, numWorkers),
		errs: make([]error, 0),
	}
}

// ProcessFunc is a function that processes a single item
type ProcessFunc func(context.Context) error

// Add queues a processing function
func (bp *BatchProcessor) Add(fn ProcessFunc) {
	bp.pool.Submit(func(ctx context.Context) error {
		err := fn(ctx)
		if err != nil {
			bp.mu.Lock()
			bp.errs = append(bp.errs, err)
			bp.mu.Unlock()
		}
		return err
	})
}

// Wait completes all processing and returns any errors
func (bp *BatchProcessor) Wait() []error {
	bp.pool.Wait()
	bp.mu.Lock()
	defer bp.mu.Unlock()
	return bp.errs
}

// ==================== PARALLEL EXECUTION ====================

// ParallelResults holds results from parallel operations
type ParallelResults map[string]interface{}

// ParallelExecutor runs multiple tasks in parallel and collects results
type ParallelExecutor struct {
	results map[string]interface{}
	errors  map[string]error
	mu      sync.RWMutex
	wg      sync.WaitGroup
}

// NewParallelExecutor creates a new parallel executor
func NewParallelExecutor() *ParallelExecutor {
	return &ParallelExecutor{
		results: make(map[string]interface{}),
		errors:  make(map[string]error),
	}
}

// Execute runs a named task that returns a result and error
//
// Example:
//
//	executor := NewParallelExecutor()
//	executor.Execute(ctx, "product", func() (interface{}, error) {
//		return productRepo.GetByID(ctx, id)
//	})
//	executor.Execute(ctx, "reviews", func() (interface{}, error) {
//		return reviewRepo.GetByProduct(ctx, id)
//	})
//	results, errors := executor.Wait()
func (pe *ParallelExecutor) Execute(ctx context.Context, key string, fn func() (interface{}, error)) {
	pe.wg.Add(1)
	go func() {
		defer pe.wg.Done()
		result, err := fn()
		pe.mu.Lock()
		defer pe.mu.Unlock()
		if err != nil {
			pe.errors[key] = err
		} else {
			pe.results[key] = result
		}
	}()
}

// Wait blocks until all tasks complete and returns results and errors
func (pe *ParallelExecutor) Wait() (ParallelResults, map[string]error) {
	pe.wg.Wait()
	pe.mu.RLock()
	defer pe.mu.RUnlock()
	return pe.results, pe.errors
}

// Get safely retrieves a result
func (pe *ParallelExecutor) Get(key string) (interface{}, bool) {
	pe.mu.RLock()
	defer pe.mu.RUnlock()
	val, exists := pe.results[key]
	return val, exists
}

// Error safely retrieves an error
func (pe *ParallelExecutor) Error(key string) (error, bool) {
	pe.mu.RLock()
	defer pe.mu.RUnlock()
	err, exists := pe.errors[key]
	return err, exists
}
