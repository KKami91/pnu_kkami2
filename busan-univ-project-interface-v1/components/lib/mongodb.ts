import { MongoClient } from 'mongodb';

const uri = process.env.MONGODB_URI;

class MongoDBConnection {
  private static instance: MongoDBConnection;
  private client: MongoClient | null = null;
  private connectionPromise: Promise<MongoClient> | null = null;

  private constructor() {}

  public static getInstance(): MongoDBConnection {
    if (!MongoDBConnection.instance) {
      MongoDBConnection.instance = new MongoDBConnection();
    }
    return MongoDBConnection.instance;
  }

  async getClient(): Promise<MongoClient> {
    if (!this.client) {
      if (!this.connectionPromise) {
        this.connectionPromise = MongoClient.connect(uri, {
          maxPoolSize: 10,
          minPoolSize: 5,
          maxIdleTimeMS: 60000,
        });
      }
      this.client = await this.connectionPromise;
    }
    return this.client;
  }

  async getDb() {
    const client = await this.getClient();
    return client.db('heart_rate_db');
  }

  async closeConnection() {
    if (this.client) {
      await this.client.close();
      this.client = null;
      this.connectionPromise = null;
    }
  }
}

// 프로세스 종료 시 연결 정리
process.on('SIGINT', async () => {
  await MongoDBConnection.getInstance().closeConnection();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await MongoDBConnection.getInstance().closeConnection();
  process.exit(0);
});

export default MongoDBConnection.getInstance();