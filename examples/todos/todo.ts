import { Type, TypeBuilder, TypePayload, Query, Mutation } from '../../dist/core';

import { Author, AuthorService, AuthorType } from './author';

export class Todo {
  id: string;
  text: string;
  completed: boolean;
  authorId?: string;
  constructor(c: Todo) {
    Object.assign(this, c);
  }
}

export class TodoService {
  constructor() {
    this._map = new Map<string, Todo>();
    this._map.set('1', new Todo({
      id: '1',
      text: 'Eat a apple',
      completed: false
    }));
    this._map.set('2', new Todo({
      id: '2',
      text: 'Buy a wig',
      authorId: 'clark',
      completed: false
    }));
    this._map.set('3', new Todo({
      id: '3',
      text: 'Adopt a cat',
      authorId: 'bruce',
      completed: true
    }));
  }
  create(text: string, authorId?: string): Todo {
    const todo = new Todo({id: this.generateId(), text, authorId, completed: false});
    this._map.set(todo.id, todo);
    return todo;
  }
  delete(id: string) { return this._map.delete(id); }
  get(id: string) { return this._map.get(id); }
  set(id: string, todo: Todo) { return this._map.set(id, new Todo(todo)); }
  values() { return this._map.values(); }
  private _map: Map<string, Todo>;
  private generateId(): string {
    let id: string;
    let round = 0;
    while (!id) {
      const _id = ('todo' + Math.random()).replace('0.', '');
      if (!this._map.has(_id)) id = _id;
      if (round++ > 10) throw new Error('generateId fail');
    }
    return id;
  }
}

@Type()
export class TodoType {
  constructor(
    @TypePayload() payload: Todo,
    private _service: TodoService,
    private _typeBuilder: TypeBuilder
  ) {
    if (payload instanceof Todo) this._todo = payload;
    else throw new Error('Invalid Todo');
  }
  private _todo: Todo;
  id(): string { return this._todo.id; }
  author(): AuthorType {
    if (!this._todo.authorId) return;
    return this._typeBuilder.build<AuthorType>(AuthorType, {id: this._todo.authorId});
  }
  text(): string { return this._todo.text; }
  completed(): boolean { return this._todo.completed; }
}

@Query({selector: 'todos'})
export class TodoQuery {
  constructor(
    private _service: TodoService,
    private _typeBuilder: TypeBuilder
  ) { }
  query(): TodoType[] {
    return [...this._service.values()]
      .map(todo => this._typeBuilder.build<TodoType>(TodoType, new Todo(todo)));
  }
}

@Type()
export class TodoMutationsType {
  private _authorId: string;
  constructor(
    private _service: TodoService,
    private _typeBuilder: TypeBuilder,
    @TypePayload() payload?: {authorId: string},
  ) {
    if (payload && payload.authorId) this._authorId = payload.authorId;
  }
  create({text}: {text: string}): TodoType {
    const todo = this._service.create(text, this._authorId);
    console.log(`todo`, todo);
    return this._typeBuilder.build<TodoType>(TodoType, new Todo(todo));
  }
  complete({id}: {id: string}): TodoType {
    const todo = this._service.get(id);
    if (!todo) throw new Error('Todo not found');
    todo.completed = true;
    this._service.set(todo.id, todo);
    return this._typeBuilder.build<TodoType>(TodoType, new Todo(todo));
  }
  remove({id}, {id: string}): string {
    const todo = this._service.get(id);
    if (!todo) throw new Error('Todo not found');
    this._service.delete(todo.id);
    return id;
  }
}

@Mutation()
export class TodosMutation {
  constructor(
    private _service: TodoService,
    private _typeBuilder: TypeBuilder
  ) { }
  mutate(args: any, {userId}: {userId: string}) {
    return this._typeBuilder.build<TodoMutationsType>(TodoMutationsType, {authorId: userId})
  }
}
