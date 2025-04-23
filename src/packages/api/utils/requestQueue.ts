
interface QueuedRequest<T> {
  id: string;
  priority: number;
  execute: () => Promise<T>;
  resolve: (value: T | PromiseLike<T>) => void;
  reject: (reason?: any) => void;
  retryCount: number;
  maxRetries: number;
  retryDelay: number;
  timestamp: number;
}

class RequestQueue {
  private queue: QueuedRequest<any>[] = [];
  private isProcessing: boolean = false;
  private maxConcurrent: number;
  private activeRequests: number = 0;
  private timeout: number | null = null;
  
  constructor(maxConcurrent: number = 4) {
    this.maxConcurrent = maxConcurrent;
  }
  
  // Add a request to the queue
  enqueue<T>(
    execute: () => Promise<T>, 
    options: {
      id?: string;
      priority?: number;
      maxRetries?: number;
      retryDelay?: number;
    } = {}
  ): Promise<T> {
    const {
      id = Math.random().toString(36).substring(2, 9),
      priority = 0,
      maxRetries = 3,
      retryDelay = 1000
    } = options;
    
    return new Promise<T>((resolve, reject) => {
      const request: QueuedRequest<T> = {
        id,
        priority,
        execute,
        resolve,
        reject,
        retryCount: 0,
        maxRetries,
        retryDelay,
        timestamp: Date.now()
      };
      
      // Add to queue and sort by priority (higher number = higher priority)
      this.queue.push(request);
      this.queue.sort((a, b) => b.priority - a.priority);
      
      // Start processing if not already in progress
      if (!this.isProcessing) {
        this.processQueue();
      }
    });
  }
  
  // Cancel a specific request by ID
  cancelRequest(id: string): boolean {
    const index = this.queue.findIndex(request => request.id === id);
    if (index !== -1) {
      const request = this.queue[index];
      this.queue.splice(index, 1);
      request.reject(new Error('Request cancelled'));
      return true;
    }
    return false;
  }
  
  // Cancel all pending requests
  clearQueue(): void {
    this.queue.forEach(request => {
      request.reject(new Error('Request queue cleared'));
    });
    this.queue = [];
  }
  
  // Process the queue
  private async processQueue(): Promise<void> {
    if (this.queue.length === 0 || this.isProcessing) {
      return;
    }
    
    this.isProcessing = true;
    
    try {
      while (this.queue.length > 0 && this.activeRequests < this.maxConcurrent) {
        const request = this.queue.shift()!;
        this.activeRequests++;
        
        // Handle the request without waiting for it to complete
        this.handleRequest(request).finally(() => {
          this.activeRequests--;
          // Continue processing if there are more requests
          if (this.queue.length > 0) {
            this.scheduleNextProcess();
          } else if (this.activeRequests === 0) {
            this.isProcessing = false;
          }
        });
      }
    } finally {
      if (this.activeRequests === 0) {
        this.isProcessing = false;
      }
    }
  }
  
  // Schedule the next process with a small delay to avoid event loop blocking
  private scheduleNextProcess(): void {
    if (this.timeout === null) {
      this.timeout = window.setTimeout(() => {
        this.timeout = null;
        this.processQueue();
      }, 10);
    }
  }
  
  // Execute a request with retry logic
  private async handleRequest<T>(request: QueuedRequest<T>): Promise<void> {
    try {
      const result = await request.execute();
      request.resolve(result);
    } catch (error) {
      console.error(`Request ${request.id} failed:`, error);
      
      // Check if we should retry
      if (request.retryCount < request.maxRetries) {
        request.retryCount++;
        const delayTime = request.retryDelay * Math.pow(2, request.retryCount - 1); // Exponential backoff
        
        console.log(`Retrying request ${request.id} (${request.retryCount}/${request.maxRetries}) after ${delayTime}ms`);
        
        // Add back to queue with delay
        setTimeout(() => {
          // Re-add with same priority but at the end of same-priority items
          this.queue.push(request);
          this.queue.sort((a, b) => b.priority - a.priority || a.timestamp - b.timestamp);
          
          if (!this.isProcessing) {
            this.processQueue();
          }
        }, delayTime);
      } else {
        // Max retries exceeded
        request.reject(error);
      }
    }
  }
  
  // Get current queue status
  getStatus() {
    return {
      queueLength: this.queue.length,
      activeRequests: this.activeRequests,
      isProcessing: this.isProcessing
    };
  }
}

// Export singleton instance
export const requestQueue = new RequestQueue();

// Helper function to easily enqueue a request
export function enqueueRequest<T>(
  fn: () => Promise<T>, 
  options?: {
    id?: string;
    priority?: number;
    maxRetries?: number;
    retryDelay?: number;
  }
): Promise<T> {
  return requestQueue.enqueue(fn, options);
}

export default requestQueue;
