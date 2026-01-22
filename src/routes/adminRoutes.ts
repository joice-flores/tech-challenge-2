import { Router } from "express";
import { AdminController } from "~/controllers/AdminController";
import { verifyToken, authorize } from "~/middlewares/auth";
import { validateRequest } from "~/middlewares/validateRequest";

const router = Router();
const adminController = new AdminController();

// Todas as rotas admin requerem autenticação JWT + role admin
// Aplicar middlewares globalmente para todas as rotas deste router
router.use(verifyToken);
router.use(authorize("admin"));

router.post(
  "/users",
  validateRequest({
    name: {
      required: true,
      type: "string",
      min: 3,
    },
    email: {
      required: true,
      type: "string",
      pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    },
    password: {
      required: true,
      type: "string",
      min: 6,
    },
    cpf: {
      required: false,
      type: "string",
      pattern: /^\d{11}$/,
    },
    role: {
      required: true,
      type: "string",
      enum: ["teacher", "admin"],
    },
  }),
  adminController.createUser.bind(adminController),
);

router.get("/users", adminController.listUsers.bind(adminController));

router.get("/users/:id", adminController.getUserById.bind(adminController));

router.delete("/users/:id", adminController.deleteUser.bind(adminController));

export default router;
