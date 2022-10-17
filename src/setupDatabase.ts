import mongoose from 'mongoose';
import { config } from './config';
import Logger from 'bunyan';

const log: Logger = config.createLogger('setupDatabase');

// an anonymous function，when you want to import it, you can use any name you want
export default () => {
  const connect = () => {
    // mongoose.connect('mongodb://localhost:27017/chattyapp-backend')
    mongoose
      .connect(`${config.DATABASE_URL}`)
      // 这里的then就是指链接好了之后
      .then(() => {
        log.info('Successfully connected to database');
      })
      .catch((error) => {
        log.error('Error connecting to databse', error);
        // 如果出现错误了，那么久exit当前的程序
        return process.exit(1);
      });
  };

  connect();
  // if it is disconnected, it will try to connect again
  mongoose.connection.on('disconnected', connect);
};
