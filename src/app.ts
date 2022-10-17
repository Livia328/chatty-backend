import express, { Express } from 'express';
import { ChattyServer } from './setupServer';
import databaseConnection from './setupDatabase'; //因为在创建方法的时候是annoyous function，所以这里可以取任意名字
import { config } from './config';

class Application {
  public initialize(): void {
    this.loadConfig(); //once we start the application, it will load the config
    databaseConnection(); //then it will start the database
    const app: Express = express();
    // 构建了在setupServer里创建的ChattyServer类
    const server: ChattyServer = new ChattyServer(app);
    server.start(); //then start the server
  }

  private loadConfig(): void {
    config.validateConfig();
  }
}

const application: Application = new Application();
application.initialize();
