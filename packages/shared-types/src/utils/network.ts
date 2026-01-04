/**
 * Network Resilience Utilities
 * Handles connection loss, reconnection, and data sync
 */

export interface QueuedUpdate<T = unknown> {
  id: string;
  type: string;
  data: T;
  timestamp: number;
  retryCount: number;
}

export class OfflineQueue<T = unknown> {
  private queue: QueuedUpdate<T>[] = [];
  private maxRetries = 5;
  private maxQueueSize = 100;

  add(type: string, data: T): string {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    
    const update: QueuedUpdate<T> = {
      id,
      type,
      data,
      timestamp: Date.now(),
      retryCount: 0,
    };

    // Limit queue size (remove oldest)
    if (this.queue.length >= this.maxQueueSize) {
      this.queue.shift();
    }

    this.queue.push(update);
    return id;
  }

  getAll(): QueuedUpdate<T>[] {
    return [...this.queue];
  }

  remove(id: string): void {
    this.queue = this.queue.filter(u => u.id !== id);
  }

  incrementRetry(id: string): boolean {
    const update = this.queue.find(u => u.id === id);
    if (!update) return false;
    
    update.retryCount++;
    
    if (update.retryCount >= this.maxRetries) {
      this.remove(id);
      return false; // Exceeded max retries
    }
    
    return true;
  }

  clear(): void {
    this.queue = [];
  }

  size(): number {
    return this.queue.length;
  }
}

/**
 * Exponential backoff calculator
 */
export function calculateBackoff(
  attempt: number,
  baseDelay = 1000,
  maxDelay = 30000
): number {
  const delay = Math.min(baseDelay * Math.pow(2, attempt), maxDelay);
  // Add jitter (±10%)
  const jitter = delay * 0.1 * (Math.random() - 0.5) * 2;
  return Math.floor(delay + jitter);
}

/**
 * Connection state tracker
 */
export type ConnectionState = 'connected' | 'connecting' | 'disconnected' | 'reconnecting';

export interface ConnectionStatus {
  state: ConnectionState;
  lastConnected: number | null;
  reconnectAttempts: number;
  queuedUpdates: number;
}

export class ConnectionTracker {
  private state: ConnectionState = 'disconnected';
  private lastConnected: number | null = null;
  private reconnectAttempts = 0;
  private listeners: Set<(status: ConnectionStatus) => void> = new Set();

  connect(): void {
    this.state = 'connected';
    this.lastConnected = Date.now();
    this.reconnectAttempts = 0;
    this.notify();
  }

  disconnect(): void {
    this.state = 'disconnected';
    this.notify();
  }

  reconnecting(): void {
    this.state = 'reconnecting';
    this.reconnectAttempts++;
    this.notify();
  }

  getStatus(queuedUpdates = 0): ConnectionStatus {
    return {
      state: this.state,
      lastConnected: this.lastConnected,
      reconnectAttempts: this.reconnectAttempts,
      queuedUpdates,
    };
  }

  subscribe(listener: (status: ConnectionStatus) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify(): void {
    const status = this.getStatus();
    this.listeners.forEach(listener => listener(status));
  }
}

/**
 * Network quality detector
 */
export type NetworkQuality = 'good' | 'fair' | 'poor' | 'offline';

export function detectNetworkQuality(rtt?: number): NetworkQuality {
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    return 'offline';
  }
  
  if (rtt === undefined) return 'good';
  
  if (rtt < 100) return 'good';
  if (rtt < 300) return 'fair';
  return 'poor';
}

/**
 * Retry wrapper with exponential backoff
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: {
    maxRetries?: number;
    baseDelay?: number;
    onRetry?: (attempt: number, error: Error) => void;
  } = {}
): Promise<T> {
  const { maxRetries = 3, baseDelay = 1000, onRetry } = options;
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      
      if (attempt < maxRetries) {
        const delay = calculateBackoff(attempt, baseDelay);
        onRetry?.(attempt + 1, lastError);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError;
}

