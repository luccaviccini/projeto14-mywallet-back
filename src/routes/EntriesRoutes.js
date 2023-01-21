import {Router } from 'express';
import { newEntry, getEntry } from '../controller/Entries.js';
import { authValidation } from '../middleware/AuthMiddleware.js';

const entriesRouter = Router();

entriesRouter.use(authValidation);
entriesRouter.post("/entries", newEntry);
entriesRouter.get("/entries", getEntry);

export default entriesRouter;

