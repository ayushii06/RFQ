import express from "express";
import { syncUser } from "../controller/userController.js";

const router = express.Router();

router.post("/sync", syncUser);

export default router;
