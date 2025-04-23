
import { useState, useEffect } from 'react';
import { subscriptionManager } from '../utils/subscriptions';

interface UseRealtimeOptions<T = any> {
  table: string;
  schema?: string;
  event?: 'INSERT' | 'UPDATE' | 'DELETE' | '*';
  filter?: string;
  initialData?: T[];
  transform?: (data: any) => T;
  onError?: (error: any) => void;
}

export function useRealtime<T = any>(options: UseRealtimeOptions<T>) {
  const [data, setData] = useState<T[]>(options.initialData || []);
  const [error, setError] = useState<Error | null>(null);
  const [status, setStatus] = useState<'connecting' | 'connected' | 'disconnected'>('connecting');
  
  useEffect(() => {
    const { table, schema = 'public', event = '*', filter, transform } = options;
    
    // Generate a unique channel name for this subscription
    const channelName = `${schema}_${table}_${event}_${Math.random().toString(36).substring(2, 9)}`;
    
    // Subscribe to the table changes
    const unsubscribe = subscriptionManager.subscribe(
      channelName,
      { table, schema, event, filter },
      {
        onData: (payload: any) => {
          // Transform the data if a transform function is provided
          const newItem = transform ? transform(payload.new) : payload.new;
          
          // Handle different event types
          if (payload.eventType === 'INSERT') {
            setData(current => [...current, newItem]);
          } else if (payload.eventType === 'UPDATE') {
            setData(current => 
              current.map(item => 
                // Assuming each item has an id field
                (item as any).id === newItem.id ? newItem : item
              )
            );
          } else if (payload.eventType === 'DELETE') {
            setData(current => 
              current.filter(item => (item as any).id !== payload.old.id)
            );
          }
        },
        onError: (error: any) => {
          console.error('Realtime subscription error:', error);
          setError(error);
          if (options.onError) {
            options.onError(error);
          }
        },
        onChannelError: (error: any) => {
          console.error('Realtime channel error:', error);
          setStatus('disconnected');
          setError(error);
          if (options.onError) {
            options.onError(error);
          }
        },
        onReconnect: () => {
          console.log('Realtime subscription reconnected');
          setStatus('connected');
          setError(null);
        }
      }
    );
    
    // Update status to connected
    setStatus('connected');
    
    // Cleanup function to unsubscribe
    return () => {
      unsubscribe();
    };
  }, [options.table, options.schema, options.event, options.filter]);
  
  return {
    data,
    error,
    status
  };
}
