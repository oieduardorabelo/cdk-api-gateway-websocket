import * as path from "node:path";
import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import { WebSocketApi, WebSocketStage } from "@aws-cdk/aws-apigatewayv2-alpha";
import { WebSocketLambdaIntegration } from "@aws-cdk/aws-apigatewayv2-integrations-alpha";

type WebSocketApiStackProps = cdk.StackProps & {
  tableWebsocketConnections: cdk.aws_dynamodb.Table;
};

export class WebSocketApiStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: WebSocketApiStackProps) {
    super(scope, id, props);
    const { tableWebsocketConnections } = props;

    // ====================================================
    //
    // AWS Lambda Node.js functions handlers
    //
    // ====================================================
    function sharedLambdaProps(
      entryName: string
    ): cdk.aws_lambda_nodejs.NodejsFunctionProps {
      return {
        runtime: cdk.aws_lambda.Runtime.NODEJS_18_X,
        entry: getPathHandlers(entryName),
        environment: {
          AWS_NODEJS_CONNECTION_REUSE_ENABLED: "1",
          TABLE_WEBSOCKET_CONNECTIONS: tableWebsocketConnections.tableName,
        },
      };
    }
    const lambdaConnect = new cdk.aws_lambda_nodejs.NodejsFunction(
      this,
      "lambdaConnect",
      sharedLambdaProps("connect.ts")
    );
    tableWebsocketConnections.grantReadWriteData(lambdaConnect);

    const lambdaDisconnect = new cdk.aws_lambda_nodejs.NodejsFunction(
      this,
      "lambdaDisconnect",
      sharedLambdaProps("disconnect.ts")
    );
    tableWebsocketConnections.grantReadWriteData(lambdaDisconnect);

    const lambdaDefault = new cdk.aws_lambda_nodejs.NodejsFunction(
      this,
      "lambdaDefault",
      sharedLambdaProps("default.ts")
    );
    tableWebsocketConnections.grantReadWriteData(lambdaDefault);

    const lambdaBroadcastMessage = new cdk.aws_lambda_nodejs.NodejsFunction(
      this,
      "lambdaBroadcastMessage",
      sharedLambdaProps("broadcastMessage.ts")
    );
    tableWebsocketConnections.grantReadWriteData(lambdaBroadcastMessage);

    // ====================================================
    //
    // Amazon API Gateway Websocket API Definition
    //
    // ====================================================
    const webSocketApi = new WebSocketApi(this, "WebsocketApi");

    webSocketApi.addRoute("$connect", {
      integration: new WebSocketLambdaIntegration(
        "ConnectIntegration",
        lambdaConnect
      ),
    });

    webSocketApi.addRoute("$disconnect", {
      integration: new WebSocketLambdaIntegration(
        "DisconnectIntegration",
        lambdaDisconnect
      ),
    });

    webSocketApi.addRoute("$default", {
      integration: new WebSocketLambdaIntegration(
        "DefaultIntegration",
        lambdaDefault
      ),
    });

    webSocketApi.addRoute("broadcastMessage", {
      integration: new WebSocketLambdaIntegration(
        "BroadcastMessageIntegration",
        lambdaBroadcastMessage
      ),
    });

    // Allow lambdaBroadcastMessage to manage/interact
    // with connected websocket clients
    webSocketApi.grantManageConnections(lambdaBroadcastMessage);

    new WebSocketStage(this, "DevStage", {
      webSocketApi,
      stageName: "dev",
      autoDeploy: true,
    });

    new cdk.CfnOutput(this, "WebSocketApiId", {
      value: webSocketApi.apiId,
    });
    new cdk.CfnOutput(this, "WebSocketApiEndpoint", {
      value: webSocketApi.apiEndpoint,
    });
  }
}

function getPathHandlers(filename: string) {
  return path.join(__dirname, "..", "handlers", filename);
}
