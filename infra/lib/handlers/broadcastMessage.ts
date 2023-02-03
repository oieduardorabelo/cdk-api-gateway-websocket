import { APIGatewayProxyEvent } from "aws-lambda";

import * as AWS from "aws-sdk";

const ddb = new AWS.DynamoDB.DocumentClient({
  apiVersion: "2012-08-10",
  region: process.env.AWS_REGION,
});

// Connected clients can post a message
// This message is going to be broadcasted to all connected clients with ApiGatewayManagementApi
export const handler = async (event: APIGatewayProxyEvent) => {
  let connectionData;

  const tableName = process.env.TABLE_WEBSOCKET_CONNECTIONS;

  if (!tableName) {
    throw new Error(
      "tableName not specified in process.env.TABLE_WEBSOCKET_CONNECTIONS"
    );
  }

  if (!event.body) {
    throw new Error("event body is missing");
  }

  let postData: JSON;
  try {
    postData = JSON.parse(event.body).data;
  } catch (error) {
    const e = error as AWS.AWSError;
    return { statusCode: 400, body: "Not valid JSON body", error: e.stack };
  }

  try {
    connectionData = await ddb
      .scan({ TableName: tableName, ProjectionExpression: "connectionId" })
      .promise();
  } catch (error) {
    const e = error as AWS.AWSError;
    return { statusCode: 500, body: e.stack };
  }

  const apigwManagementApi = new AWS.ApiGatewayManagementApi({
    apiVersion: "2018-11-29",
    endpoint:
      event.requestContext.domainName + "/" + event.requestContext.stage,
  });

  const postCalls = (connectionData.Items ?? []).map(
    async ({ connectionId }) => {
      try {
        await apigwManagementApi
          .postToConnection({ ConnectionId: connectionId, Data: postData })
          .promise();
      } catch (error) {
        const e = error as AWS.AWSError;
        if (e.statusCode === 410) {
          console.log(`Found stale connection, deleting ${connectionId}`);
          await ddb
            .delete({ TableName: tableName, Key: { connectionId } })
            .promise();
        } else {
          throw e;
        }
      }
    }
  );

  try {
    await Promise.all(postCalls);
  } catch (error) {
    const e = error as AWS.AWSError;
    return { statusCode: 500, body: e.stack };
  }

  return { statusCode: 200, body: "Data sent." };
};
