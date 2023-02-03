import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import { WebSocketApi, WebSocketStage } from "@aws-cdk/aws-apigatewayv2-alpha";
import { WebSocketLambdaIntegration } from "@aws-cdk/aws-apigatewayv2-integrations-alpha";
// import * as sqs from 'aws-cdk-lib/aws-sqs';

export class InfraStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const tableWebsocketConnections = new cdk.aws_dynamodb.Table(
      this,
      "WebsocketConnections",
      {
        partitionKey: {
          name: "connectionId",
          type: cdk.aws_dynamodb.AttributeType.STRING,
        },
      }
    );

    const lambdaConnect = new cdk.aws_lambda_nodejs.NodejsFunction(
      scope,
      "lambdaConnect",
      {
        entry: "handlers/connect.ts",
        environment: {
          TABLE_WEBSOCKET_CONNECTIONS: tableWebsocketConnections.tableName,
        },
      }
    );
    tableWebsocketConnections.grantReadWriteData(lambdaConnect);

    const lambdaDisconnect = new cdk.aws_lambda_nodejs.NodejsFunction(
      scope,
      "lambdaDisconnect",
      {
        entry: "handlers/disconnect.ts",
        environment: {
          TABLE_WEBSOCKET_CONNECTIONS: tableWebsocketConnections.tableName,
        },
      }
    );
    tableWebsocketConnections.grantReadWriteData(lambdaDisconnect);

    const lambdaDefault = new cdk.aws_lambda_nodejs.NodejsFunction(
      scope,
      "lambdaDefault",
      {
        entry: "handlers/default.ts",
        environment: {
          TABLE_WEBSOCKET_CONNECTIONS: tableWebsocketConnections.tableName,
        },
      }
    );
    tableWebsocketConnections.grantReadWriteData(lambdaDefault);

    const lambdaBroadcastMessage = new cdk.aws_lambda_nodejs.NodejsFunction(
      scope,
      "lambdaBroadcastMessage",
      {
        entry: "handlers/broadcastMessage.ts",
        environment: {
          TABLE_WEBSOCKET_CONNECTIONS: tableWebsocketConnections.tableName,
        },
      }
    );
    tableWebsocketConnections.grantReadWriteData(lambdaBroadcastMessage);

    const webSocketApi = new WebSocketApi(this, "WebsocketApi", {
      connectRouteOptions: {
        integration: new WebSocketLambdaIntegration(
          "ConnectIntegration",
          lambdaConnect
        ),
      },
      disconnectRouteOptions: {
        integration: new WebSocketLambdaIntegration(
          "DisconnectIntegration",
          lambdaDisconnect
        ),
      },
      defaultRouteOptions: {
        integration: new WebSocketLambdaIntegration(
          "DefaultIntegration",
          lambdaDefault
        ),
      },
    });

    webSocketApi.addRoute("broadcastMessage", {
      integration: new WebSocketLambdaIntegration(
        "BroadcastMessageIntegration",
        lambdaBroadcastMessage
      ),
    });

    // Allow lambdaBroadcastMessage to manage/interact with connected websocket clients
    webSocketApi.grantManageConnections(lambdaBroadcastMessage);

    new WebSocketStage(this, "DevStage", {
      webSocketApi,
      stageName: "dev",
      autoDeploy: true,
    });

    // const connectionsArns = this.formatArn({
    //   service: "execute-api",
    //   resourceName: `${apiStage.stageName}/POST/*`,
    //   resource: webSocketApi.apiId,
    // });
    // lambdaBroadcastMessage.addToRolePolicy(
    //   new cdk.aws_iam.PolicyStatement({
    //     actions: ["execute-api:ManageConnections"],
    //     resources: [connectionsArns],
    //   })
    // );
  }
}
