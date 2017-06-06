import { ITypeBuilder, Type, TypeBuilder, TypePayload } from '../../dist/core';

import { Todo, TodoService, TodoType } from './todo';

export class Author {
  id: string;
  name: string;
  constructor(c: Author) { Object.assign(this, c); }
}

export class AuthorService extends Map<string, Author> {
  constructor() {
    super();
    this.set('bruce', new Author({id: 'bruce', name: 'Bruce'}));
    this.set('diana', new Author({id: 'diana', name: 'Diana'}));
    this.set('clark', new Author({id: 'clark', name: 'Clark'}));
  }
}

@Type()
export class AuthorType {
  constructor(
    @TypePayload() payload: Author|string,
    private _service: AuthorService,
    @TypeBuilder('Todo')
    private _todoBuilder: ITypeBuilder<TodoType, Todo|string>,
    private _todoService: TodoService
  ) {
    if (payload instanceof Author) this._author = payload;
    else if (typeof payload !== 'string') throw new TypeError('Payload must be a Author or an ID');
    else this._author = this._service.get(payload);
    if (!this._author) throw new Error('Author not found with id: ' + <string>payload);
  }
  private _author: Author
  get id(): string { return this._author.id; }
  get name(): string { return this._author.name; }
  get todos(): TodoType[] {
    return [...this._todoService.values()]
      .filter(todo => todo.authorId === this._author.id)
      .map(todo => this._todoBuilder(todo));
  }
}
