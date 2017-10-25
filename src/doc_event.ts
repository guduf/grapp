import { Subject } from 'rxjs/Subject';

export type DocEventType = 'insert'|'update'|'remove';

export class DocEvent {
  constructor(
    public doc: string,
    public kind: DocEventType,
    public ids: string[] = null
  ) {
    if (!doc) throw new Error('Doc missing');
    if (['insert', 'update', 'remove'].indexOf(this.kind) < 0) throw new Error('Invalid kind');
  }
}


export class DocEvents extends Subject<DocEvent> {
  nextInsert(docSelector: string, ...ids: string[]) {
    const event = new DocEvent(docSelector, 'insert', ids);
    Subject.prototype.next.call(this, event);
  }
  nextUpdate(docSelector: string, ...ids: string[]) {
    const event = new DocEvent(docSelector, 'update', ids);
    Subject.prototype.next.call(this, event);
  }
  nextRemove(docSelector: string, ...ids: string[]) {
    const event = new DocEvent(docSelector, 'remove', ids);
    Subject.prototype.next.call(this, event);
  }
  next(e: DocEvent) {
    if (!(e instanceof DocEvent)) throw new TypeError('Value must be DocEvent');
    Subject.prototype.next.call(this, e);
  }
}
