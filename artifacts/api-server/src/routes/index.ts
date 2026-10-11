import { Router, type IRouter } from "express";
import healthRouter from "./health";
import gameAssetsRouter from "./gameAssets";

const router: IRouter = Router();

router.use(healthRouter);
router.use(gameAssetsRouter);

export default router;
