import cdk = require("@aws-cdk/core");
import { CfnGraphQLApi } from "@aws-cdk/aws-appsync";
import lambda = require("@aws-cdk/aws-lambda");
import { Resolver } from "./resolver";
import { Role, PolicyStatement } from "@aws-cdk/aws-iam";

export interface ResolverDescription {
  handler: string;
  environment?:
    | {
        [key: string]: any;
      }
    | undefined;
}

export interface ResolverDescriptions {
  [key: string]: ResolverDescription;
}

export interface ResolversProps {
  resolvers: ResolverDescriptions;
  graphQLAPI: CfnGraphQLApi;
  lambdaPolicies: PolicyStatement[];
}

export class Resolvers extends cdk.Construct {
  constructor(scope: cdk.Construct, id: string, props: ResolversProps) {
    super(scope, id);

    const { resolvers, graphQLAPI, lambdaPolicies } = props;

    Object.keys(resolvers).map((field: string) => {
      const { handler, environment } = resolvers[field];

      new Resolver(this, `Resolver_${field.replace(".", "_")}`, {
        field,
        handler,
        graphQLAPI,
        environment,
        lambdaPolicies
      });
    });
  }
}
