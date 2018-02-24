import {
  buildASTSchema,
  DefinitionNode,
  DocumentNode,
  GraphQLResolveInfo,
  GraphQLSchema,
  FieldDefinitionNode,
  ObjectTypeDefinitionNode,
  NamedTypeNode,
  NonNullTypeNode,
  GraphQLFieldResolver,
  Source as SchemaSource,
  parse as graphqlParse
} from 'graphql';

import { GrappRoot } from './root';
import { Injector, Provider } from './di';
import { FieldRef, FieldSubscriptionResolver } from './fields';
import { getTypeMeta, TypeInstance, TypeTarget, TypeMeta } from './type';
import { TypeRef } from './type_ref';
import { getGrappMeta, GrappMeta, GrappTarget } from './grapp';
import { capitalize } from '../lib/utils';

export class GrappRef<M extends GrappMeta = GrappMeta> {
  readonly typeRefs: MapsByTypeKind<TypeRef>
  readonly imports: GrappRef[];
  readonly injector: Injector;

  constructor(
    readonly root: GrappRoot,
    meta: M
  ) {
    this.imports = meta.imports.map(grappTarget => this.root.registerGrappRef(grappTarget));
    const providers = [...meta.providers];
    this.injector = this.root.injector.resolveAndCreateChild(providers);
    const {metas, sources} = parseGrappMeta(meta);
    const {types, nodes} = parseSchemaSource(...sources);
    this.typeRefs = this._mapDefinitions(types, metas);
  }

  private _mapDefinitions(
    definitions: MapsByTypeKind<ObjectTypeDefinitionNode>,
    metas: Map<string, TypeMeta>
  ): MapsByTypeKind<TypeRef> {
    const refs: MapsByTypeKind<TypeRef>= {};
    for (const typeKind of Object.keys(definitions)) {
      refs[typeKind] = new Map();
      for (const [selector, definition] of definitions[typeKind]) {
        const meta = metas.get(selector);
        if (!meta) throw new ReferenceError(
          `Failed to get type meta for type selector: '${selector}'`
        );
        let typeRef: TypeRef;
        try { typeRef = new meta.TypeRefClass(this, meta, definition); }
        catch (catched) {
          console.error(catched);
          throw new Error(`Failed to instanciate type ref '${selector}': ${catched.message}`);
        }
        if (!(typeRef instanceof TypeRef)) throw new TypeError(
          `Type reference with selector '${selector}' is not a instance of TypeRef`
        );
        refs[typeKind].set(selector, typeRef);
      }
    }
    return refs;
  }
}

export interface MapsByTypeKind<T> {
  type?: Map<string, T>
  query?: Map<string, T>
  mutation?: Map<string, T>
  subscription?: Map<string, T>
}

export function parseGrappMeta(meta: GrappMeta): {
  metas: Map<string, TypeMeta>
  sources: SchemaSource[]
} {
  const metas = new Map<string, TypeMeta>();
  const sources: SchemaSource[] = [];
  if (meta.source) sources.push(meta.source);
  for (const typeTarget of meta.types) {
    const meta = getTypeMeta(typeTarget);
    if (!(meta instanceof TypeMeta)) throw new ReferenceError(
      `Failed to get type meta for type target: ${typeTarget.name || typeTarget}`
    );
    if (metas.has(meta.selector)) throw new ReferenceError(
      `Duplicate meta type selector: '${meta.selector}'`
    )
    metas.set(meta.selector, meta);
    if (meta.source) sources.push(meta.source);
  }
  return {metas, sources};
}

export function parseSchemaSource(...sources: SchemaSource[]): {
  types: MapsByTypeKind<ObjectTypeDefinitionNode>
  nodes: DefinitionNode[]
} {
  const types = {};
  const nodes: DefinitionNode[] = [];
  for (const source of sources) {
    let document: DocumentNode;
    try { document = graphqlParse(source); }
    catch (catched) {
      console.error(catched);
      throw new Error(`Failed to parse source '${source.name}': ${catched.message}`);
    }
    for (const definition of document.definitions) {
      if (definition.kind !== 'ObjectTypeDefinition') nodes.push(definition);
      else {
        const name = definition.name.value;
        const OPERATIONS_TYPES = ['query', 'mutation', 'subscription', 'type'];
        for (const operationType of OPERATIONS_TYPES) {
          if (operationType === 'type')
            if (types['type'].has(name)) throw new ReferenceError(name);
            else types['type'].set(name, definition);
          if (name.match(new RegExp(`/\w+${capitalize(operationType)}$/`))) {
            if (!types[operationType]) (types[operationType] = new Map());
            if (!types[operationType].has(name)) throw new ReferenceError(name);
            types[operationType].set(name, definition);
            break;
          }
        }
      }
    }
  }
  return {types, nodes};
}
