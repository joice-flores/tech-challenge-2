import mongoose from 'mongoose';

beforeAll(async () => {
  // Usa MongoDB local para testes
  const mongoUri = process.env.MONGO_URL_TEST || 'mongodb://localhost:27017/tech-challenge-test';
  await mongoose.connect(mongoUri);
}, 30000);

afterAll(async () => {
  // Limpa e desconecta
  await mongoose.connection.dropDatabase();
  await mongoose.disconnect();
}, 30000);

afterEach(async () => {
  // Limpa todas as coleções após cada teste
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }
});
