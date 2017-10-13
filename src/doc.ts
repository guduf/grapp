import { DataFieldMeta } from './data_fields';
import {
  COLLECTION,
  Provider,
  CREATE_DOC,
  CreateDoc,
  PAYLOAD,
  REMOVE_DOC,
  RemoveDoc,
  UPDATE_DOC,
  UpdateDoc
} from './di';
import { mapFieldMeta } from './fields';
import { defineMeta, getMeta } from './meta';
import { plural } from 'pluralize';
import { generate as shortid } from 'shortid';
import {
  getTypeMeta,
  setTypeMeta,
  TypeInstance,
  TypeMeta,
  TypeParams,
  TypeTarget
} from './type';
import { TypeRef } from './type_ref';
import { validate } from './validators';

export const DOC_DATA = Symbol('DOC_DATA');

export interface DocInstance {
  id?: Promise<string>
  [key: string]: any
}

export interface DocParams extends TypeParams {
  collectionName?: string;
}

export class DocMeta extends TypeMeta implements DocParams {
  collectionName: string;

  constructor(target: TypeTarget, params: DocParams) {
    super(target, params);
    if (params.collectionName) this.collectionName = params.collectionName;
    else if (!target.name) throw new Error('None collectionName was specified and target as no name property');
    else this.collectionName = plural((<string>target.name)[0].toLocaleLowerCase() + (<string>target.name).slice(1));
    this.instanciate = this._instanciate;
  }

  private _instanciate<I extends TypeInstance = TypeInstance>(typeRef: TypeRef, payload: { id: string }): I {
    if (!payload || !payload.id) throw new Error('Instanciate doc requires a payload with id member');
    const collection = typeRef.grappRef.root.db.collection(this.collectionName);
    const injector = typeRef.injector.resolveAndCreateChild([
      {provide: COLLECTION, useValue: collection},
      {provide: PAYLOAD, useValue: payload}
    ]);
    const instance = <I>injector.resolveAndInstantiate(typeRef.target);
    instance[DOC_DATA] = {};
    return instance;
  }
}

export function decorateDoc(params: DocParams = {}): ClassDecorator {
  return function docDecorator(target: TypeTarget) {
    setTypeMeta(target, new DocMeta(target, params));
  }
}

export interface DocOpeParams extends TypeParams {
  docTarget: TypeTarget
}

export class DocOpeMeta extends TypeMeta {
  docTarget: TypeTarget;

  constructor(target: TypeTarget, params: DocOpeParams) {
    super(target, params);
    this.docTarget = params.docTarget;
    this.instanciate = this._instanciate;
  }

  private async _createDoc(
    typeRef: TypeRef,
    {candidate}: { candidate: { [key: string]: any } }
  ): Promise<TypeInstance> {
    const docMeta: DocMeta = getTypeMeta(this.docTarget);
    const collection = typeRef.grappRef.root.db.collection(docMeta.collectionName);
    const fields = mapFieldMeta(this.docTarget);
    if (!fields) throw new Error('Cannot map fields');
    let body: { [key: string]: any } = {};
    for (const [fieldName, fieldMeta] of fields) if (fieldMeta instanceof DataFieldMeta) {
      const value = candidate[fieldName];
      if (fieldMeta.inputable) {
        if (fieldMeta.required && typeof value  === 'undefined')
          throw new Error('Required field: ' + fieldName);
        if (typeof value  !== 'undefined') {
          validate(candidate[fieldName], ...fieldMeta.validators);
          body[fieldName] = value;
        }
      }
    }
    const id = shortid();
    await collection.insertOne({...body, id});
    return typeRef.grappRef.root.typer(docMeta.selector, {id});
  }

  private async _removeDoc(typeRef: TypeRef, {id}: { id: string }): Promise<void> {
    const docMeta: DocMeta = getTypeMeta(this.docTarget);
    const collection = typeRef.grappRef.root.db.collection(docMeta.collectionName);
    await collection.remove({id});
  }

  private async _updateDoc(
    typeRef: TypeRef,
    {id, update}: { id: string, update: { [key: string]: any } }
  ): Promise<TypeInstance> {
    const fields = mapFieldMeta(this.docTarget);
    console.log(`fields`, fields);
    throw new Error('Not implemented')
  }

  private _instanciate<I extends TypeInstance = TypeInstance>(typeRef: TypeRef): I {
    const docMeta: DocMeta = getTypeMeta(this.docTarget);
    const collection = typeRef.grappRef.root.db.collection(docMeta.collectionName);
    const injector = typeRef.injector.resolveAndCreateChild([
      {provide: COLLECTION, useValue: collection},
      {provide: CREATE_DOC, useValue: <CreateDoc>(args) => this._createDoc(typeRef, args)},
      {provide: REMOVE_DOC, useValue: <RemoveDoc>(args) => this._removeDoc(typeRef, args)},
      {provide: UPDATE_DOC, useValue: <UpdateDoc>(args) => this._updateDoc(typeRef, args)}
    ]);
    return <I>injector.resolveAndInstantiate(typeRef.target);
  }
}

export function decorateDocOpe(params: DocOpeParams): ClassDecorator {
  return function docOpeDecorator(target: TypeTarget) {
    setTypeMeta(target, new DocOpeMeta(target, params));
  }
}
