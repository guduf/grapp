import { json } from 'body-parser';
import * as express from 'express';
import { graphqlExpress, graphiqlExpress } from 'graphql-server-express';

import {
  bootstrapGrapp,
  Grapp,
  ITypeBuilder,
  TypeBuilder,
  Query,
  Mutation,
  TypePayload,
  Type
} from '../../dist/core';
import { AuthorType, AuthorService } from './author';
import { TodoType, TodoService, Todo } from './todo';

interface Context { userId: string; }

@Query({selector: 'me'})
class MeQuery {
  constructor(
    @TypeBuilder('Author') private _authorBuilder: ITypeBuilder<AuthorType>
  ) { }
  resolve(args: {}, {userId}: {userId?: string}) {
    if (!userId) throw new Error('Not Identified');
    return this._authorBuilder(userId);
  }
}

@Query({selector: 'authors'})
class AuthorsQuery {
  constructor(
    private _service: AuthorService,
    @TypeBuilder('Author') private _authorBuilder: ITypeBuilder<AuthorType>
  ) { }
  resolve() {
    return [...this._service.values()].map(author => this._authorBuilder(author));
  }
}

@Query({selector: 'todos'})
class TodoQuery {
  constructor(
    private _service: TodoService,
    @TypeBuilder('Todo') private _todoBuilder: ITypeBuilder<TodoType>
  ) { }
  resolve() {
    return [...this._service.values()].map(todo => this._todoBuilder(todo));
  }
}

@Type()
export class TodoMutationsType {
  private _authorId: string;
  constructor(
    private _service: TodoService,
    @TypePayload() payload?: {authorId: string}
  ) {
    if (payload && payload.authorId) this._authorId = payload.authorId;
  }
  create({text}: {text: string}): Todo {
    const todo = this._service.create(text, this._authorId);
    return todo;
  }
  complete({id}, {id: string}) {
    const todo = this._service.get(id);
    if (!todo) throw new Error('Todo not found');
    todo.completed = true;
    this._service.set(todo.id, todo);
    return todo;
  }
  remove({id}, {id: string}) {
    const todo = this._service.get(id);
    if (!todo) throw new Error('Todo not found');
    this._service.delete(todo.id);
    return true;
  }
}

@Mutation()
class TodosMutation {
  constructor(
    private _service: TodoService,
    @TypeBuilder('TodoMutations')
    private _todoMutationsBuilder: ITypeBuilder<TodosMutation>
  ) { }
  resolve(args: any, {userId}: {userId: string}) {
    return this._todoMutationsBuilder({authorId: userId})
  }
}

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
  console.error
);
