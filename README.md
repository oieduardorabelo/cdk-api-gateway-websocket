# WebSocket API in Amazon API Gateway

CDK example of:

- WebSocket API using [Amazon API Gateway WebSocketApi Construct](https://docs.aws.amazon.com/cdk/api/v2/docs/@aws-cdk_aws-apigatewayv2-alpha.WebSocketApi.html)
- Using `$connect` and `$disconnect` routes to manage connected users
- Using `AWS.ApiGatewayManagementApi` to send message from backend to connected clients

Final architecture:

![](./docs/cdk-api-gateway-websocket.png)

Extra resources:

- [About WebSocket APIs in API Gateway](https://docs.aws.amazon.com/apigateway/latest/developerguide/apigateway-websocket-api-overview.html)
- [Managing connected users and client apps: $connect and $disconnect routes](https://docs.aws.amazon.com/apigateway/latest/developerguide/apigateway-websocket-api-route-keys-connect-disconnect.html)
- [Documentation of class: AWS.ApiGatewayManagementApi](https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/ApiGatewayManagementApi.html)
