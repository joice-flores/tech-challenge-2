import { Router } from "express";
import { AuthController } from "~/controllers/AuthController";
import { verifyToken } from "~/middlewares/auth";
import { validateRequest } from "~/middlewares/validateRequest";

const router = Router();
const authController = new AuthController();

router.post(
  "/login",
  validateRequest({
    email: {
      required: true,
      type: "string",
      pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    },
    password: {
      required: true,
      type: "string",
    },
  }),
  (req, res) => authController.login(req, res),
);

router.get("/me", verifyToken, (req, res) => authController.me(req, res));

router.put(
  "/me",
  verifyToken,
  validateRequest({
    name: {
      required: false,
      type: "string",
      min: 3,
    },
    email: {
      required: false,
      type: "string",
      pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    },
    password: {
      required: false,
      type: "string",
      min: 6,
    },
    cpf: {
      required: false,
      type: "string",
      pattern: /^\d{11}$/,
    },
  }),
  (req, res) => authController.update(req, res),
);

export default router;
