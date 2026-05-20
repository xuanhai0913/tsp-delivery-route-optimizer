import { Router } from "express";

import { getDataset, listDatasetSummaries } from "../controllers/datasetController.js";

export const datasetRouter = Router();

datasetRouter.get("/", listDatasetSummaries);
datasetRouter.get("/:id", getDataset);
