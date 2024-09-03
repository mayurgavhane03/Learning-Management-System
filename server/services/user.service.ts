import { Response } from "express";
//get user by id

import userModel from "../models/user.model"

export const getUserId = async(id:string, res:Response) =>{
    const user =  await userModel.findById(id);
    res.status(201).json({
        success:true,
        user,
    })
}