import { DocRef, DocTypeRef } from './doc_ref';
import { defineMetaKey, mapMeta } from './meta';
import { GrappMeta, GrappParams, setGrappMeta } from './grapp';
import { GrappRef } from './grapp_ref';
import { TypeInstance, TypeMeta, TypeParams, TypeTarget } from './type';
import { TypeRef } from './type_ref';
import { uncapitalize, pluralize } from './utils';

export const DOC_DATA = Symbol('DOC_DATA');

export interface DocInstance {
  id?: Promise<string>
  [key: string]: any
}

export interface DocParams extends GrappParams, TypeParams {
  collectionName?: string;
  operations?: TypeTarget[];
  selector?: string
}

export class DocMeta extends GrappMeta implements TypeMeta {
  constructor(target: TypeTarget, params: DocParams) {
    super(target, params, <typeof GrappRef>DocRef);

    if (params.selector) this.selector = params.selector;
    else if (target.name) this.selector = target.name;
    else throw new Error('Selector is not defined');

    if (params.collectionName) this.collectionName = params.collectionName;
    else if (target.name) this.collectionName = uncapitalize(pluralize(this.selector));
    else throw new Error('None collectionName was specified and target as no name property');
  }

  collectionName: string;
  selector: string;
  TypeRefClass = <typeof TypeRef>DocTypeRef
}

export function decorateDoc(params: DocParams = {}): ClassDecorator {
  return function docDecorator(target: TypeTarget) {
    setGrappMeta(target, new DocMeta(target, params));
  }
}

const DOC_ID = Symbol('DOC_ID');

export const docDocIdDecorator: PropertyDecorator = function docDocIdDecorator(target: TypeTarget, key: 'id') {
  if (key !== 'id') throw new Error('DocId property must be named "id"');
  defineMetaKey({}, DOC_ID, target, key);
}

export function checkDocId(target: TypeTarget): boolean {
  return mapMeta(DOC_ID, target).has('id');
}

export interface DocOpeParams extends TypeParams {
  docTarget: TypeTarget
}
