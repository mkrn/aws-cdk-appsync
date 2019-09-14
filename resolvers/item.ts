import { LambdaEvent } from "./types";
import AWS = require("aws-sdk");

const docClient = new AWS.DynamoDB.DocumentClient({
  convertEmptyValues: true
});

const TABLE_NAME = process.env.TABLE_NAME;

exports.handler = async (event: LambdaEvent) => {
  if (!TABLE_NAME) throw new Error("Table Name is not defined in environment");

  console.log(JSON.stringify(event));
  const { context } = event;
  const { arguments: args } = context;

  // item id is in context
  const { Item } = await docClient
    .get({
      TableName: TABLE_NAME,
      Key: {
        id: args.id
      }
    })
    .promise();

  console.log(Item);

  return Item;
};
export {};
