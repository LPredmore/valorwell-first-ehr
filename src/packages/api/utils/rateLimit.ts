
interface RateLimitBucket {
  tokens: number;
  lastRefill: number;
}

interface RateLimitOptions {
  maxTokens: number;
  refillRate: number; // tokens per second
  refillInterval: number; // milliseconds
}

class RateLimiter {
  private buckets: Map<string, RateLimitBucket> = new Map();
  private options: RateLimitOptions;
  
  constructor(options: Partial<RateLimitOptions> = {}) {
    // Default settings: 30 requests per minute
    this.options = {
      maxTokens: options.maxTokens || 30,
      refillRate: options.refillRate || 0.5, // 0.5 tokens per second = 30 per minute
      refillInterval: options.refillInterval || 1000 // Check every second
    };
    
    // Start the token refill timer
    setInterval(() => this.refillAllBuckets(), this.options.refillInterval);
  }
  
  // Try to consume a token
  async canMakeRequest(key: string = 'default', cost: number = 1): Promise<boolean> {
    // Get or create bucket
    if (!this.buckets.has(key)) {
      this.buckets.set(key, {
        tokens: this.options.maxTokens,
        lastRefill: Date.now()
      });
    }
    
    const bucket = this.buckets.get(key)!;
    
    // Refill tokens based on time elapsed
    this.refillBucket(bucket);
    
    // Check if we have enough tokens
    if (bucket.tokens >= cost) {
      bucket.tokens -= cost;
      return true;
    }
    
    return false;
  }
  
  // Get tokens available
  getTokensRemaining(key: string = 'default'): number {
    if (!this.buckets.has(key)) {
      return this.options.maxTokens;
    }
    
    const bucket = this.buckets.get(key)!;
    this.refillBucket(bucket);
    return bucket.tokens;
  }
  
  // Wait until a request can be made
  async waitForToken(key: string = 'default', cost: number = 1): Promise<void> {
    if (await this.canMakeRequest(key, cost)) {
      return;
    }
    
    return new Promise(resolve => {
      const checkAndResolve = async () => {
        if (await this.canMakeRequest(key, cost)) {
          resolve();
          return true;
        }
        return false;
      };
      
      const attemptRequest = async () => {
        if (!(await checkAndResolve())) {
          // Calculate time until next token is available
          const bucket = this.buckets.get(key)!;
          const tokensNeeded = cost - bucket.tokens;
          const timePerToken = 1000 / this.options.refillRate;
          const waitTime = Math.max(10, timePerToken * tokensNeeded);
          
          setTimeout(attemptRequest, waitTime);
        }
      };
      
      attemptRequest();
    });
  }
  
  // Rate-limited fetch wrapper
  async limitedFetch(url: string, options?: RequestInit, key: string = 'default'): Promise<Response> {
    await this.waitForToken(key);
    return fetch(url, options);
  }
  
  // Refill a single bucket based on time elapsed
  private refillBucket(bucket: RateLimitBucket): void {
    const now = Date.now();
    const elapsedSeconds = (now - bucket.lastRefill) / 1000;
    
    if (elapsedSeconds > 0) {
      const tokensToAdd = elapsedSeconds * this.options.refillRate;
      bucket.tokens = Math.min(this.options.maxTokens, bucket.tokens + tokensToAdd);
      bucket.lastRefill = now;
    }
  }
  
  // Refill all buckets
  private refillAllBuckets(): void {
    const now = Date.now();
    this.buckets.forEach(bucket => {
      const elapsedSeconds = (now - bucket.lastRefill) / 1000;
      const tokensToAdd = elapsedSeconds * this.options.refillRate;
      bucket.tokens = Math.min(this.options.maxTokens, bucket.tokens + tokensToAdd);
      bucket.lastRefill = now;
    });
  }
  
  // Reset a bucket
  resetBucket(key: string = 'default'): void {
    if (this.buckets.has(key)) {
      this.buckets.set(key, {
        tokens: this.options.maxTokens,
        lastRefill: Date.now()
      });
    }
  }
  
  // Reset all buckets
  resetAllBuckets(): void {
    this.buckets.clear();
  }
}

// Export singleton instance with default settings
export const rateLimiter = new RateLimiter();

export default rateLimiter;
