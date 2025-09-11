import { NextFunction, Request, Response } from "express";
import { CatchAsyncError } from "../middleware/catchAsyncError";
import ErrorHandler from "../utils/ErrorHandler";
import cloudinary from "cloudinary";
import { createCourse, getAllCoursesService } from "../services/course.service";
import CourseModel from "../models/course.model";
import { redis } from "../utils/redis";
import { IUser } from "../models/user.model";
import mongoose from "mongoose";
import { title } from "process";
import ejs from "ejs";
import path from "path";
import sendMail from "../utils/sendMail";
import { json } from "stream/consumers";

//upload course

export const uploadCourse = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = req.body;
      const thumnnail = data.thumnnail;
      if (thumnnail) {
        const myCloud = await cloudinary.v2.uploader.upload(thumnnail, {
          folder: "courses",
        });
        data.thumnnail = {
          public_id: myCloud.public_id,
          url: myCloud.secure_url,
        };
      }

      createCourse(data, res, next);
    } catch (error:any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

export const editCourse = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = req.body;
      const thumnnail = data.thumnnail;

      if (thumnnail) {
        await cloudinary.v2.uploader.destroy(thumnnail.public_id);

        const myCloud = await cloudinary.v2.uploader.upload(thumnnail, {
          folder: "courses",
        });
        data.thumnnail = {
          public_id: myCloud.public_id,
          url: myCloud.secure_url,
        };

        const courseId = req.params.id;
        const course = await CourseModel.findByIdAndUpdate(
          courseId,
          {
            $set: data,
          },
          { new: true }
        );

        res.status(201).json({
          success: true,
          course,
        });
      }
    } catch (error:any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

//get single course -- without purchase

export const getSingleCourse = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const courseId = req.params.id;
      const isCacheExist = await redis.get(courseId);

      if (isCacheExist) {
        const course = JSON.parse(isCacheExist);
        res.status(200).json({
          success: true,
          course,
        });
      } else {
        const course = await CourseModel.findById(req.params.id).select(
          "-courseData.suggestion -courseData.questions -courseData.links"
        );

        if (!course) {
          return next(new ErrorHandler("Course not found", 404));
        }

        await redis.set(courseId, JSON.stringify(course));
        res.status(200).json({
          success: true,
          course,
        });
      }
    } catch (error:any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

//getting all course

export const getAllCourses = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const isCacheExist = await redis.get("allCourses");
      if (isCacheExist) {
        const courses = JSON.parse(isCacheExist);
        res.status(200).json({
          success: true,
          courses,
        });
      } else {
        const courses = await CourseModel.find().select(
          "-courseData.videoUrl -courseData.suggestion -courseData.question -courseData.links"
        );

        res.status(200).json({
          success: true,
          courses,
        });
      }
    } catch (error:any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

//get courses contenr - only for valid user

export const getCourseByUser = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const User = req.user as IUser;
      const userCourseList = User?.courses;
      const courseId = req.params.id;

      const courseExists = userCourseList?.find(
        (course: any) => course._id.toString() === courseId
      );

      if (!courseExists) {
        return next(
          new ErrorHandler("You are not eligible to access this course", 404)
        );
      }

      const course = await CourseModel.findById(courseId);

      const content = course?.courseData;

      res.status(200).json({
        success: true,
        content,
      });
    } catch (error:any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

//add question in the course

interface IAddQuestionData {
  question: string;
  courseId: string;
  contentId: string;
}

export const addQuestion = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { question, courseId, contentId } = req.body;
      const course = await CourseModel.findById(courseId);

      if (!mongoose.Types.ObjectId.isValid(contentId)) {
        return next(new ErrorHandler("invlaid Content Id", 400));
      }

      const courseContent = course?.courseData?.find((item: any) =>
        item._id.equals(contentId)
      );

      if (!courseContent) {
        return next(
          new ErrorHandler(
            "Invalid Conent ihttps://www.youtube.com/watch?v=uXUl2U5nqz4d",
            400
          )
        );
      }

      const newQuestion: any = {
        user: req.user,
        question,
        questionReplies: [],
      };
      //adding newquestion
      courseContent.questions.push(newQuestion);
      //save

      await course?.save();

      res.status(200).json({
        success: true,
        course,
      });
    } catch (error:any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

// add answer in the question

interface IAddAnswerData {
  answer: string;
  courseId: string;
  contentId: string;
  questionId: string;
}

export const addAnwser = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const {
        answer,
        courseId,
        contentId,
        questionId,
      }: IAddAnswerData = req.body;

      const course = await CourseModel.findById(courseId);

      if (!mongoose.Types.ObjectId.isValid(contentId)) {
        return next(new ErrorHandler("Invalid content id", 400));
      }

      const couseContent = course?.courseData?.find((item: any) =>
        item._id.equals(contentId)
      );

      if (!couseContent) {
        return next(new ErrorHandler("Invalid content id", 400));
      }

      const question = couseContent?.questions?.find((item: any) =>
        item._id.equals(questionId)
      );

      if (!question) {
        return next(new ErrorHandler("Invalid question id", 400));
      }

      // create a new answer object
      const newAnswer: any = {
        user: req.user,
        answer,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // add this answer to our course content
      question.questionReplies.push(newAnswer);

      await course?.save();
      const User = req.user as IUser;
      console.log(User);
      const id = User?._id;
      if (id === question.user._id) {
        // create a notification
      } else {
        const data = {
          name: question.user.name,
          title: couseContent.title,
        };

        const html = await ejs.renderFile(
          path.join(__dirname, "../mails/question-reply.ejs"),
          data
        );

        try {
          await sendMail({
            email: question.user.email,
            subject: "Question Reply",
            template: "question-reply.ejs",
            data,
          });
        } catch (error:any) {
          return next(new ErrorHandler(error.message, 500));
        }
      }

      res.status(200).json({
        success: true,
        course,
      });
    } catch (error:any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

//add review in course
interface IAddReviewData {
  review: string;
  rating: number;
  userId: string;
}

export const addReview = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const User = req.user as IUser;
      const userCourseList = User?.courses;

      const courseId = req.params.id;

      // check if courseId already exists in userCourseList based on _id
      const courseExists = userCourseList?.some(
        (course: any) => course._id.toString() === courseId.toString()
      );

      if (!courseExists) {
        return next(
          new ErrorHandler("You are not eligible to access this course", 404)
        );
      }

      const course = await CourseModel.findById(courseId);

      const { review, rating } = req.body as IAddReviewData;

      const reviewData: any = {
        user: req.user,
        rating,
        comment: review,
      };

      course?.reviews.push(reviewData);

      let avg = 0;

      course?.reviews.forEach((rev: any) => {
        avg += rev.rating;
      });

      if (course) {
        course.ratings = avg / course.reviews.length; // one example we have 2 reviews one is 5 another one is 4 so math working like this = 9 / 2  = 4.5 ratings
      }

      await course?.save();

      await redis.set(courseId, JSON.stringify(course), "EX", 604800); // 7days

      // create notification
      // await NotificationModel.create({
      //   user: req.user?._id,
      //   title: "New Review Received",
      //   message: `${req.user?.name} has given a review in ${course?.name}`,
      // });

      res.status(200).json({
        success: true,
        course,
      });
    } catch (error:any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

// add reply in review
interface IAddReviewData {
  comment: string;
  courseId: string;
  reviewId: string;
}
export const addReplyToReview = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { comment, courseId, reviewId } = req.body as IAddReviewData;

      const course = await CourseModel.findById(courseId);

      if (!course) {
        return next(new ErrorHandler("Course not found", 404));
      }

      const review = course?.reviews?.find(
        (rev: any) => rev._id.toString() === reviewId
      );

      if (!review) {
        return next(new ErrorHandler("Review not found", 404));
      }

      const replyData: any = {
        user: req.user,
        comment,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      if (!review.commentReplies) {
        review.commentReplies = [];
      }

      review.commentReplies?.push(replyData);

      await course?.save();

      await redis.set(courseId, JSON.stringify(course), "EX", 604800); // 7days

      res.status(200).json({
        success: true,
        course,
      });
    } catch (error:any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

//get all courses - only for admin
export const getAllUsers = async (res: Response) => {
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      getAllCoursesService(res);
    } catch (error:any) {
      return next(new ErrorHandler(error.message, 400));
    }
  };
};


export const deleteCourse = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;

      const course = await CourseModel.findById(id);

      if (!course) {
        return next(new ErrorHandler("User not found", 404));
      }

      await course.deleteOne({ id });

      await redis.del(id);

      res.status(200).json({
        success: true,
        message: "Course deleted successfully",
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 400));
    }
  }
);
