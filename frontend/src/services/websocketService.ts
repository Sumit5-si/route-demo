type MessageHandler = (data: any) => void;

class WebSocketClient {
  private ws: WebSocket | null = null;
  private tripId: string | null = null;
  private listeners: MessageHandler[] = [];
  private reconnectInterval: any = null;

  connect(tripId: string = 'global') {
    this.tripId = tripId;
    const wsUrl = `ws://127.0.0.1:8000/ws/trips/${tripId}`;

    try {
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        console.log(`[EVoyage WS] Connected to trip stream: ${tripId}`);
        if (this.reconnectInterval) {
          clearInterval(this.reconnectInterval);
          this.reconnectInterval = null;
        }
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.listeners.forEach((handler) => handler(data));
        } catch (err) {
          console.error('[EVoyage WS] Error parsing message:', err);
        }
      };

      this.ws.onclose = () => {
        console.log('[EVoyage WS] Disconnected. Retrying in 3s...');
        this.scheduleReconnect();
      };

      this.ws.onerror = (error) => {
        console.warn('[EVoyage WS] Connection error:', error);
      };
    } catch (e) {
      console.warn('[EVoyage WS] Could not connect:', e);
      this.scheduleReconnect();
    }
  }

  private scheduleReconnect() {
    if (!this.reconnectInterval) {
      this.reconnectInterval = setInterval(() => {
        if (this.tripId) {
          this.connect(this.tripId);
        }
      }, 3000);
    }
  }

  subscribe(handler: MessageHandler) {
    this.listeners.push(handler);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== handler);
    };
  }

  disconnect() {
    if (this.reconnectInterval) {
      clearInterval(this.reconnectInterval);
      this.reconnectInterval = null;
    }
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }
}

export const wsClient = new WebSocketClient();
