import express from "express";
import authRoutes from "~/routes/authRoutes";
import postRoutes from "~/routes/postRoutes";
import adminRoutes from "~/routes/adminRoutes";
import { errorHandler } from "~/middlewares/errorHandler";

const app = express();

// Middlewares globais
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rotas da aplicação
app.use("/auth", authRoutes);
app.use("/posts", postRoutes);
app.use("/admin", adminRoutes);

// Middleware de tratamento de erros (deve ser o último)
app.use(errorHandler);

export default app;
