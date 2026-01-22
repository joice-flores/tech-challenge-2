import "module-alias/register";
import "dotenv/config";
import app from "~/app";
import { connectDatabase } from "~/configs/database";

const PORT = 3000;

connectDatabase().then(() => {
  app.listen(PORT, () => {
    console.log(`🚀 Server rodando na porta ${PORT}`);
  });
});
