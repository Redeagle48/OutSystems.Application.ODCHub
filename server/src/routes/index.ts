import { Router } from "express";
import settingsRoutes from "./settings.routes.js";
import portfolioRoutes from "./portfolio.routes.js";
import assetsRoutes from "./assets.routes.js";
import buildsRoutes from "./builds.routes.js";
import deploymentsRoutes from "./deployments.routes.js";
import dependenciesRoutes from "./dependencies.routes.js";
import configurationsRoutes from "./configurations.routes.js";
import usersRoutes from "./users.routes.js";
import codeQualityRoutes from "./code-quality.routes.js";

const router = Router();

router.use("/settings", settingsRoutes);
router.use("/portfolio", portfolioRoutes);
router.use("/assets", assetsRoutes);
router.use("/builds", buildsRoutes);
router.use("/deployments", deploymentsRoutes);
router.use("/dependencies", dependenciesRoutes);
router.use("/configurations", configurationsRoutes);
router.use("/users", usersRoutes);
router.use("/code-quality", codeQualityRoutes);

export default router;
