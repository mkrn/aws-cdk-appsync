import { LambdaEvent } from "./types";
import AWS = require("aws-sdk");

const docClient = new AWS.DynamoDB.DocumentClient({
  convertEmptyValues: true
});

const TABLE_NAME = process.env.TABLE_NAME;

exports.getItems = async (event: LambdaEvent) => {
  if (!TABLE_NAME) throw new Error("Table Name is not defined in environment");

  console.log(JSON.stringify(event));

  const { Items } = await docClient
    .scan({
      TableName: TABLE_NAME
    })
    .promise();

  console.log(Items);

  return Items;
};
export {};
