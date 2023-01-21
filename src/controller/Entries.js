import bcrypt from "bcrypt";
import { v4 as uuidV4 } from "uuid";
import db from "../config/database.js";
import joi from "joi";

const USERS_COLLECTION = db.collection("users");
const SESSIONS_COLLECTION = db.collection("sessions");
const ENTRIES_COLLECTION = db.collection("entries");

export async function newEntry(req, res) {

 // get token from locals
  const { token } = res.locals.session;
  console.log("Aqui está o token: ",token);

  



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

} 

export async function getEntry(req, res) {
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
}