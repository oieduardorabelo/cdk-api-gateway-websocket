import { APIGatewayProxyEvent } from "aws-lambda";

// Non-JSON messages are directed to the configured $default route
export const handler = async (event: APIGatewayProxyEvent) => {
  return {
    statusCode: 200,
    body: `Message should be JSON. Received: ${JSON.stringify(event.body)}`,
  };
};
