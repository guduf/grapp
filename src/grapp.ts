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
  name?: string;
  providers?: Provider[]
  schema?: string
  resolvers?: { [key: string]: any }
}

export class GrappMeta implements GrappParams {
  readonly imports: GrappTarget[]
  readonly name: string;
  readonly types: TypeTarget[]
  readonly providers: Provider[]
  readonly source?: Source
  readonly resolvers: { [key: string]: any }

  constructor(
    readonly target: GrappTarget,
    {imports, name, providers, resolvers, schema, types}: GrappParams = {},
    readonly ctor: typeof GrappRef = GrappRef
  ) {
    if (name) this.name = name;
    else if (target.name) this.name = target.name;
    else throw new Error('Name is not defined');
    this.imports = Array.isArray(imports) ? imports : [];
    this.providers = Array.isArray(providers) ? providers : [];
    this.types = Array.isArray(types) ? types : [];
    this.resolvers = resolvers ? resolvers : {};
    if (schema) (
     this.source = new Source(schema, `@${this.name}`)
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
