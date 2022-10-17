import { Application, json, urlencoded, Response, Request, NextFunction } from 'express';
import http from 'http';
import cors from 'cors';
import helmet from 'helmet';
import hpp from 'hpp';
import compression from 'compression';
import cookierSession from 'cookie-session';
import HTTP_STATUS from 'http-status-codes';
import { Server } from 'socket.io';
import { createClient } from 'redis';
import { createAdapter } from '@socket.io/redis-adapter';
import Logger from 'bunyan';
import 'express-async-errors';
import { config } from './config';
import applicationRoutes from './routes';
import { CustomError, IErrorResponse } from './shared/globals/helpers/error-handler';

// use this number to set up our load balancer
const SERVER_PORT = 5000;
//使用import buyan，创建logger
//传入的参数也就是name，这里写了server作为identification,这样之后就知道是server里面有问题了
const log: Logger = config.createLogger('sever');

export class ChattyServer {
  // create an instance of the express application 创建express应用程序的实例
  private app: Application;

  // constructor,构造语句
  // whenever we are going to call this ChattyServer subclass, we are going to create an instance and then we pass the application instance inside this chattyserver,然后传到private app中去
  // 然后这个instance will be called inside out app.ts
  constructor(app: Application) {
    this.app = app;
  }

  // when we call inside our app.ts, it will start our sever, and have some methods or handlers available for us
  // every private method that we are going to create, we are going to call them inside the start method
  public start(): void {
    this.securityMiddleware(this.app);
    this.standardyMiddleware(this.app);
    this.routesMiddleware(this.app);
    this.globalErrorHandler(this.app);
    this.startServer(this.app);
  }

  //add out securityMiddleware安全中间件
  private securityMiddleware(app: Application): void {
    app.use(
      cookierSession({
        name: 'session',
        keys: [config.SECRET_KEY_ONE!, config.SECRET_KEY_TWO!],
        // maxAge is the amount of time that your cookie will be valid，这里是设置了7天
        // 在那之后，如果用户没有新的sign in的动作，它的账号就会消失
        maxAge: 24 * 7 * 3600000,

        // it is ok to set false in our local machine, but is we deploy our code using HTTPS we have to set it to true
        //**在设置了config之后，由true更新了 */
        //if node enviroment is equal to local, this will be false。 so on our local enviroment,
        secure: config.NODE_ENV !== 'local'
      })
    );
    // 这里两个都是用了default configurat
    app.use(hpp());
    app.use(helmet());
    app.use(
      // without this cors we will not be able to make a request from our client to the backend
      cors({
        // all origin later we are going to set up our client URL
        origin: config.CLIENT_URL,
        // 让我们能够正确使用cookies
        credentials: true,
        // 好像是和浏览器啥的有关
        optionsSuccessStatus: 200,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
      })
    );
  }

  private standardyMiddleware(app: Application): void {
    // help compress our requests and reponse
    app.use(compression());
    // 每个请求不会超过50mb，否则会throw an error
    app.use(json({ limit: '50mb' }));
    // allow us to use form our real codes or encoded data to send them back and forth from the client to the server from the server to the clients
    app.use(urlencoded({ extended: true, limit: '50mb' }));
  }

  private routesMiddleware(app: Application): void {
    applicationRoutes(app);
  }

  //it will handle every error inside our application
  //if we have some error, it will be caught here and then sent to our client
  private globalErrorHandler(app: Application): void {
    app.all('*', (req: Request, res: Response) => {
      res.status(HTTP_STATUS.NOT_FOUND).json({ message: `${req.originalUrl} not found` });
    });
    /**
     * 如果error是custom error中的，就调出它的错误类型，number等信息
     * 如果没有错误，就直接进行next function
     */
    app.use((error: IErrorResponse, req: Request, res: Response, next: NextFunction) => {
      log.error(error);
      if (error instanceof CustomError) {
        return res.status(error.statusCode).json(error.serializeErrors());
      }
      next();
    });
  }

  //we are going to call the http server inside this metod
  // 如果前面是async，我们就要return一个promise
  private async startServer(app: Application): Promise<void> {
    try {
      const httpServer: http.Server = new http.Server(app);
      const socketIO: Server = await this.createSocketIO(httpServer);
      this.startHttpServer(httpServer);
      this.socketIOConnections(socketIO);
    } catch (error) {
      log.error(error);
    }
  }

  private async createSocketIO(httpServer: http.Server): Promise<Server> {
    //create an instance of the socketIO sever
    const io: Server = new Server(httpServer, {
      cors: {
        origin: config.CLIENT_URL,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
      }
    });

    const pubClient = createClient({ url: config.REDIS_HOST });
    const subClient = pubClient.duplicate();
    await Promise.all([pubClient.connect(), subClient.connect()]);
    io.adapter(createAdapter(pubClient, subClient));
    return io;
  }

  private startHttpServer(httpServer: http.Server): void {
    log.info(`Server has started with process ${process.pid}`);
    httpServer.listen(SERVER_PORT, () => {
      log.info(`Server running on port ${SERVER_PORT}`);
    });
  }

  private socketIOConnections(io: Server): void {}
}
