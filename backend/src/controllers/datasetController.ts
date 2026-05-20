import type { RequestHandler } from "express";

import { getDatasetById, listDatasets } from "../services/datasetService.js";

export const listDatasetSummaries: RequestHandler = async (_request, response, next) => {
  try {
    response.json({
      datasets: await listDatasets()
    });
  } catch (error) {
    next(error);
  }
};

export const getDataset: RequestHandler<{ id: string }> = async (request, response, next) => {
  try {
    const dataset = await getDatasetById(request.params.id);

    if (!dataset) {
      response.status(404).json({
        error: "Dataset not found."
      });
      return;
    }

    response.json(dataset);
  } catch (error) {
    next(error);
  }
};
