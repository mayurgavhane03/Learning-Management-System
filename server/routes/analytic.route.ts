import express from "express";
import { authorizeRoles, isAutheticated } from "../middleware/auth";
import { getUserAnalaytics } from '../controllers/analytics.controller'

const analyticsRouter  =  express.Router()

analyticsRouter.get(
  "/get-users-analytics",
  isAutheticated,
  authorizeRoles("admin"),
  getUserAnalaytics
);

analyticsRouter.get(
  "/get-orders-analytics",
  isAutheticated,
  authorizeRoles("admin"),
  getUserAnalaytics
);

analyticsRouter.get(
  "/get-courses-analytics",
  isAutheticated,
  authorizeRoles("admin"),
  getUserAnalaytics
);

export default analyticsRouter
