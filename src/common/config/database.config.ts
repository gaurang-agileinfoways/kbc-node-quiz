import { registerAs } from '@nestjs/config';

export default registerAs('database', () => ({
  mongo: {
    connectionString: process.env.MONGODB_URL + 'kbc',
  },
}));
