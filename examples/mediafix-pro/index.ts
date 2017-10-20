import { json } from 'body-parser';
import * as express from 'express';
import { graphqlExpress, graphiqlExpress } from 'graphql-server-express';
import { connect } from 'mongodb';

import { bootstrapGrapp, Grapp } from '../../lib';

import { MediafixUserGrapp } from './types/MediafixUser';
import { OrgaGrapp } from './types/Orga';
import { OrgaUserGrapp } from './types/OrgaUser';
import { TokenPurchaseGrapp } from './types/TokenPurchase';
import { TokenTaskGrapp } from './types/TokenTask';

const MONGODB_ENDPOINT = 'mongodb://127.0.0.1:27017/grapp-mediafix-pro'

@Grapp({
  imports: [OrgaGrapp, OrgaUserGrapp, TokenPurchaseGrapp, TokenTaskGrapp, MediafixUserGrapp],
  schema: `
    scalar Date

    enum UserGroup { mediafix organization }

    interface User {
      id: ID!
      email: String!
      firstName: String!
      lastName: String!
      group: UserGroup!
      lastConnection: Date
    }
  `
})
class AppGrapp { }

export async function bootstrapApp() {
  const db = await connect(MONGODB_ENDPOINT);
  const schema = await bootstrapGrapp(AppGrapp, {db});
  const app = express();
  app.use('/graphql', json(), graphqlExpress({schema}));
  app.use('/graphiql', graphiqlExpress({endpointURL: '/graphql'}));
  app.listen(3000, () => console.log('listen on 3000'))

}

bootstrapApp().then(null, console.error);
