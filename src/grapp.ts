import { DocTarget } from './doc';
import { Provider } from './di';
import { defineMeta, getMeta } from './meta';

export type GrappTarget = any;

export interface GrappParams {
  docs?: DocTarget[]
  providers?: Provider[]
}

export class GrappMeta implements GrappParams {
  docs: DocTarget[]
  providers: Provider[]

  constructor(params: GrappParams) {
    this.docs = params.docs || [];
    this.providers = params.providers || [];
  }
}

const GRAPP_META = Symbol('GRAPP_META');

export function decorateGrapp(params: GrappParams): ClassDecorator {
  return function grappDecorator(target: GrappTarget) {
    const meta = new GrappMeta(params);
    defineMeta(meta, GRAPP_META, target);
  }
}

export function getGrappMeta(target: GrappTarget): GrappMeta {
  return getMeta<GrappMeta>(GRAPP_META, target);
}
