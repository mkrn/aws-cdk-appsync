import cdk = require("@aws-cdk/core");
import {
  CfnGraphQLApi,
  CfnDataSource,
  CfnResolver
} from "@aws-cdk/aws-appsync";
import lambda = require("@aws-cdk/aws-lambda");

import {
  Role,
  PolicyStatement,
  Effect,
  ServicePrincipal
} from "@aws-cdk/aws-iam";

export interface ResolverProps {
  graphQLAPI: CfnGraphQLApi;
  handler: string;
  environment?:
    | {
        [key: string]: any;
      }
    | undefined;
  role?: Role;
  field: string;
  lambdaPolicies: PolicyStatement[];
}

export class Resolver extends cdk.Construct {
  public readonly lambda: lambda.Function;
  public readonly dataSource: CfnDataSource;
  public readonly role: Role;
  public readonly resolver: CfnResolver;

  constructor(scope: cdk.Construct, id: string, props: ResolverProps) {
    super(scope, id);

    const {
      graphQLAPI,
      handler,
      environment,
      role,
      field,
      lambdaPolicies
    } = props;

    const [typeName, fieldName] = field.split(".");

    if (!typeName || !fieldName) {
      throw new Error("Field should be in format of Type.field");
    }

    this.lambda = new lambda.Function(this, `Lambda`, {
      runtime: lambda.Runtime.NODEJS_8_10,
      code: lambda.Code.asset("resolvers"),
      handler,
      environment
    });

    lambdaPolicies.forEach((policy: PolicyStatement) =>
      this.lambda.addToRolePolicy(policy)
    );

    this.role =
      role ||
      new Role(this, `ResolverRole`, {
        assumedBy: new ServicePrincipal("appsync.amazonaws.com")
      });

    this.role.addToPolicy(
      new PolicyStatement({
        actions: ["lambda:InvokeFunction"],
        resources: [this.lambda.functionArn],
        effect: Effect.ALLOW
      })
    );

    this.dataSource = new CfnDataSource(this, `DataSource`, {
      apiId: graphQLAPI.attrApiId,
      name: `${id}Resolver`,
      type: "AWS_LAMBDA",
      lambdaConfig: {
        lambdaFunctionArn: this.lambda.functionArn
      },
      serviceRoleArn: this.role.roleArn
    });

    // Todo: add typename and fieldName automatically
    this.resolver = new CfnResolver(this, `Resolver`, {
      apiId: graphQLAPI.attrApiId,
      typeName,
      fieldName,
      dataSourceName: this.dataSource.name,
      requestMappingTemplate: `
        {
          "version": "2017-02-28",
          "operation": "Invoke",
          "payload": {
            "context": $utils.toJson($context)
          }
        }
      `,
      responseMappingTemplate: `$util.toJson($ctx.result)`
    });
    this.resolver.addDependsOn(this.dataSource);
  }
}
