/**
 * Token Bucket Rate Limiter
 * Each IP gets a bucket with `capacity` tokens.
 * Tokens refill at `refillRate` per second.
 * Each request consumes 1 token.
 */

const buckets = new Map();

const TOKEN_BUCKET_CONFIG = {
  capacity: 60,       // max 60 tokens
  refillRate: 1,      // 1 token per second = 60/min sustained
};

const getOrCreateBucket = (key) => {
  if (!buckets.has(key)) {
    buckets.set(key, {
      tokens: TOKEN_BUCKET_CONFIG.capacity,
      lastRefill: Date.now(),
    });
  }
  return buckets.get(key);
};

const refillBucket = (bucket) => {
  const now = Date.now();
  const elapsed = (now - bucket.lastRefill) / 1000; // seconds
  const tokensToAdd = elapsed * TOKEN_BUCKET_CONFIG.refillRate;
  bucket.tokens = Math.min(TOKEN_BUCKET_CONFIG.capacity, bucket.tokens + tokensToAdd);
  bucket.lastRefill = now;
};

const tokenBucketMiddleware = (req, res, next) => {
  const key = req.ip || req.connection.remoteAddress;
  const bucket = getOrCreateBucket(key);

  refillBucket(bucket);

  if (bucket.tokens >= 1) {
    bucket.tokens -= 1;
    // Add rate limit headers
    res.setHeader('X-RateLimit-Limit', TOKEN_BUCKET_CONFIG.capacity);
    res.setHeader('X-RateLimit-Remaining', Math.floor(bucket.tokens));
    next();
  } else {
    const retryAfter = Math.ceil((1 - bucket.tokens) / TOKEN_BUCKET_CONFIG.refillRate);
    res.setHeader('Retry-After', retryAfter);
    res.status(429).json({
      success: false,
      message: 'Too many requests. Please slow down.',
      retryAfter,
    });
  }
};

// Cleanup stale buckets every 10 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, bucket] of buckets.entries()) {
    if (now - bucket.lastRefill > 10 * 60 * 1000) {
      buckets.delete(key);
    }
  }
}, 10 * 60 * 1000);

module.exports = tokenBucketMiddleware;
