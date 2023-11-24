import { Router } from 'express';
import passport from 'passport';
import usersController from '../controllers/users.controller.js';

const userRouter = Router();

userRouter.post('/', passport.authenticate('register'), usersController.postUser);

userRouter.get('/', usersController.getUser);

export default userRouter;