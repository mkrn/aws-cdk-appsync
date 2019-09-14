import cdk = require("@aws-cdk/core");
import path = require("path");
import {
  CfnGraphQLApi,
  CfnApiKey,
  CfnGraphQLSchema
} from "@aws-cdk/aws-appsync";
import { AttributeType } from "@aws-cdk/aws-dynamodb";
import iam = require("@aws-cdk/aws-iam");
import {
  Role,
  ServicePrincipal,
  ManagedPolicy,
  PolicyStatement
} from "@aws-cdk/aws-iam";
import { TableWithDataSource } from "./tableWithDataSource";
import { Resolvers, ResolverDescriptions } from "./resolvers";
import fs = require("fs");

export class CdkStack extends cdk.Stack {
  constructor(scope: cdk.App, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const graphQLAPI = new CfnGraphQLApi(this, "GraphQLApi", {
      name: "PerformanceTest",
      authenticationType: "API_KEY",
      additionalAuthenticationProviders: [
        {
          authenticationType: "AWS_IAM"
        }
      ]
    });

    const key = new CfnApiKey(this, "GraphQLApiApiKey", {
      apiId: graphQLAPI.attrApiId
    });

    new CfnGraphQLSchema(this, "Schema", {
      apiId: graphQLAPI.attrApiId,
      definition: fs.readFileSync(
        path.join(__dirname, "../assets/schema.graphql"),
        "utf8"
      )
    });

    // Role for DynamoDb Data Sources
    const appSyncRole = new Role(this, "GraphQLApiItemsDynamoDBRole", {
      assumedBy: new ServicePrincipal("appsync.amazonaws.com"),
      managedPolicies: [
        ManagedPolicy.fromAwsManagedPolicyName("AmazonDynamoDBFullAccess")
      ]
    });

    // Table with DynamoDB data source and optional trigger
    const items = new TableWithDataSource(this, "GraphQLApiTestItemsTable", {
      tableName: "TestItems",
      partitionKey: {
        name: "id",
        type: AttributeType.STRING
      },
      awsRegion: this.region,
      appSyncRole,
      graphQLAPI
    });

    // TODO: restrict access and add ability to overwrite policies per resolver
    const dynamoDBFullAccess = new PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: ["dynamodb:*"],
      resources: ["*"]
    });

    new Resolvers(this, "GraphQLResolvers", {
      graphQLAPI,
      lambdaPolicies: [dynamoDBFullAccess],
      resolvers: {
        "Query.items": {
          handler: "getItems.handler",
          environment: { TABLE_NAME: items.table.tableName }
        },
        "Query.item": {
          handler: "item.handler",
          environment: { TABLE_NAME: items.table.tableName }
        },
        "Mutation.addItem": {
          handler: "addItem.handler",
          environment: { TABLE_NAME: items.table.tableName }
        }
      } as ResolverDescriptions
    });

    new cdk.CfnOutput(this, "GraphQlEndpoint", {
      value: graphQLAPI.attrGraphQlUrl
    });

    new cdk.CfnOutput(this, "GraphQlAPIKey", {
      value: key.attrApiKey
    });
  }
}
