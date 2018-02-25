import { Provider } from './di';
import { defineMeta, getMeta } from './meta';
import { TypeTarget } from './type';
import { TypeRef } from './type_ref';
import { GrappRef } from './grapp_ref';
import { Source } from 'graphql';

export type GrappTarget = any;

export interface GrappParams {
  imports?: GrappTarget[]
  types?: TypeTarget[]
  operations?: TypeTarget[]
  providers?: Provider[]
  schema?: string
  resolvers?: { [key: string]: any }
}

export class GrappMeta implements GrappParams {
  readonly imports: GrappTarget[]
  readonly types: TypeTarget[]
  readonly providers: Provider[]
  readonly source?: Source
  readonly resolvers: { [key: string]: any }

  constructor(
    public target: GrappTarget,
    params: GrappParams,
    public ctor: typeof GrappRef = GrappRef
  ) {
    this.imports = Array.isArray(params.imports) ? params.imports : [];
    this.providers = Array.isArray(params.providers) ? params.providers : [];
    this.types = Array.isArray(params.types) ? params.types : [];
    this.resolvers = params.resolvers ? params.resolvers : {};
    if (this.source) (
     this.source = new Source(params.schema, `@${this.target.name}`)
    );
  }
}

const GRAPP_META = Symbol('GRAPP_META');

export function decorateGrapp(params: GrappParams): ClassDecorator {
  return function grappDecorator(target: GrappTarget) {
    const meta = new GrappMeta(target, params);
    setGrappMeta(target, meta);
  }
}

export function setGrappMeta(target: GrappTarget, meta: GrappMeta) {
  if (!(meta instanceof GrappMeta)) throw new TypeError(`meta is not a instance of TypeMeta: ${target.name || typeof target}`);
  defineMeta(meta, GRAPP_META, target);
}

export function getGrappMeta<M extends GrappMeta = GrappMeta>(target: GrappTarget): M {
  return getMeta<M>(GRAPP_META, target);
}
