import { json } from 'body-parser';
import * as express from 'express';
import { graphqlExpress, graphiqlExpress } from 'graphql-server-express';

import { bootstrapGrapp, Grapp, } from '../../dist/core';
import { AuthorType, AuthorsQuery, AuthorService, MeQuery } from './author';
import { Todo, TodoMutationsType, TodoQuery, TodoService, TodosMutation, TodoType } from './todo';

interface Context { userId: string; }

@Grapp({
  schemaUrl: 'schema.gql',
  operations: [MeQuery, AuthorsQuery, TodoQuery, TodosMutation],
  types: [AuthorType, TodoType, TodoMutationsType],
  providers: [AuthorService, TodoService]
})
class AppGrapp { }

bootstrapGrapp(AppGrapp).then(
  data => {
    const app = express();
    app.use('/graphql', json(), (req, res, next) => {
      const context: { [key: string]: any } = {userId: req.query['user']};
      graphqlExpress({...data, context})(req, res, next);
    });
    app.use('/graphiql', graphiqlExpress({endpointURL: '/graphql'}));
    app.listen(3000, () => console.log('listen on 3000'));
  },
  err => console.error(err)
);
