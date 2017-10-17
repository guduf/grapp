import { Provider } from './di';
import { DocOpeRef, DocRef } from './doc_ref';
import { mapFieldMeta } from './fields';
import { defineMeta, getMeta } from './meta';
import { plural } from 'pluralize';
import {
  getTypeMeta,
  setTypeMeta,
  TypeInstance,
  TypeMeta,
  TypeParams,
  TypeTarget
} from './type';
import { TypeRef } from './type_ref';

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
    super(target, params, DocRef);
    if (params.collectionName) this.collectionName = params.collectionName;
    else if (!target.name) throw new Error('None collectionName was specified and target as no name property');
    else this.collectionName = plural((<string>target.name)[0].toLocaleLowerCase() + (<string>target.name).slice(1));
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
    super(target, params, DocOpeRef);
    this.docTarget = params.docTarget;
  }
}

export function decorateDocOpe(params: DocOpeParams): ClassDecorator {
  return function docOpeDecorator(target: TypeTarget) {
    setTypeMeta(target, new DocOpeMeta(target, params));
  }
}
