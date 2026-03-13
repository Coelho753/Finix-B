const app = require('./app');
const env = require('./config/env');
const connectDb = require('./config/db');
const { seedDefaultContent } = require('./services/seedService');

async function bootstrap() {
  await connectDb();
  await seedDefaultContent();
  app.listen(env.port, () => {
    console.log(`Servidor rodando na porta ${env.port}`);
  });
}

bootstrap().catch((error) => {
  console.error('Erro ao iniciar backend', error);
  process.exit(1);
});
