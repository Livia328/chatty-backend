/**
 * when the appilcation called, we will call this config 
 * because these variable are inside the constructor, they will be loaded as well
 
 */
import dotenv from 'dotenv';
import bunyan from 'bunyan';

dotenv.config({});
class Config {
  public DATABASE_URL: string | undefined;
  public JWT_TOKEN: string | undefined;
  public NODE_ENV: string | undefined;
  public SECRET_KEY_ONE: string | undefined;
  public SECRET_KEY_TWO: string | undefined;
  public CLIENT_URL: string | undefined;
  public REDIS_HOST: string | undefined;

  //创建一个default value
  private readonly DEFAULT_DATABASE_URL = 'mongodb://localhost:27017/chattyapp-backend';

  constructor() {
    //所有在.env文件里的变量都要被放到constructor里
    this.DATABASE_URL = process.env.DATABASE_URL || this.DEFAULT_DATABASE_URL; //如果没有值，就用default value
    this.JWT_TOKEN = process.env.JWT_TOKEN || '1234';
    this.NODE_ENV = process.env.NODE_ENV || '';
    this.SECRET_KEY_ONE = process.env.SECRET_KEY_ONE || '';
    this.SECRET_KEY_TWO = process.env.SECRET_KEY_TWO || '';
    this.CLIENT_URL = process.env.CLIENT_URL || '';
    this.REDIS_HOST = process.env.REDIS_HOST || '';
  }

  /**
   * 使用bunyan API 创建错误日志
   * 需要传入一个name，just like an identify, to comfirm where the error comes from
   */
  public createLogger(name: string): bunyan {
    return bunyan.createLogger({ name, level: 'debug' });
  }

  //validate to make sure that the configure the enviroment variables actually exists
  //if we load this, we will have all the properties
  public validateConfig(): void {
    for (const [key, value] of Object.entries(this)) {
      if (value === undefined) {
        throw new Error(`Configuration ${key} is undefinded.`);
      }
    }
  }
}
export const config: Config = new Config();
