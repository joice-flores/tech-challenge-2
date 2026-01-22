import mongoose from "mongoose";

export async function connectDatabase() {
  try {
    const mongoUrl = process.env.MONGO_URL;

    if (!mongoUrl) {
      throw new Error("MONGO_URL não está definida nas variáveis de ambiente");
    }

    await mongoose.connect(mongoUrl);

    console.log("🍃 MongoDB conectado com sucesso");

    mongoose.connection.on("error", (error) => {
      console.error("❌ Erro na conexão com MongoDB:", error);
    });

    mongoose.connection.on("disconnected", () => {
      console.warn("⚠️ MongoDB desconectado");
    });
  } catch (error) {
    console.error("❌ Erro ao conectar com MongoDB:", error);
    process.exit(1);
  }
}
