import express from 'express';
import { activateUser, getuserInfo, loginUser, logoutUser, registrationUser, socialAuth, updateAccessToken,  } from '../controllers/user.controller';
import { authorizeRoles, isAutheticated } from '../middleware/auth';



const userRouter = express.Router();

userRouter.post("/registration", registrationUser);

userRouter.post("/activate-user", activateUser);

userRouter.post("/login", loginUser);

userRouter.get('/logout', isAutheticated, logoutUser)

userRouter.get('/me', isAutheticated, getuserInfo)

userRouter.post('/socialAuth', socialAuth)

export default userRouter