import { Type, ITypeBuilder, TypeBuilder, TypePayload } from '../../dist/core';

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

export class TodoService extends Map<string, Todo> {
  constructor() {
    super();
    this.set('1', new Todo({
      id: '1',
      text: 'Eat a apple',
      completed: false
    }));
    this.set('2', new Todo({
      id: '2',
      text: 'Buy a wig',
      authorId: 'clark',
      completed: false
    }));
    this.set('3', new Todo({
      id: '3',
      text: 'Adopt a cat',
      authorId: 'bruce',
      completed: true
    }));
  }
  create(text: string, authorId?: string): Todo {
    const todo = {id: this.generateId(), text, authorId, completed: false};
    this.set(todo.id, new Todo(todo));
    return todo;
  }

  private generateId(): string {
    let id: string;
    let round = 0;
    while (!id) {
      const _id = ('todo' + Math.random()).replace('0.', '');
      if (!this.has(_id)) id = _id;
      if (round++ > 10) throw new Error('generateId fail');
    }
    return id;
  }
}

@Type()
export class TodoType {
  constructor(
    @TypePayload() payload: Todo|string,
    private _service: TodoService,
    @TypeBuilder('Author')
    private _authorBuilder: ITypeBuilder<AuthorType, Author|string>
  ) {
    if (payload instanceof Todo) this._todo = payload;
    else if (typeof payload !== 'string') throw new TypeError('Payload must be a Todo or an ID');
    else this._todo = this._service.get(payload);
    if (!this._todo) throw new Error('Todo not found with id: ' + <string>payload);
  }
  private _todo: Todo;
  get id(): string { return this._todo.id; }
  get author(): AuthorType {
    if (!this._todo.authorId) return;
    return this._authorBuilder(this._todo.authorId);
  }
  get text(): string { return this._todo.text; }
  get completed(): boolean { return this._todo.completed; }
}
