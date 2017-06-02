import { json } from 'body-parser';
import * as express from 'express';
import { graphqlExpress, graphiqlExpress } from 'graphql-server-express';

import { Grapp, Type, bootstrapGrapp } from '../dist/core';

class NameService {
  getRandomName() {  return ['Paul', 'John', 'Peter'][Math.ceil(Math.random() * 3 - 1)]; }
}

@Type({})
class GreetingQuery {
  constructor(private nameService: NameService) { }
  hello() { return `Hello ${this.nameService.getRandomName()}!`; }
}

@Grapp({
  schemaUrl: 'schema.gql',
  types: [GreetingQuery],
  providers: [NameService]
})
class AppGrapp { }

bootstrapGrapp(AppGrapp).then(data => {
  const app = express();
  app.use('/graphql', json(), graphqlExpress(data));
  app.use('/graphiql', graphiqlExpress({
    endpointURL: '/graphql',
  }));
  app.listen(3000, () => console.log('listen on 3000'))
});
