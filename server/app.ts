require('dotenv').config();
import express, { NextFunction, Request, Response } from 'express';
export const app = express();
import cors from "cors";
import cookieParser from "cookie-parser";
import connectDB from './utils/db';
import { ErrorMiddleware } from './middleware/error';
import userRouter from './routes/user.route';
import courseRouter from './routes/course.routes';

// Body parser
app.use(express.json({ limit: "50mb" }));

// Cookie parser
app.use(cookieParser());

// CORS = Cross-Origin Resource Sharing
app.use(cors({
    origin: process.env.ORIGIN
}));

app.use("/api/v1", userRouter)
app.use("/api/v1",courseRouter)


// Testing API
app.get("/test", (req: Request, res: Response, next: NextFunction) => {
    res.status(200).json({
        success: true,
        message: "api is working",
    });
});

connectDB();
app.all( "*", (req:Request, res:Response, next:NextFunction) => {
    const err =  new Error(`Route ${req.originalUrl}, not found`) as any ;
    err.statusCode = 400;
    next(err)
})

app.use(ErrorMiddleware)
