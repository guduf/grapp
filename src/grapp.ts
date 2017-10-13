import { Provider } from './di';
import { defineMeta, getMeta } from './meta';
import { TypeTarget } from './type';

export type GrappTarget = any;

export interface GrappContext {

}

export interface GrappParams {
  imports?: GrappTarget[]
  types?: TypeTarget[]
  providers?: Provider[]
  schema?: string,
}

export class GrappMeta implements GrappParams {
  imports: GrappTarget[]
  types: TypeTarget[]
  providers: Provider[]
  schema?: string

  constructor(public target: GrappTarget, params: GrappParams) {
    this.imports = params.imports || [];
    this.providers = params.providers || [];
    this.types = params.types || [];
    this.schema = params.schema;
  }
}

const GRAPP_META = Symbol('GRAPP_META');

export function decorateGrapp(params: GrappParams): ClassDecorator {
  return function grappDecorator(target: GrappTarget) {
    const meta = new GrappMeta(target, params);
    defineMeta(meta, GRAPP_META, target);
  }
}

export function getGrappMeta(target: GrappTarget): GrappMeta {
  return getMeta<GrappMeta>(GRAPP_META, target);
}
