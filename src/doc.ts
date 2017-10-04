import { Provider } from './di';
import { DocRef } from './doc_ref';
import { GrappContext } from './grapp';
import { defineMeta, getMeta } from './meta';

export type DocTarget = any;

export interface DocInstance {
  id?: Promise<string>
  [key: string]: any
}

export interface DocContext<D extends DocInstance = DocInstance> extends GrappContext {
  docRef: DocRef<D>
}

export interface DocParams {
  providers?: Provider[]
  schema: string
  selector?: string
}

export class DocMeta implements DocParams {
  providers: Provider[];
  schema: string;
  selector: string;

  constructor(params: DocParams) {
    this.providers  = params.providers || [];
    this.schema = params.schema;
    this.selector = params.selector;
  }
}

const DOC_META = Symbol('DOC_META');

export function decorateDoc(params: DocParams): ClassDecorator {
  if (typeof params !== 'object') throw new TypeError();
  return function docDecorator(target: DocTarget) {
    if (!params.selector) params.selector = target.name;
    defineMeta(params, DOC_META, target);
  }
}

export function getDocMeta(target: DocTarget): DocMeta {
  return getMeta<DocMeta>(DOC_META, target);
}
