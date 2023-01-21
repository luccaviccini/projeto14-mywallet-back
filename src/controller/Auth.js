import bcrypt from "bcrypt";
import { v4 as uuidV4 } from "uuid";
import db from "../config/database.js";
import joi from "joi";


const USERS_COLLECTION = db.collection("users");
const SESSIONS_COLLECTION = db.collection("sessions");
const ENTRIES_COLLECTION = db.collection("entries");

export async function registerUser(req,res) {
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
  }).catch((err) => {
    console.log("Erro no findOne", err.message);
    return res.status(500).send("Internal server error");
  });
  if (user) {
    return res.status(400).send("Email or name already in use");
  }

  // hash password
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

  // create user
  await USERS_COLLECTION.insertOne({
    name,
    email,
    password: hashedPassword,
  });

  await ENTRIES_COLLECTION.insertOne({
    name,
    balance: 0,
    entries: [],
  });

  // send status and token
  res.status(200).send("User created");

}

export async function loginUser(req,res) {
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
  const user = await USERS_COLLECTION.findOne({
    email,
  }).catch((err) => {
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

  const session = {
    name: user.name,
    email: user.email,
    token,
  };

  // create session
  await SESSIONS_COLLECTION.insertOne(session);

  // send status and token
  res.status(200).send(session);
}

