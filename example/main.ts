import * as express from 'express';

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

bootstrapGrapp(AppGrapp).then(middleware => {
  const app = express();
  app.use('/graphql', middleware);
  app.listen(4000, () => {console.log('listen')});
});
