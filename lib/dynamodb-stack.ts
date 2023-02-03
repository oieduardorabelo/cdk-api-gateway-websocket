import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";

export class DynamoDbStack extends cdk.Stack {
  tableWebsocketConnections: cdk.aws_dynamodb.Table;

  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    this.tableWebsocketConnections = new cdk.aws_dynamodb.Table(
      this,
      "WebsocketConnections",
      {
        partitionKey: {
          name: "connectionId",
          type: cdk.aws_dynamodb.AttributeType.STRING,
        },
      }
    );

    new cdk.CfnOutput(this, "WebsocketConnectionsTableName", {
      value: this.tableWebsocketConnections.tableName,
    });
    new cdk.CfnOutput(this, "WebsocketConnectionsTableArn", {
      value: this.tableWebsocketConnections.tableArn,
    });
  }
}
