import 'rxjs/add/observable/fromPromise';
import 'rxjs/add/observable/merge';
import 'rxjs/add/operator/do';
import 'rxjs/add/operator/filter';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/mergeMap';

import { Observer } from 'rxjs/Observer';
import { Observable } from 'rxjs/Observable';
import { generate as shortid } from 'shortid';

import { DataFieldMeta, DataFieldRef } from './data_fields';
import { Collection } from './db';
import { DOC_DATA, DocMeta, DocInstance, checkDocId } from './doc';
import {
  COLLECTION,
  DocMutation,
  DocQuery,
  DocSubscription,
  WatchFilter
} from './doc_di';
import { DocEvent } from './doc_event';
import { GrappTarget } from './grapp';
import { GrappRef } from './grapp_ref';
import { OperationKind } from './operation';
import { OperationRef } from './operation_ref';
import { Root } from './root';
import { TypeTarget } from './type';
import { TypeRef } from './type_ref';
import { capitalize } from './utils';
import { validate, Validators as Vlds } from './validators';

export class DocRef<D = DocInstance> extends GrappRef<DocMeta> {
  constructor(root: Root, target: GrappTarget, meta: DocMeta) {
    super(root, target, meta);

    this.collection = this.root.db.collection(this.meta.collectionName);

    const docMutation: DocMutation<D> = {
      create: (candidate) => this._create(candidate),
      remove: id => this._remove(id),
      update: (id, update) => this._update(id, update),
      validate: (candidate) => this._validate(candidate)
    };
    const docQuery: DocQuery<D> = {
      find: query => this._find(query),
      findOne: query => this._findOne(query)
    };
    const docSubscription: DocSubscription<D> = {
      watch: (query, filter?) => this._watch(query, filter),
      watchOne: (query, filter?) => this._watchOne(query, filter)
    }
    this.injector = this.injector.resolveAndCreateChild([
      {provide: COLLECTION, useValue: this.collection},
      {provide: DocMutation, useValue: docMutation},
      {provide: DocQuery, useValue: docQuery},
      {provide: DocSubscription, useValue: docSubscription}
    ]);

    try { this.docTypeRef = new DocTypeRef(this, target, meta) } catch (err) {
      console.error(err);
      throw new Error('Cannot reference docTypeRef: ' + target.name || typeof target);
    }
    this.typeRefs.set(this.meta.selector, this.docTypeRef);
    const dataFields = new Map<string, DataFieldMeta>();
    for (const [fieldName, fieldRef] of this.docTypeRef.fields)
      if (fieldRef instanceof DataFieldRef) dataFields.set(fieldName, fieldRef.meta);
    this.dataFields = dataFields;
  }

  collection: Collection;
  dataFields: Map<string, DataFieldMeta>;
  docOperationRefs: Map<OperationKind, OperationRef>;
  docTypeRef: DocTypeRef<D>;

  get selector(): string { return this.docTypeRef.selector; }

  private async _create(candidate: { [key: string]: any }): Promise<D> {
    const id = candidate['id'] = (candidate['id'] || shortid());
    let body: { [key: string]: any } = {};
    for (const [fieldName, fieldMeta] of this.dataFields) {
      const value = candidate[fieldName];
      if (fieldMeta.inputable) {
        if (fieldMeta.required && typeof value  === 'undefined')
          throw new Error('Required field: ' + fieldName);
        if (typeof value  !== 'undefined') {
          try {
            if (fieldMeta.isArray) {
              if (!Array.isArray(value)) throw new TypeError(`${this.meta.selector}[${fieldName}]: Invalid Array`)
              for (const val of value) validate(val, ...fieldMeta.validators);
            }
            else validate(value, ...fieldMeta.validators);
          }
          catch (err) { throw new Error(`${this.meta.selector}[${fieldName}]: ${err.message}`)}

          body[fieldName] = value;
        }
      }
    }
    await this.collection.insertOne({...body, id});
    this.root.docEvents.nextInsert(this.selector, id);
    return this._instanciate(id);
  }

  private async _find(query: { [key: string]: any }): Promise<D[]> {
    const ids: { id: string }[] = await this.collection.find(query, {id: true}).toArray();
    return ids.map(({id}) => this._instanciate(id));
  }

  private async _findOne(query: { [key: string]: any }): Promise<D> {
    const ids: { id: string }[] = await this.collection.find(query, {id: true}).limit(1).toArray();
    return ids.length ? this._instanciate(ids[0].id) : null;
  }

  private async _remove(id: string): Promise<boolean> {
    const data: { result: { n: number } } = await this.collection.remove({id});
    this.root.docEvents.nextRemove(this.selector, id);
    return Boolean(data.result.n);
  }

  private async _update(id: string, update: { [key: string]: any }): Promise<D> {
    let body: { [key: string]: any } = {};
    for (const [fieldName, fieldMeta] of this.dataFields) if (fieldMeta instanceof DataFieldMeta) {
      const value = update[fieldName];
      if (fieldMeta.updatable) {
        if (typeof value  !== 'undefined') {
          try {
            if (fieldMeta.isArray) {
              if (!Array.isArray(value)) throw new TypeError('Invalid Array');
              for (const val of value) validate(val, ...fieldMeta.validators);
            }
            else validate(value, ...fieldMeta.validators);
          }
          catch (err) { throw new Error(`${this.meta.selector}[${fieldName}]: ${err.message}`)}
          body[fieldName] = value;
        }
      }
    }
    await this.collection.updateOne({id}, {$set: body});
    this.root.docEvents.nextUpdate(this.selector, id);
    return this._instanciate(id);
  }

  private _validate(candidate: { [key: string]: any }): { [key: string]: any } {
    const body: { [key: string]: any } = {};
    for (const [fieldName, fieldMeta] of this.dataFields) if (fieldMeta instanceof DataFieldMeta) {
      const value = candidate[fieldName];
      if (typeof value === 'undefined') {
        if (fieldMeta.required) throw new TypeError(`Required field [${fieldName}]`);
      } else {
        try {
          if (fieldMeta.isArray) {
            if (!Array.isArray(value)) throw new TypeError(`Invalid Array`);
            for (const val of value) validate(val, ...fieldMeta.validators);
          }
          else validate(value, ...fieldMeta.validators);
        }
        catch (err) { throw new Error(`${this.meta.selector}[${fieldName}]: ${err.message}`)}
        body[fieldName] = value;
      }
    }
    return body;
  }

  private _watch(query: { [key: string]: any }, filter?: WatchFilter): Observable<D[]> {
    return Observable.merge(
      Observable.fromPromise(this._find(query)),
      this.root.docEvents
        .mergeMap(e => {
          if (typeof filter !== 'function') return Promise.resolve(false);
          let filterResult = <Promise<boolean>>filter(e);
          if (!(filterResult instanceof Promise)) filterResult = Promise.resolve(filterResult);
          return filterResult.then(filtered => {
            if (typeof filtered !== 'boolean') throw new Error('WatchFilter must return a boolean');
            return filtered;
          })
        })
        .filter(filtered => !filtered)
        .mergeMap(() => this._find(query))
    );
  }

  private _watchOne(query: { [key: string]: any }, filter?: WatchFilter): Observable<D> {
    return Observable.merge(
      Observable.fromPromise(this._findOne(query)),
      this.root.docEvents
        .mergeMap(e => {
          if (typeof filter !== 'function') return Promise.resolve(false);
          let filterResult = <Promise<boolean>>filter(e);
          if (!(filterResult instanceof Promise)) filterResult = Promise.resolve(filterResult);
          return filterResult.then(filtered => {
            if (typeof filtered !== 'boolean') throw new Error('WatchFilter must return a boolean');
            return filtered;
          })
        })
        .filter(filtered => !filtered)
        .mergeMap(() => this._findOne(query))
    );
  }

  private _instanciate(id: string): D {
    return this.docTypeRef.instanciate({id});
  }
}

export class DocTypeRef<D = DocInstance> extends TypeRef<D, DocMeta> {
  constructor(grappRef: DocRef<D>, target: TypeTarget, meta: DocMeta) {
    super(grappRef, target, meta);
    if (!checkDocId(target)) throw new Error('TypeTarget has no been decorated with DocId');
    const idMeta = new DataFieldMeta(target, 'id', {
      required: true,
      inputable: true,
      updatable: false,
      validators: [Vlds.shortid], isArray: false
    });
    this.fields.set('id', new DataFieldRef(this, 'id', idMeta));
  }

  grappRef: DocRef<D>

  instanciate(payload: { id: string }): D {
    if (!payload || !payload.id) throw new Error('Instanciate doc requires a payload with id member');
    const instance: D = TypeRef.prototype.instanciate.call(this, payload);
    instance[DOC_DATA] = {id: payload.id};
    return instance;
  }
}
