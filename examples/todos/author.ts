import { Type, TypeBuilder, TypePayload, Query } from '../../dist/core';

import { TodoService, TodoType } from './todo';

export class Author {
  id: string;
  name: string;
  constructor(c: Author) { Object.assign(this, c); }
}

export class AuthorService {
  constructor() {
    this._map = new Map<string, Author>();
    this._map.set('bruce', new Author({id: 'bruce', name: 'Bruce'}));
    this._map.set('diana', new Author({id: 'diana', name: 'Diana'}));
    this._map.set('clark', new Author({id: 'clark', name: 'Clark'}));
  }
  get(id: string) {
    return new Author(this._map.get(id));
  }
  values() { return this._map.values(); }
  private _map: Map<string, Author>;
}

@Type()
export class AuthorType {
  constructor(
    @TypePayload() payload: Author|{id: string},
    private _service: AuthorService,
    private _typeBuilder: TypeBuilder,
    private _todoService: TodoService
  ) {
    if (payload instanceof Author) this._author = payload;
    else if (payload.id) {
      if (!(this._author = this._service.get(payload.id)))
        throw new Error('Author not found')
    }
    else {
      console.error('Invalid Author', payload);
      throw new Error('Invalid Author');
    };
  }
  private _author: Author
  id(): string { return this._author.id; }
  name(): string { return this._author.name; }
  todos(): TodoType[] {
    return [...this._todoService.values()]
      .filter(todo => todo.authorId === this._author.id)
      .map(todo => this._typeBuilder.build<TodoType>(TodoType, todo));
  }
}

@Query({selector: 'me'})
export class MeQuery {
  constructor(private _typeBuilder: TypeBuilder) { }
  query(args: {}, {userId}: {userId?: string}): AuthorType {
    if (!userId) throw new Error('Not Identified');
    return this._typeBuilder.build<AuthorType>(AuthorType, {id: userId});
  }
}

@Query({selector: 'authors'})
export class AuthorsQuery {
  constructor(
    private _service: AuthorService,
    private _typeBuilder: TypeBuilder
  ) { }
  query(): AuthorType[] {
    return [...this._service.values()]
      .map(author => this._typeBuilder.build<AuthorType>(AuthorType, author));
  }
}
