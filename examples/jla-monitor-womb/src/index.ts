import * as WebSocket from 'ws';

import { json } from 'body-parser';
import * as express from 'express';
import { execute, subscribe } from 'graphql';
import { PubSub } from 'graphql-subscriptions';
import { graphqlExpress, graphiqlExpress } from 'graphql-server-express';
import { createServer } from 'http';
import { connect as mongodb } from 'mongodb';
import { SubscriptionServer } from 'subscriptions-transport-ws';

import { bootstrapGrapp } from '../../../lib';
import { AppGrapp } from './App.grapp';

const MONGODB_URI = 'mongodb://127.0.0.1:27017/jla-monitor-womb';
const HTTP_PORT = 3000;
const WS_PORT = 5000;

(async function bootstrap() {
  const db = await mongodb(MONGODB_URI);
  const schema = bootstrapGrapp(AppGrapp, {db});
  const websocketServer = createServer((request, response) => {
    response.writeHead(404);
    response.end();
  });

  websocketServer.listen(WS_PORT, () => console.log(
    `Websocket Server is now running on ws://localhost:${WS_PORT}`
  ));

  const subscriptionServer = SubscriptionServer.create(
    {
      schema,
      execute,
      subscribe
    },
    {server: websocketServer, path: '/graphql'}
  );

  const app = express();
  app.use('/graphql', json(), graphqlExpress({
    schema
  }));
  app.use('/graphiql', graphiqlExpress({
    endpointURL: './graphql',
    subscriptionsEndpoint: `ws://localhost:${WS_PORT}/graphql`,
  }));

  app.listen(HTTP_PORT, () => console.log(
    `Http Server is now running on http://localhost:${HTTP_PORT}`
  ));
})().catch(err => console.error(err));
