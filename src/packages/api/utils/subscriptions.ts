
import { supabase } from '../client';
import { requestQueue } from './requestQueue';

interface SubscriptionOptions {
  table: string;
  schema?: string;
  event?: 'INSERT' | 'UPDATE' | 'DELETE' | '*';
  filter?: string;
  retry?: boolean;
  maxRetries?: number;
  retryDelay?: number;
}

interface SubscriptionCallbacks<T = any> {
  onData?: (payload: T) => void;
  onError?: (error: any) => void;
  onChannelError?: (error: any) => void;
  onReconnect?: () => void;
}

class SubscriptionManager {
  private channels: Map<string, { 
    channel: any;
    options: SubscriptionOptions;
    callbacks: SubscriptionCallbacks;
    retries: number;
  }> = new Map();
  
  private isReconnecting = false;
  private reconnectTimer: number | null = null;
  private connectionStatus: 'connected' | 'disconnected' | 'reconnecting' = 'disconnected';
  
  constructor() {
    // Listen for online/offline events
    window.addEventListener('online', () => this.handleOnline());
    window.addEventListener('offline', () => this.handleOffline());
  }
  
  // Subscribe to a table with options
  subscribe<T = any>(
    channelName: string,
    options: SubscriptionOptions,
    callbacks: SubscriptionCallbacks<T>
  ): () => void {
    // Generate a unique channel name if not provided
    const uniqueChannelName = channelName || `subscription_${Math.random().toString(36).substring(2, 9)}`;
    
    // Unsubscribe if channel already exists
    if (this.channels.has(uniqueChannelName)) {
      this.unsubscribe(uniqueChannelName);
    }
    
    // Create and configure the channel
    const channel = supabase.channel(`realtime:${uniqueChannelName}`);
    
    const { schema = 'public', event = '*', filter } = options;
    
    const subscription = channel
      .on('postgres_changes', { 
        event, 
        schema, 
        table: options.table,
        filter
      }, (payload: T) => {
        try {
          if (callbacks.onData) {
            callbacks.onData(payload);
          }
        } catch (error) {
          console.error('Error in subscription data handler:', error);
          if (callbacks.onError) {
            callbacks.onError(error);
          }
        }
      })
      .on('error', (error: any) => {
        console.error('Subscription channel error:', error);
        if (callbacks.onChannelError) {
          callbacks.onChannelError(error);
        }
        
        // Handle reconnection if configured
        if (options.retry !== false) {
          this.handleReconnect(uniqueChannelName);
        }
      });
    
    // Subscribe to the channel
    requestQueue.enqueue(() => subscription.subscribe(), {
      id: `subscribe_${uniqueChannelName}`,
      priority: 10, // Higher priority for subscriptions
      maxRetries: 5
    })
    .then(() => {
      console.log(`Subscribed to ${options.table} on channel ${uniqueChannelName}`);
      this.connectionStatus = 'connected';
    })
    .catch(error => {
      console.error(`Failed to subscribe to ${options.table}:`, error);
      if (callbacks.onError) {
        callbacks.onError(error);
      }
      
      // Retry if configured
      if (options.retry !== false) {
        this.handleReconnect(uniqueChannelName);
      }
    });
    
    // Save subscription details
    this.channels.set(uniqueChannelName, {
      channel,
      options,
      callbacks,
      retries: 0
    });
    
    // Return unsubscribe function
    return () => this.unsubscribe(uniqueChannelName);
  }
  
  // Unsubscribe from a channel
  unsubscribe(channelName: string): void {
    if (this.channels.has(channelName)) {
      const { channel } = this.channels.get(channelName)!;
      
      supabase.removeChannel(channel)
        .then(() => console.log(`Unsubscribed from channel ${channelName}`))
        .catch(error => console.error(`Error unsubscribing from channel ${channelName}:`, error));
      
      this.channels.delete(channelName);
    }
  }
  
  // Unsubscribe from all channels
  unsubscribeAll(): void {
    this.channels.forEach((_, channelName) => {
      this.unsubscribe(channelName);
    });
  }
  
  // Handle reconnection for a specific channel
  private handleReconnect(channelName: string): void {
    if (!this.channels.has(channelName)) return;
    
    const subscription = this.channels.get(channelName)!;
    const { maxRetries = 5, retryDelay = 2000 } = subscription.options;
    
    // Increment retry count
    subscription.retries += 1;
    
    // Check if max retries reached
    if (subscription.retries > maxRetries) {
      console.error(`Max reconnection attempts reached for ${channelName}. Giving up.`);
      return;
    }
    
    // Calculate delay with exponential backoff
    const delay = retryDelay * Math.pow(2, subscription.retries - 1);
    console.log(`Attempting to reconnect ${channelName} in ${delay}ms (attempt ${subscription.retries}/${maxRetries})`);
    
    // Remove old channel and recreate after delay
    const { options, callbacks } = subscription;
    this.connectionStatus = 'reconnecting';
    
    setTimeout(() => {
      // Only try to reconnect if we're still registered
      if (this.channels.has(channelName)) {
        this.unsubscribe(channelName);
        this.subscribe(channelName, options, callbacks);
        
        if (callbacks.onReconnect) {
          callbacks.onReconnect();
        }
      }
    }, delay);
  }
  
  // Handle connection coming back online
  private handleOnline(): void {
    console.log('Network connection restored. Reconnecting subscriptions.');
    
    // Clear any pending reconnect timer
    if (this.reconnectTimer !== null) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    
    // Reconnect all channels
    this.reconnectAllChannels();
  }
  
  // Handle connection going offline
  private handleOffline(): void {
    console.log('Network connection lost. Subscriptions will reconnect when online.');
    this.connectionStatus = 'disconnected';
  }
  
  // Reconnect all channels
  private reconnectAllChannels(): void {
    if (this.isReconnecting) return;
    
    this.isReconnecting = true;
    
    // Store current channels
    const channelsToReconnect = new Map(this.channels);
    
    // Unsubscribe all
    this.unsubscribeAll();
    
    // Subscribe again with a small delay between each
    let index = 0;
    channelsToReconnect.forEach((subscription, channelName) => {
      const { options, callbacks } = subscription;
      
      setTimeout(() => {
        this.subscribe(channelName, options, callbacks);
        
        if (callbacks.onReconnect) {
          callbacks.onReconnect();
        }
        
        // If this is the last one, mark reconnecting as done
        if (index === channelsToReconnect.size - 1) {
          this.isReconnecting = false;
          this.connectionStatus = 'connected';
        }
        
        index++;
      }, index * 100); // Stagger reconnections by 100ms
    });
  }
  
  // Get connection status
  getConnectionStatus(): 'connected' | 'disconnected' | 'reconnecting' {
    return this.connectionStatus;
  }
}

// Export singleton instance
export const subscriptionManager = new SubscriptionManager();

export default subscriptionManager;
