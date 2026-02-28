export default () => ({
  PORT: process.env.PORT!,
  APP_NAME: process.env.APP_NAME!,
  VERSION: process.env.VERSION!,
  NODE_ENV: process.env.NODE_ENV!,
  REDIS_HOST: process.env.REDIS_HOST!,
  REDIS_PORT: process.env.REDIS_PORT!,
});
