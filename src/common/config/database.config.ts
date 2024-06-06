import { registerAs } from '@nestjs/config';

export default registerAs('database', () => ({
  mongo: {
    connectionString:
      process.env.MONGODB_URL || 'mongodb://localhost:27017/lyfecoach',
  },
}));
