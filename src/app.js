import express from "express";
import cors from "cors";
import authRouter from "./routes/AuthRoutes.js";
import entriesRouter from "./routes/EntriesRoutes.js";

const app = express();
app.use(cors());
app.use(express.json());

app.use([authRouter, entriesRouter]);

const port = 5000;
app.listen(port, () => console.log(`Server running in port: ${port}`));
