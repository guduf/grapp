import { Subject } from 'rxjs/Subject';
export declare type DocEventType = 'insert' | 'update' | 'remove';
export declare class DocEvent {
    doc: string;
    kind: DocEventType;
    ids: string[];
    userId: string;
    constructor(doc: string, kind: DocEventType, ids?: string[], userId?: string);
}
export declare class DocEvents extends Subject<DocEvent> {
    nextInsert(docSelector: string, ...ids: string[]): void;
    nextUpdate(docSelector: string, ...ids: string[]): void;
    nextRemove(docSelector: string, ...ids: string[]): void;
    next(e: DocEvent): void;
}
