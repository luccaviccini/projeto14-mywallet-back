import express from "express";
import { MongoClient, ObjectId } from "mongodb";
import dotenv from "dotenv";
import cors from "cors";
import joi from "joi";
import bcrypt from "bcrypt";
import { v4 as uuidV4 } from "uuid";

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

app.post("/login", async (req, res) => {
  const { email, password } = req.body;
  
  // check if email and password are valid
  const schema = joi.object({
    email: joi.string().email().required(),
    password: joi.string().min(1).required(),
  });
  const { error } = schema.validate({ email, password });
  if (error) {
    return res.status(400).send("Email or password is not valid");
  }

  // check if email exists
  const user = await USERS_COLLECTION
    .findOne({
      email,
    })
    .catch((err) => {
      console.log("Erro no findOne", err.message);
      return res.status(500).send("Internal server error");
    });
  if (!user) {
    return res.status(400).send("Email or password is not valid");
  }

  // check if password is correct
  const isPasswordCorrect = await bcrypt.compare(password, user.password);
  if (!isPasswordCorrect) {
    return res.status(400).send("Email or password is not valid");
  }

  // create token
  const token = uuidV4();

  // update user with token
  await USERS_COLLECTION.updateOne(
    {
      _id: ObjectId(user._id),
    },
    {
      $set: {
        token,
      },
    }
  );

  // send status and token
  res.status(200).send(token);

});

app.post("/register", async (req, res) => {
  const { name, email, password } = req.body;

  // check if email and password are valid
  const schema = joi.object({
    name: joi.string().min(1).required(),
    email: joi.string().email().required(),
    password: joi.string().min(1).required(),
  });

  const { error } = schema.validate({ name, email, password });
  if (error) {
    return res.status(422).send("Erro de validação de dados");
  }

  // check if email or name already exists
  const user = await USERS_COLLECTION.findOne({
    $or: [{ email }, { name }],
  })
    .catch((err) => {
      console.log("Erro no findOne", err.message);
      return res.status(500).send("Internal server error");
    })
    ;
  
  if (user) {
    return res.status(400).send("Email or name already in use");
  }

  // hash password
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

  // create token
  const token = uuidV4();

  // create user
  await USERS_COLLECTION.insertOne({
    name,
    email,
    password: hashedPassword,
    token,
  });

  // send status and token
  res.status(200).send(token);
});





  













const port = 5000;
app.listen(port, () => console.log(`Server running in port: ${port}`));
