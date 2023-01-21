
import {Router} from 'express';
import { registerUser, loginUser  } from '../controller/Auth.js';
import { validateSchema } from '../middleware/validateSchema.js';
import { registerSchema, loginSchema } from '../schema/AuthSchema.js';


const authRouter = Router();

authRouter.post('/register', validateSchema(registerSchema), registerUser);
authRouter.post('/login', validateSchema(loginSchema), loginUser);

export default authRouter;

