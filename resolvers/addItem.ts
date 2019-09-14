import { LambdaEvent } from "./types";
import uuid = require("uuid/v4");
import AWS = require("aws-sdk");

const docClient = new AWS.DynamoDB.DocumentClient({
  convertEmptyValues: true
});

const TABLE_NAME = process.env.TABLE_NAME;

exports.handler = async (event: LambdaEvent) => {
  if (!TABLE_NAME) throw new Error("Table Name is not defined in environment");

  console.log(JSON.stringify(event));

  const {
    context: {
      arguments: { item }
    }
  } = event;

  const Item = {
    id: uuid(),
    ...item
  };

  await docClient
    .put({
      TableName: TABLE_NAME,
      Item
    })
    .promise();

  console.log(Item);

  return Item;
};
export {};
