import app from './app.js';
import prisma from './prisma/client.js';

const PORT = process.env.PORT ? parseInt(process.env.PORT) : 5000;

async function main() {
  try {
    await prisma.$connect();
    console.log('✅ Database connected');
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    process.exit(1);
  }

  app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`📋 Health check: http://localhost:${PORT}/health`);
    console.log(`🔐 Auth routes:  http://localhost:${PORT}/api/auth`);
    console.log(`👤 User routes:  http://localhost:${PORT}/api/users`);
    console.log(`🏷️  Role routes:  http://localhost:${PORT}/api/roles`);
  });
}

main().catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});

export default main;
