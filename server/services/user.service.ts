import { Response } from "express";
//get user by id

import userModel from "../models/user.model";
import { redis } from "../utils/redis";

export const getUserId = async (id: string, res: Response) => {
  const userJson = await redis.get(id);
  if (userJson) {
    const user = JSON.parse(userJson);
    res.status(201).json({
      success: true,
      user,
    });
  }
};