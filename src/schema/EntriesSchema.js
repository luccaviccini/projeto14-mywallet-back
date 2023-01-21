import joi from "joi";

const EntriesSchema = joi.object({
  value: joi.number().min(1).required(),
  description: joi.string().min(1).required(),
  type: joi.string().valid("income", "expense").required()  
});


export default EntriesSchema;