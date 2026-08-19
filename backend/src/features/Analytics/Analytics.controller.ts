import { Request, Response } from 'express';
import createError from 'http-errors';
import asyncHandler from '../../utils/asyncHandler';
import * as AnalyticsService from './Analytics.service';

export const getDashboardHandler = asyncHandler(async (_req: Request, res: Response) => {
  const summary = await AnalyticsService.getDashboardSummary();
  res.status(200).json(summary);
});

export const getSellerAnalyticsHandler = asyncHandler(async (req: Request, res: Response) => {
  const analytics = await AnalyticsService.getSellerAnalytics(req.params.id);
  res.status(200).json(analytics);
});

export const getMySellerAnalyticsHandler = asyncHandler(async (req: Request, res: Response) => {
  const analytics = await AnalyticsService.getSellerAnalytics(req.user!.id);
  res.status(200).json(analytics);
});

export const getTeamAnalyticsHandler = asyncHandler(async (req: Request, res: Response) => {
  const analytics = await AnalyticsService.getTeamAnalytics(req.params.id);
  res.status(200).json(analytics);
});

export const getCampaignAnalyticsHandler = asyncHandler(async (req: Request, res: Response) => {
  const analytics = await AnalyticsService.getCampaignAnalytics(req.params.id);
  if (!analytics) throw createError(404, 'Campaign not found.');
  res.status(200).json(analytics);
});

export const getVehicleAnalyticsHandler = asyncHandler(async (_req: Request, res: Response) => {
  const analytics = await AnalyticsService.getVehicleAnalytics();
  res.status(200).json(analytics);
});
