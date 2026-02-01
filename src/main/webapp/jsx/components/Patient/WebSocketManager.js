class WebSocketManager {
    constructor(url, onMessage, onError, onStatusChange) {
        this.url = url;
        this.ws = null;
        this.onMessage = onMessage;
        this.onError = onError;
        this.onStatusChange = onStatusChange;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
        this.reconnectDelay = 1000;
        this.isIntentionallyClosed = false;
        this.sessionId = null;
        this.messageQueue = [];
        this.isConnected = false;
        this.lastPingTime = null;
        this.latency = 0;
        this.chunksSent = 0;
    }

    connect() {
        return new Promise((resolve, reject) => {
            this.isIntentionallyClosed = false;
            
            try {
              
                this.ws = new WebSocket(this.url);
                this.ws.binaryType = 'arraybuffer';
                
                this.ws.onopen = () => {
               
                    this.isConnected = true;
                    this.reconnectAttempts = 0;
                    this.chunksSent = 0;
                    this.onStatusChange('connected');
                    this.flushMessageQueue();
                    resolve();
                };

                this.ws.onmessage = (event) => {
                    try {
                        const data = JSON.parse(event.data);
                
                        if (data.type === 'status' && data.session_id) {
                            this.sessionId = data.session_id;
                        }
                        
                        if (this.lastPingTime) {
                            this.latency = Date.now() - this.lastPingTime;
                            this.lastPingTime = null;
                        }
                        
                        this.onMessage(data);
                    } catch (error) {
                        console.error('Error parsing WebSocket message:', error);
                        this.onError(error);
                    }
                };

                this.ws.onerror = (error) => {
                    console.error('WebSocket error:', error);
                    this.isConnected = false;
                    this.onStatusChange('error');
                    this.onError(error);
                };

                this.ws.onclose = (event) => {
                    this.isConnected = false;
                    this.onStatusChange('disconnected');
                    
                    if (!this.isIntentionallyClosed && this.reconnectAttempts < this.maxReconnectAttempts) {
                        this.attemptReconnect();
                    }
                };
            } catch (error) {
                console.error('Error creating WebSocket:', error);
                reject(error);
            }
        });
    }

    attemptReconnect() {
        this.reconnectAttempts++;
        this.onStatusChange('reconnecting');
        
        const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
        
        setTimeout(() => {
            if (!this.isIntentionallyClosed) {
                this.connect().catch((error) => {
                    console.error('Reconnection failed:', error);
                });
            }
        }, delay);
    }

    send(data) {
        if (!this.isConnected || !this.ws || this.ws.readyState !== WebSocket.OPEN) {
            console.warn('WebSocket not ready, queueing message');
            this.messageQueue.push(data);
            return;
        }

        try {
            this.lastPingTime = Date.now();
            
            if (data instanceof Blob) {
                // Convert Blob to ArrayBuffer before sending
                data.arrayBuffer().then(arrayBuffer => {
                    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
                        this.ws.send(arrayBuffer);
                        this.chunksSent++;
                    } else {
                        console.warn('WebSocket closed before chunk could be sent');
                    }
                }).catch(error => {
                    console.error('Error converting Blob to ArrayBuffer:', error);
                });
            } else if (data instanceof ArrayBuffer) {
                this.ws.send(data);
                this.chunksSent++;
            
            } else if (typeof data === 'string') {
                this.ws.send(data);
            
            } else {
                console.error('Unsupported data type for WebSocket send:', typeof data);
            }
        } catch (error) {
            console.error('Error sending WebSocket message:', error);
            this.messageQueue.push(data);
        }
    }

    flushMessageQueue() {
        console.log(`Flushing message queue: ${this.messageQueue.length} messages`);
        while (this.messageQueue.length > 0 && this.isConnected) {
            const data = this.messageQueue.shift();
            this.send(data);
        }
    }

    close() {
        console.log('Closing WebSocket connection');
        this.isIntentionallyClosed = true;
        this.isConnected = false;
        this.messageQueue = [];
        
        if (this.ws) {
            this.ws.close();
            this.ws = null;
        }
    }

    getConnectionQuality() {
        if (!this.isConnected) return 'disconnected';
        if (this.latency === 0) return 'excellent';
        if (this.latency < 200) return 'excellent';
        if (this.latency < 500) return 'good';
        if (this.latency < 1000) return 'fair';
        return 'poor';
    }

    getSessionId() {
        return this.sessionId;
    }

    getLatency() {
        return this.latency;
    }

    getChunksSent() {
        return this.chunksSent;
    }
}

export default WebSocketManager;