import {Router } from 'express';
import { newEntry, getEntry } from '../controller/Entries.js';

const entriesRouter = Router();

entriesRouter.post("/entries", newEntry);
entriesRouter.get("/entries", getEntry);

export default entriesRouter;

