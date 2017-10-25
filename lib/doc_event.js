"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Subject_1 = require("rxjs/Subject");
class DocEvent {
    constructor(doc, kind, ids = null) {
        this.doc = doc;
        this.kind = kind;
        this.ids = ids;
        if (!doc)
            throw new Error('Doc missing');
        if (['insert', 'update', 'remove'].indexOf(this.kind) < 0)
            throw new Error('Invalid kind');
    }
}
exports.DocEvent = DocEvent;
class DocEvents extends Subject_1.Subject {
    nextInsert(docSelector, ...ids) {
        const event = new DocEvent(docSelector, 'insert', ids);
        Subject_1.Subject.prototype.next.call(this, event);
    }
    nextUpdate(docSelector, ...ids) {
        const event = new DocEvent(docSelector, 'update', ids);
        Subject_1.Subject.prototype.next.call(this, event);
    }
    nextRemove(docSelector, ...ids) {
        const event = new DocEvent(docSelector, 'remove', ids);
        Subject_1.Subject.prototype.next.call(this, event);
    }
    next(e) {
        if (!(e instanceof DocEvent))
            throw new TypeError('Value must be DocEvent');
        Subject_1.Subject.prototype.next.call(this, e);
    }
}
exports.DocEvents = DocEvents;
//# sourceMappingURL=doc_event.js.map