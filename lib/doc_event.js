"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Subject_1 = require("rxjs/Subject");
class DocEvent {
    constructor(doc, kind, ids = null, userId) {
        this.doc = doc;
        this.kind = kind;
        this.ids = ids;
        this.userId = userId;
        if (!userId) {
            const context = Zone.current.get('context');
            if (typeof context === 'object' &&
                typeof context.user === 'object' &&
                typeof context.user.id === 'string')
                this.userId = context.user.id;
        }
        if (!doc)
            throw new Error('Doc missing');
        if (['insert', 'update', 'remove'].indexOf(this.kind) < 0)
            throw new Error('Invalid kind');
    }
}
exports.DocEvent = DocEvent;
class DocEvents extends Subject_1.Subject {
    nextInsert(docSelector, ...ids) {
        this.next(new DocEvent(docSelector, 'insert', ids));
    }
    nextUpdate(docSelector, ...ids) {
        this.next(new DocEvent(docSelector, 'update', ids));
    }
    nextRemove(docSelector, ...ids) {
        this.next(new DocEvent(docSelector, 'remove', ids));
    }
    next(e) {
        if (!(e instanceof DocEvent))
            throw new TypeError('Value must be DocEvent');
        Subject_1.Subject.prototype.next.call(this, e);
    }
}
exports.DocEvents = DocEvents;
//# sourceMappingURL=doc_event.js.map