export default () => ({
  PORT: process.env.PORT!,
  APP_NAME: process.env.APP_NAME!,
  VERSION: process.env.VERSION!,
  DATABASE_URL: process.env.DATABASE_URL!,
  NODE_ENV: process.env.NODE_ENV!,
  REDIS_HOST: process.env.REDIS_HOST!,
  REDIS_PORT: process.env.REDIS_PORT!,
  REDIS_URL: process.env.REDIS_URL!,
});
