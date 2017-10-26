import { Subject } from 'rxjs/Subject';

export type DocEventType = 'insert'|'update'|'remove';

export class DocEvent {
  constructor(
    public doc: string,
    public kind: DocEventType,
    public ids: string[] = null,
    public userId?: string
  ) {
    if (!userId) {
      const context: { user: { id: string } } = Zone.current.get('context');
      if (
        typeof context === 'object' &&
        typeof context.user === 'object' &&
        typeof context.user.id === 'string'
      ) this.userId = context.user.id;
    }
    if (!doc) throw new Error('Doc missing');
    if (['insert', 'update', 'remove'].indexOf(this.kind) < 0) throw new Error('Invalid kind');
  }
}


export class DocEvents extends Subject<DocEvent> {
  nextInsert(docSelector: string, ...ids: string[]): void {
    this.next(new DocEvent(docSelector, 'insert', ids));
  }
  nextUpdate(docSelector: string, ...ids: string[]): void {
    this.next(new DocEvent(docSelector, 'update', ids));
  }
  nextRemove(docSelector: string, ...ids: string[]): void {
    this.next(new DocEvent(docSelector, 'remove', ids));
  }
  next(e: DocEvent): void {
    if (!(e instanceof DocEvent)) throw new TypeError('Value must be DocEvent');
    Subject.prototype.next.call(this, e);
  }
}
