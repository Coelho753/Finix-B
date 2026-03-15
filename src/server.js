const app = require('./app');
const env = require('./config/env');
const connectDb = require('./config/db');
const { seedDefaultContent, seedAdminUser } = require('./services/seedService');

async function bootstrap() {
  await connectDb();
  await seedDefaultContent();
  await seedAdminUser();
  app.listen(env.port, () => {
    console.log(`Servidor rodando na porta ${env.port}`);
  });
}

bootstrap().catch((error) => {
  console.error('Erro ao iniciar backend', error);
  process.exit(1);
});
