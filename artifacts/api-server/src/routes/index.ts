import { Router, type IRouter } from "express";
import healthRouter from "./health";
import insightsRouter from "./insights/index";

const router: IRouter = Router();

router.use(healthRouter);
router.use(insightsRouter);

export default router;
