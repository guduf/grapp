import { Collection, Db } from '@types/mongodb';

import { Inject, InjectionToken } from './di';
import { DocState, DocTarget, Doc, DocParams } from './doc';
import { DocStorageFactory } from './doc_storage';
import { validators as vld } from './doc_field';
import { DocRefs, DOC_REFS } from './doc_ref';

export const MongoDb = new InjectionToken('MongoDb');

export class MongoStorage implements DocStorageFactory {
  constructor(
    @Inject(MongoDb) private _db: Promise<Db>,
    @Inject(DOC_REFS) private _docRefs: DocRefs
  ) { }
  get db() { return this._db; }
  async collection(target: DocTarget): Promise<Collection> {
    const docRef = this._docRefs.get(target);
    if (!docRef) throw new ReferenceError(`Cannot find DocRef with DocTarget(${target.name})`);
    return (await this._db).collection(docRef.meta.collection);
  }
  async find(
    target: DocTarget, conditions: { [key: string]: any }, ...fields: string[]
    ): Promise<DocState[]> {
    const docRef = this._docRefs.get(target);
    const collection = (await this._db).collection(docRef.meta.collection);
    const _fields = {id: 1};
    for (const field of fields) if (field !== 'id') _fields[field] = 1;
    const raw = await collection.find<DocState>(conditions, _fields).toArray();
    if (typeof raw !== 'object') throw new Error('Raw data is not a object');
    const states = raw.map(raw => docRef.parseState(raw));
    return states;
  }
  async findOne(target: DocTarget, conditions: { [key: string]: any }, ...fields: string[]): Promise<DocState> {
    const docRef = this._docRefs.get(target);
    const collection = (await this._db).collection(docRef.meta.collection);
    const _fields: { [key: string]: 0|1 } = {id: 1};
    for (const field of fields) if (field !== 'id') _fields[field] = 1;
    const raw = await collection.findOne<DocState>(conditions, fields.length ? _fields : undefined);
    if (typeof raw !== 'object') throw new Error('Raw data is not a object');
    const state = docRef.parseState(raw);
    return state;
  }
}

export function MongoDoc(params: DocParams = {}): ClassDecorator {
  return target => Doc({...params, storage: MongoStorage})(target);
}
