import { Grapp, Type, bootstrapGrapp } from '../../dist/index';

import { json } from 'body-parser';
import * as express from 'express';
import { graphqlExpress, graphiqlExpress } from 'graphql-server-express';


class NameService {
  getRandomName() {  return ['Paul', 'John', 'Peter'][Math.ceil(Math.random() * 3 - 1)]; }
}

@Type()
class GreetingsQuery {
  constructor(private nameService: NameService) { }
  query() { return `Hello ${this.nameService.getRandomName()}!`; }
}

@Grapp({
  schema: `
    type GreetingsQuery {
      hello: String!
    }

    type Query {
      Greetings: GreetingsQuery!
    }
  `,
  types: [GreetingsQuery],
  providers: [NameService]
})
class AppGrapp { }

bootstrapGrapp(AppGrapp, {}).then(
  data => {
    const app = express();
    app.use('/graphql', json(), graphqlExpress(data));
    app.use('/graphiql', graphiqlExpress({endpointURL: '/graphql'}));
    app.listen(3000, () => console.log('listen on 3000'))
  },
  err => console.error(err)
);
