import { generate as shortid } from 'shortid';
import { DataFieldMeta, DataFieldRef } from './data_fields';
import { Collection } from './db';
import {
  COLLECTION,
  CREATE_DOC,
  CreateDoc,
  PAYLOAD,
  REMOVE_DOC,
  RemoveDoc,
  UPDATE_DOC,
  UpdateDoc,
  VALIDATE_DOC,
  ValidateDoc
} from './di';
import { DOC_DATA, DocMeta, DocOpeMeta} from './doc';
import { FieldMeta, mapFieldMeta } from './fields';
import { GrappRef } from './grapp_ref';
import { getTypeMeta, TypeInstance, TypeTarget } from './type';
import { TypeRef } from './type_ref';
import { validate } from './validators';

export class DocRef<I = TypeInstance> extends TypeRef {
  collection: Collection;

  constructor(public grappRef: GrappRef, public target: TypeTarget, public meta: DocMeta) {
    super(grappRef, target, meta);
    this.collection = this.grappRef.root.db.collection(this.meta.collectionName);
  }

  instanciate<I extends TypeInstance = TypeInstance>(payload: { id: string }): I {
    if (!payload || !payload.id) throw new Error('Instanciate doc requires a payload with id member');
    const injector = this.injector.resolveAndCreateChild([
      {provide: COLLECTION, useValue: this.collection},
      {provide: PAYLOAD, useValue: payload}
    ]);
    const instance = <I>injector.resolveAndInstantiate(this.target);
    instance[DOC_DATA] = {id: payload.id};
    for (const [key, fieldRef] of this.fields)
      if (fieldRef.defineProperty) fieldRef.defineProperty(instance);
    return instance;
  }
}

export class DocOpeRef<I = TypeInstance> extends TypeRef {
  targetMeta: DocMeta;
  targetFields: Map<string, FieldMeta>;
  collection: Collection;

  constructor(public grappRef: GrappRef, public target: TypeTarget, public meta: DocOpeMeta) {
    super(grappRef, target, meta);
    this.targetMeta = getTypeMeta<DocMeta>(this.meta.docTarget());
    this.targetFields = mapFieldMeta(this.meta.docTarget);
    this.collection = this.grappRef.root.db.collection(this.targetMeta.collectionName);
  }

  instanciate(): TypeInstance {
    const injector = this.injector.resolveAndCreateChild([
      {provide: COLLECTION, useValue: this.collection},
      {provide: CREATE_DOC, useValue: <CreateDoc>(args) => this._createDoc(args)},
      {provide: REMOVE_DOC, useValue: <RemoveDoc>(args) => this._removeDoc(args)},
      {provide: UPDATE_DOC, useValue: <UpdateDoc>(args) => this._updateDoc(args)},
      {provide: VALIDATE_DOC, useValue: <ValidateDoc>(candidate) => this._validateDoc(candidate)}
    ]);
    const instance: TypeInstance = injector.resolveAndInstantiate(this.target);
    for (const [key, fieldRef] of this.fields)
      if (fieldRef.defineProperty) fieldRef.defineProperty(instance);
    return instance;
  }

  private async _createDoc({candidate}: { candidate: { [key: string]: any } }): Promise<TypeInstance> {
    let body: { [key: string]: any } = {};
    for (const [fieldName, fieldMeta] of this.targetFields) if (fieldMeta instanceof DataFieldMeta) {
      const value = candidate[fieldName];
      if (fieldMeta.inputable) {
        if (fieldMeta.required && typeof value  === 'undefined')
          throw new Error('Required field: ' + fieldName);
        if (typeof value  !== 'undefined') {
          try {
            if (fieldMeta.isArray) {
              if (!Array.isArray(value)) throw new TypeError(`${this.targetMeta.selector}[${fieldName}]: Invalid Array`)
              for (const val of value) validate(val, ...fieldMeta.validators);
            }
            else validate(value, ...fieldMeta.validators);
          }
          catch (err) { throw new Error(`${this.targetMeta.selector}[${fieldName}]: ${err.message}`)}

          body[fieldName] = value;
        }
      }
    }
    const id = body['id'] || shortid();
    await this.collection.insertOne({...body, id});
    return this.grappRef.root.typer(this.targetMeta.selector, {id});
  }

  private async _removeDoc({id}: { id: string }): Promise<boolean> {
    const data: { result: { n: number } } = await this.collection.remove({id});
    return Boolean(data.result.n);
  }

  private async _updateDoc({id, update}: { id: string, update: { [key: string]: any } }): Promise<TypeInstance> {
    let body: { [key: string]: any } = {};
    for (const [fieldName, fieldMeta] of this.targetFields) if (fieldMeta instanceof DataFieldMeta) {
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
          catch (err) { throw new Error(`${this.targetMeta.selector}[${fieldName}]: ${err.message}`)}
          body[fieldName] = value;
        }
      }
    }
    await this.collection.updateOne({id}, {$set: body});
    return this.grappRef.root.typer(this.targetMeta.selector, {id});
  }

  private _validateDoc(candidate: { [key: string]: any }): { [key: string]: any } {
    const body: { [key: string]: any } = {};
    for (const [fieldName, fieldMeta] of this.targetFields) if (fieldMeta instanceof DataFieldMeta) {
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
        catch (err) { throw new Error(`${this.targetMeta.selector}[${fieldName}]: ${err.message}`)}
        body[fieldName] = value;
      }
    }
    return body;
  }
}
