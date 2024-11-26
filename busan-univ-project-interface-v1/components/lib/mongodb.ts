import { MongoClient } from 'mongodb';
import { EventEmitter } from 'events';

class MongoDBConnection {
  private static instance: MongoDBConnection;
  private client: MongoClient | null = null;
  private isConnecting: boolean = false;
  private connectionAttempts: number = 0;
  private readonly maxRetries: number = 3;
  private events: EventEmitter;

  private constructor() {
    this.events = new EventEmitter();
  }

  public static getInstance(): MongoDBConnection {
    if (!MongoDBConnection.instance) {
      MongoDBConnection.instance = new MongoDBConnection();
    }
    return MongoDBConnection.instance;
  }

  private async createConnection(): Promise<MongoClient> {
    const poolConfig = {
      maxPoolSize: 10,
      minPoolSize: 5,
      maxIdleTimeMS: 30000,
      waitQueueTimeoutMS: 5000,
      keepAlive: true,
      connectTimeoutMS: 5000,
      serverSelectionTimeoutMS: 5000
    };

    try {
      const client = await MongoClient.connect(process.env.MONGODB_URI!, poolConfig);
      
      // 연결 모니터링
      client.on('connectionPoolCreated', (event) => {
        console.log('Connection pool created');
      });

      client.on('connectionPoolClosed', (event) => {
        console.log('Connection pool closed');
      });

      return client;
    } catch (error) {
      console.error('MongoDB connection error:', error);
      throw error;
    }
  }

  async getClient(): Promise<MongoClient> {
    if (this.client) {
      return this.client;
    }

    if (this.isConnecting) {
      // 연결 중인 경우 대기
      return new Promise((resolve, reject) => {
        this.events.once('connected', (client) => resolve(client));
        this.events.once('error', (error) => reject(error));
      });
    }

    this.isConnecting = true;
    this.connectionAttempts++;

    try {
      this.client = await this.createConnection();
      this.isConnecting = false;
      this.events.emit('connected', this.client);
      return this.client;
    } catch (error) {
      this.isConnecting = false;
      if (this.connectionAttempts < this.maxRetries) {
        return this.getClient();
      }
      this.events.emit('error', error);
      throw error;
    }
  }

  async closeConnection(): Promise<void> {
    if (this.client) {
      try {
        await this.client.close(true);
        this.client = null;
        this.isConnecting = false;
        this.connectionAttempts = 0;
      } catch (error) {
        console.error('Error closing MongoDB connection:', error);
        throw error;
      }
    }
  }

  // 연결 상태 모니터링
  async getConnectionStatus(): Promise<any> {
    if (!this.client) {
      return { status: 'disconnected' };
    }
    try {
      const status = await this.client.db().admin().serverStatus();
      return {
        status: 'connected',
        connections: status.connections,
        uptime: status.uptime
      };
    } catch (error) {
      console.error('Error closing MongoDB connection:', error);
    }
  }
}

export default MongoDBConnection.getInstance();