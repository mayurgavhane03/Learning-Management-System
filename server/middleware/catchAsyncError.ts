import { NextFunction } from "express"


export const CatchAsyyncError = (theFunc :  any)=> (req:Request, res:Response, next:NextFunction) =>{
    Promise.resolve(theFunc(req,res,next)).catch(next)
}