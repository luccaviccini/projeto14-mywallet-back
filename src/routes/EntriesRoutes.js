import {Router } from 'express';
import { newEntry, getEntry } from '../controller/Entries.js';
import { authValidation } from '../middleware/AuthMiddleware.js';
import EntriesSchema from '../schema/EntriesSchema.js';
import {validateSchema} from '../middleware/validateSchema.js';


const entriesRouter = Router();

entriesRouter.use(authValidation);
entriesRouter.post("/entries", validateSchema(EntriesSchema), newEntry);
entriesRouter.get("/entries", getEntry);

export default entriesRouter;

