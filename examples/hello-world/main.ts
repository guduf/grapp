import { json } from 'body-parser';
import * as express from 'express';
import { graphqlExpress, graphiqlExpress } from 'graphql-server-express';

import { Grapp, Query, bootstrapGrapp } from '../../dist/core';

class NameService {
  getRandomName() {  return ['Paul', 'John', 'Peter'][Math.ceil(Math.random() * 3 - 1)]; }
}

@Query()
class GreetingsQuery {
  constructor(private nameService: NameService) { }
  resolve() { return `Hello ${this.nameService.getRandomName()}!`; }
}

@Grapp({
  schemaUrl: 'schema.gql',
  operations: [GreetingsQuery],
  providers: [NameService]
})
class AppGrapp { }

bootstrapGrapp(AppGrapp).then(
  data => {
    const app = express();
    app.use('/graphql', json(), graphqlExpress(data));
    app.use('/graphiql', graphiqlExpress({endpointURL: '/graphql'}));
    app.listen(3000, () => console.log('listen on 3000'))
  },
  err => console.error(err)
);
