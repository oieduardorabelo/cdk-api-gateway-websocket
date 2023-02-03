#!/usr/bin/env node
import "source-map-support/register";
import * as cdk from "aws-cdk-lib";
import { WebSocketApiStack } from "../lib/websocket-api-stack";
import { DynamoDbStack } from "../lib/dynamodb-stack";

const app = new cdk.App();

const dynamoDbStack = new DynamoDbStack(app, "DynamoDbStack");

const webSocketApiStack = new WebSocketApiStack(app, "WebSocketApiStack", {
  tableWebsocketConnections: dynamoDbStack.tableWebsocketConnections,
});
