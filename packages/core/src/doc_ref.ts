import { InjectionToken } from './di';
import { DocMeta, DocState, DocTarget, getDocMeta } from './doc';
import { DocStorage, DocStorageFactory } from './doc_storage';
import { validate, validators as vld } from './doc_field';
// import { GrappRef } from './grapp_ref';

export class DocRef {
  meta: DocMeta;
  constructor(private _grapRef: any, public target: DocTarget) {
    if (!(this.meta = getDocMeta(target)))
      throw new TypeError(`Cannot for meta for docTarget(${target.name})`);
    try { this._storage = this._grapRef.injector.resolveAndInstantiate(this.meta.storage); }
    catch (err) { console.error(err); throw new Error('Failed to instanciate DocStorage'); }
  }
  parseState(input: DocState): DocState {
    const state = <DocState>{};
    if (typeof state !== 'object') throw new TypeError('State is not a object');
    try { state.id = validate(input.id, vld.shortid); } catch (err) {
      throw new Error(`Failed to parse docState (${this.meta.target.name}.id) ${err.message}`);
    }
    for (const [field, meta] of this.meta.fields) {
      if (typeof input[field] === 'undefined') state[field] = undefined;
      else try { state[field] = validate(input[field], ...meta.validators); } catch (err) {
        console.error(err);
        throw new Error(`Failed to parse docState (${this.meta.target.name}.${field}) : ${err.message}`);
      }
    }
    return Object.seal(state);
  }
  create(input: { [key: string]: any }): Promise<DocState> {
    return this._storage.create(this.meta.target, input);
  }
  find(conditions: { [key: string]: any } = {}, ...fields: string[]): Promise<DocState[]> {
    return this._storage.find(this.meta.target, conditions, ...fields);
  }
  findOne(conditions: { [key: string]: any } = {}, ...fields: string[]): Promise<DocState> {
    return this._storage.findOne(this.meta.target, conditions, ...fields);
  }
  remove(id: string): Promise<string> {
    return this._storage.remove(this.meta.target, id);
  }
  udpate(id: string, input: { [key: string]: any }): Promise<DocState> {
    return this._storage.update(this.meta.target, id, input);
  }
  get storage(): DocStorage {
    return {
      create: this.create.bind(this),
      find: this.find.bind(this),
      findOne: this.find.bind(this),
      remove: this.remove.bind(this),
      update: this.udpate.bind(this)
    }
  }
  private _storage: DocStorageFactory;
}

export const DOC_REFS = new InjectionToken('DOC_REFS');
export abstract class DocRefs { get(docTarget: DocTarget): DocRef { return; } }
