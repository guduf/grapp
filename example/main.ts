import * as express from 'express';

import { Grapp, Type, bootstrapGrapp } from '../dist/core';

@Type({})
class GreetingQuery {
  hello() { return 'hello world'; }
}

@Grapp({
  schemaUrl: 'schema.gql',
  types: [GreetingQuery]
})
class AppGrapp { }

bootstrapGrapp(AppGrapp).then(middleware => {
  const app = express();
  app.use('/graphql', middleware);
  app.listen(4000, () => {console.log('listen')});
});
