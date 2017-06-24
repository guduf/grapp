import 'reflect-metadata';
import * as pluralize from 'pluralize';

import { DocStorageFactoryTarget } from './doc_storage';
import { DocFieldMeta, getFieldsMeta, validators as vld, validate } from './doc_field';
import { TypeBuilder, Type, TypeParams, TypeTarget } from './type';

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
  storage?: DocStorageFactoryTarget;
}

export class DocMeta implements DocParams {
  collection: string;
  fields: Map<string, DocFieldMeta>
  storage: DocStorageFactoryTarget;
  target: DocTarget;
}

const DOC_META_TOKEN = Symbol('DOC_META_TOKEN');

export function getDocMeta(docTarget: any): DocMeta {
  return Reflect.getMetadata(DOC_META_TOKEN, docTarget);
}

export function Doc(
  params: DocParams & { storage: DocStorageFactoryTarget }, filename?: string
): ClassDecorator {
  return function docDecorator(target: DocTarget) {
    let collection = params.collection;
    if (!collection) {
      const [, matched]: [void, string] =
        (target.name || '').match(/^([A-Z][a-z]+)(?:Doc)?$/) || <RegExpMatchArray>[];
      if (!matched) throw new Error('You must provide a collection or respect the Doc pattern');
      collection = pluralize((matched)[0].toLocaleLowerCase() + (matched).slice(1));
    }
    const fields = getFieldsMeta(target.prototype);
    if (!fields) throw new Error(`Cannot find fields meta for docTarget(${target.name})`);
    if (!params.storage) throw new Error('Storage not specified');
    const docMeta: DocMeta = {
      ...<DocParams & { storage: DocStorageFactoryTarget }>params,
      collection,
      fields,
      target
    };
    Reflect.defineMetadata(DOC_META_TOKEN, docMeta, target);
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

