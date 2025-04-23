
import { RealtimeChannel, RealtimePostgresChangesPayload } from '@supabase/supabase-js';
import { supabase } from '../client';

interface SubscriptionOptions {
  table: string;
  schema?: string;
  event?: 'INSERT' | 'UPDATE' | 'DELETE' | '*';
  filter?: string;
}

interface SubscriptionCallbacks {
  onData: (payload: any) => void;
  onError?: (error: any) => void;
  onChannelError?: (error: any) => void;
  onReconnect?: () => void;
}

class SubscriptionManager {
  private channels: Map<string, RealtimeChannel> = new Map();

  subscribe(
    channelName: string,
    options: SubscriptionOptions,
    callbacks: SubscriptionCallbacks
  ): () => void {
    const { table, schema = 'public', event = '*', filter } = options;

    // Create channel with proper event types
    const channel = supabase.channel(channelName);
    
    // Fix the postgres_changes call to use the proper syntax
    channel.on(
      'postgres_changes', 
      { 
        event: event,
        schema: schema,
        table: table,
        filter: filter
      } as any, // Use type assertion to bypass TypeScript error
      (payload: RealtimePostgresChangesPayload<any>) => {
        callbacks.onData && callbacks.onData(payload);
      }
    )
    .subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        callbacks.onReconnect && callbacks.onReconnect();
      } else if (status === 'CHANNEL_ERROR') {
        callbacks.onChannelError && callbacks.onChannelError(new Error('Channel error'));
      } else if (status === 'CLOSED') {
        this.channels.delete(channelName);
      }
    });

    this.channels.set(channelName, channel);

    return () => {
      channel.unsubscribe();
      this.channels.delete(channelName);
    };
  }

  unsubscribeAll() {
    this.channels.forEach(channel => channel.unsubscribe());
    this.channels.clear();
  }
}

export const subscriptionManager = new SubscriptionManager();
