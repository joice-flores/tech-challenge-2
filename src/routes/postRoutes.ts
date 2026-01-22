import { Router } from "express";
import { PostController } from "~/controllers/PostController";
import { verifyToken, authorize } from "~/middlewares/auth";
import { validateRequest } from "~/middlewares/validateRequest";

const router = Router();
const postController = new PostController();

router.post(
  "/",
  verifyToken,
  authorize("teacher", "admin"),
  validateRequest({
    title: { required: true, type: "string", min: 3 },
    content: { required: true, type: "string", min: 10 },
  }),
  (req, res) => postController.createPost(req, res),
);

router.get("/", (req, res) => postController.listPosts(req, res));

router.get("/search", (req, res) => postController.searchPosts(req, res));

router.get("/author/:authorId", (req, res) =>
  postController.listPostsByAuthor(req, res),
);

router.get("/:id", (req, res) => postController.getPostById(req, res));

router.put(
  "/:id",
  verifyToken,
  authorize("teacher", "admin"),
  validateRequest({
    title: { required: false, type: "string", min: 3 },
    content: { required: false, type: "string", min: 10 },
  }),
  (req, res) => postController.updatePost(req, res),
);

router.delete("/:id", verifyToken, authorize("teacher", "admin"), (req, res) =>
  postController.deletePost(req, res),
);

export default router;
