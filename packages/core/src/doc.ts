import 'reflect-metadata';
import * as pluralize from 'pluralize';

import { DocFieldMeta, getFieldsMeta } from './doc_field';
import { TypeBuilder, Type, TypeParams, TypeTarget } from './type';

export class DocRef {
  meta: DocMeta;
  constructor(public target: DocTarget) {
    if (!(this.meta = getDocMeta(target)))
      throw new TypeError(`Cannot for meta for docTarget(${target.name})`);
  }
}

export type DocTarget = any;

export abstract class GenericDoc {
  id: Promise<string>;
}

export interface DocState {
  id: string;
  [key: string]: any
}

export interface DocParams {
  collection?: string;
}

export class DocMeta implements DocParams {
  collection: string;
  fields: Map<string, any>
}

const DOC_META_TOKEN = Symbol('DOC_META_TOKEN');

export function getDocMeta(docTarget: any): DocMeta {
  return Reflect.getMetadata(DOC_META_TOKEN, docTarget);
}

export abstract class DocTypePayload {
  db: Promise<void>;
  typeBuilder: TypeBuilder;
  meta: DocMeta;
  docState: { id: string; [key: string]: any };
}

export function Doc(params: DocParams = {}, filename?: string): ClassDecorator {
  return function docDecorator(docTarget: DocTarget) {
    let collection = params.collection;
    if (!collection) {
      const [, matched] = (docTarget.name || '').match(/^([A-Z][a-z]+)(?:Doc)?$/) || <RegExpMatchArray>[];
      if (!matched) throw new Error('You must provide a collection or respect the Doc pattern');
      collection = pluralize((<string>matched)[0].toLocaleLowerCase() + (<string>matched).slice(1));
    }
    const fields = getFieldsMeta(docTarget.prototype);
    if (!fields) throw new Error(`Cannot find fields meta for docTarget(${docTarget.name})`);
    const docMeta: DocMeta = {
      ...params,
      collection,
      fields
    };
    Reflect.defineMetadata(DOC_META_TOKEN, docMeta, docTarget);
  }
}

const DOC_TYPE_META = Symbol('DOC_TYPE_META');

export function getDocTypeMeta(typeTarget: TypeTarget): DocTarget {
  return Reflect.getMetadata(DOC_TYPE_META, typeTarget);
}

export function DocType(docTarget: DocTarget, params: TypeParams): ClassDecorator {
  return function (typeTarget: TypeTarget) {
    Reflect.defineMetadata(DOC_TYPE_META, docTarget, typeTarget);
    Type(params)(typeTarget);
  }
}
