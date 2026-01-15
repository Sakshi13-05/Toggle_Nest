import express from "express";
import { verifyUser } from "../controllers/auth.controller.js";
import verifyToken from "../middleware/verifyToken.js";

const router = express.Router();

router.post("/verify", verifyToken, verifyUser);

export default router;
