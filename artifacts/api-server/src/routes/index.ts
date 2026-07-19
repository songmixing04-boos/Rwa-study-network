import { Router, type IRouter } from "express";
import healthRouter from "./health";
import videoWorkerRouter from "./video-worker";
import extproxyRouter from "./extproxy";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/video-worker", videoWorkerRouter);
router.use("/extproxy", extproxyRouter);

export default router;
