import express from "express";
import { MongoClient, ObjectId } from "mongodb";
import dotenv from "dotenv";
import cors from "cors";
import joi from "joi";
import bcrypt from "bcrypt";
import { v4 as uuidV4 } from "uuid";
import authRouter from "./routes/AuthRoutes.js";


const app = express();
dotenv.config();
app.use(cors());
app.use(express.json());

const mongoClient = new MongoClient(process.env.DATABASE_URL);
let db;

try {
  await mongoClient.connect();
} catch (err) {
  console.log("Erro no mongo.conect", err.message);
}

db = mongoClient.db();
const USERS_COLLECTION = db.collection("users");
const SESSIONS_COLLECTION = db.collection("sessions");
const ENTRIES_COLLECTION = db.collection("entries");

app.use([authRouter]);

// app.post("/register", async (req, res) => {
//   const { name, email, password } = req.body;

//   // check if email and password are valid
//   const schema = joi.object({
//     name: joi.string().min(1).required(),
//     email: joi.string().email().required(),
//     password: joi.string().min(1).required(),
//   });

//   const { error } = schema.validate({ name, email, password });
//   if (error) {
//     return res.status(422).send("Erro de validação de dados");
//   }

//   // check if email or name already exists
//   const user = await USERS_COLLECTION.findOne({
//     $or: [{ email }, { name }],
//   }).catch((err) => {
//     console.log("Erro no findOne", err.message);
//     return res.status(500).send("Internal server error");
//   });
//   if (user) {
//     return res.status(400).send("Email or name already in use");
//   }

//   // hash password
//   const salt = await bcrypt.genSalt(10);
//   const hashedPassword = await bcrypt.hash(password, salt);

//   // create user
//   await USERS_COLLECTION.insertOne({
//     name,
//     email,
//     password: hashedPassword,
//   });

//   await ENTRIES_COLLECTION.insertOne({
//     name,
//     balance: 0,
//     entries: [],
//   });

//   // send status and token
//   res.status(200).send("User created");
// });

// app.post("/login", async (req, res) => {
//   const { email, password } = req.body;
  
//   // check if email and password are valid
//   const schema = joi.object({
//     email: joi.string().email().required(),
//     password: joi.string().min(1).required(),
//   });
//   const { error } = schema.validate({ email, password });
//   if (error) {
//     return res.status(400).send("Email or password is not valid");
//   }

//   // check if email exists
//   const user = await USERS_COLLECTION
//     .findOne({
//       email,
//     })
//     .catch((err) => {
//       console.log("Erro no findOne", err.message);
//       return res.status(500).send("Internal server error");
//     });
//   if (!user) {
//     return res.status(400).send("Email or password is not valid");
//   }

//   // check if password is correct
//   const isPasswordCorrect = await bcrypt.compare(password, user.password);
//   if (!isPasswordCorrect) {
//     return res.status(400).send("Email or password is not valid");
//   }

//   // create token
//   const token = uuidV4();

//   const session ={
//     name: user.name,
//     email: user.email,
//     token,
//   }

//   // create session
//   await SESSIONS_COLLECTION.insertOne(session);

//   // send status and token
//   res.status(200).send(session);

// });


app.post("/entries" , async (req, res) => {
  //TEM QUE FAZER O TOKEN
  const { authorization } = req.headers;
  const token = authorization?.replace("Bearer ", "");
  if (!token) return res.status(422).send("Informe o token!");
  console.log(token);

  const {value, description, type} = req.body;

  // check if description, value, type and token are valid
  const schema = joi.object({
    value: joi.number().min(1).required(),
    description: joi.string().min(1).required(),
    type: joi.string().valid("income", "expense").required(),
    token: joi.string().min(1).required(),
  });

  const { error } = schema.validate({value, description, type, token });
  if (error) {
    return res.status(422).send(error.details);
  }

  // check if token is valid
  const user = await SESSIONS_COLLECTION.findOne({
    token,  
  })
    .catch((err) => {
      console.log("Erro no findOne", err.message);
      return res.status(500).send("Internal server error");
    })
    ;

  if (!user) {
    return res.status(401).send("Token inválido");
  }

  // create entry
  const userEntry = await ENTRIES_COLLECTION.findOne(
    { name: user.name },
  );

  const date = new Date();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const dayapi = `${day}/${month}`;

  const newEntry = {
    date: dayapi,
    value,
    description,
    type,
  };

  if (type === "income") {
    userEntry.balance += Number(value);
  } else {
    userEntry.balance -= Number(value);
  }

  userEntry.entries.push(newEntry);

  await ENTRIES_COLLECTION.updateOne(
    { name: user.name },
    { $set
      : { balance: userEntry.balance, entries: userEntry.entries },
    },
  );


  
  // send status
  res.status(200).send("Entry created");
});

app.get("/entries", async (req, res) => {
  const { authorization } = req.headers;
  const token = authorization?.replace("Bearer ", "");
  if (!token) return res.status(422).send("Informe o token!");
  console.log(token);
  // check if token is valid
  const user = await SESSIONS_COLLECTION.findOne({
    token,
  }).catch((err) => {
    console.log("Erro no findOne", err.message);
    return res.status(500).send("Internal server error");
  });
  if (!user) {
    return res.status(401).send("Token inválido");
  }

  // get entries
  const userEntry = await ENTRIES_COLLECTION.findOne(
    { name: user.name },
  );

  // send status and entries
  res.status(200).send(userEntry);
});







  













const port = 5000;
app.listen(port, () => console.log(`Server running in port: ${port}`));
