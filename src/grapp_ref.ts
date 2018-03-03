import {
  DefinitionNode,
  DocumentNode,
  ObjectTypeDefinitionNode,
  Source as SchemaSource,
  parse as graphqlParse,
  GraphQLSchema,
  buildASTSchema
} from 'graphql';
import { addResolveFunctionsToSchema } from 'graphql-tools';

import { Injector } from './di';
import { getGrappMeta, GrappMeta, GrappTarget } from './grapp';
import { getTypeMeta, TypeInstance, TypeTarget, TypeMeta } from './type';
import { TypeRef } from './type_ref';
import { capitalize } from './utils';
import { GrappRoot } from './root';

/** Represents a unique instance of grapp reference created during bootstrap. */
export class GrappRef<M extends GrappMeta = GrappMeta> {
  /** The injector relative to this grapp ref. */
  readonly injector: Injector
  /** The store of registred type references. */
  readonly typeRefs: MapsByTypeKind<TypeRef>
  /** The name of the Grapp ref */
  readonly name: string;
  /** The store of schema definitions nodes different than object type. */
  readonly nodes: Set<DefinitionNode>
  /** The store of schema definitions nodes different than object type. */
  readonly resolvers: { [key: string]: any };
  /**
   * Initialize a grapp reference.
   * @param root The grapp root.
   * @param meta The meta of the grapp.
   */
  constructor(
    root: GrappRoot,
    meta: M
  ) {
    if (!(root instanceof GrappRoot)) throw TypeError(
      '(root) is not a instance of GrappRoot'
    );
    if (!(meta instanceof GrappMeta)) throw TypeError(
      '(meta) is not a instance of GrappMeta'
    );
    this.name = meta.name;
    const typeRefs: MapsByTypeKind<TypeRef> = {};
    const nodes = new Set<DefinitionNode>();
    const resolvers = new Map<string, () => any>();
    for (const target of meta.imports) {
      const grappRef = root.importGrappRef(target);
      if (!grappRef) throw new ReferenceError(
        `Failed to import grapp reference with the target (${target.name || target})`
      );
      for (const typeKind of ['query', 'mutation', 'subscription', 'type']) {
        if (grappRef.typeRefs[typeKind]) {
          if (!typeRefs[typeKind]) typeRefs[typeKind] = new Map();
          for (const [selector, typeRef] of grappRef.typeRefs[typeKind]) {
            if (typeRefs[typeKind].has(selector)) {
              if (typeRefs[typeKind].get(selector) !== typeRef) throw new ReferenceError(
                `Conflict between two different type references with selector '${selector}'`
              );
            }
            else typeRefs[typeKind].set(selector, typeRef);
          }
        }
      }
      if (grappRef.nodes) for (const node of grappRef.nodes) nodes.add(node);
      if (grappRef.resolvers) for (const key of Object.keys(grappRef.resolvers)) (
        resolvers[key] = grappRef.resolvers[key]
      );
    }
    this.injector = root.injector.resolveAndCreateChild([...meta.providers]);
    if (meta.resolvers) for (const key of Object.keys(meta.resolvers)) (
      resolvers[key] = meta.resolvers[key]
    );
    const {metaMap, sources} = parseGrappMeta(meta);
    const {definitions, nodes: ownNodes} = parseSchemaSource(...sources);
    for (const node of ownNodes) nodes.add(node);
    const ownTypeRefs = this._mapTypeDefinitions(definitions, metaMap);
    for (const typeKind of ['query', 'mutation', 'subscription', 'type']) {
      if (ownTypeRefs[typeKind]) {
        if (!typeRefs[typeKind]) typeRefs[typeKind] = new Map();
        for (const [selector, typeRef] of ownTypeRefs[typeKind]) {
          typeRefs[typeKind].set(selector, typeRef);
        }
      }
    }
    this.nodes = nodes;
    this.resolvers = resolvers;
    this.typeRefs = typeRefs;
  }

  build(): GraphQLSchema {
    const resolvers = {...this.resolvers};
    const definitions: DefinitionNode[] = Array.from(this.nodes);
    if (this.typeRefs.type) {
      for (const [, typeRef] of this.typeRefs.type) definitions.push(typeRef.definition);
    }
    for (const typeKind of ['query', 'mutation', 'subscription']) {
      if (this.typeRefs[typeKind]) {
        const typeRefMap: Map<string, TypeRef> = this.typeRefs[typeKind];
        const definition: ObjectTypeDefinitionNode = {
          kind: 'ObjectTypeDefinition',
          name: {kind: 'Name', value: capitalize(typeKind)},
          fields: []
        };
        for (const [selector, typeRef] of this.typeRefs[typeKind]) {
          for (const [key, fieldRef] of typeRef.fields) {
            definition.fields.push(fieldRef.definition)
          }
        }
        definitions.push(definition);
      }
    }
    const documentNode: DocumentNode = { kind: 'Document', definitions};
    let schema: GraphQLSchema;
    try { schema = buildASTSchema(documentNode); } catch (catched) {
      console.error(catched);
      throw new Error(`BuildError: ${catched.message || catched}`);
    }
    addResolveFunctionsToSchema(schema, resolvers);
    return schema;
  }

  /**
   * Maps a object of maps with type kind as key by combining definition and meta
   * @param definitions Type definiton maps by type kind
   * @param metaMap A selector map with type meta as v
   * @returns A object references maps by type kind
   */
  protected _mapTypeDefinitions(
    definitions: MapsByTypeKind<ObjectTypeDefinitionNode>,
    metaMap: Map<string, TypeMeta>
  ): MapsByTypeKind<TypeRef> {
    const references: MapsByTypeKind<TypeRef>= {};
    for (const typeKind of Object.keys(definitions)) {
      references[typeKind] = new Map();
      for (const [selector, definition] of definitions[typeKind]) {
        const meta = metaMap.get(selector);
        if (!meta) throw new ReferenceError(
          `Failed to get type meta for type selector: '${selector}'`
        );
        let typeRef: TypeRef;
        try { typeRef = new meta.TypeRefClass(this, meta, definition); }
        catch (catched) {
          console.error(catched);
          throw new Error(
            `Failed to instanciate type reference '${selector}': ${catched.message}`
          );
        }
        if (!(typeRef instanceof TypeRef)) throw new TypeError(
          `Type reference with selector '${selector}' is not a instance of TypeRef`
        );
        references[typeKind].set(selector, typeRef);
      }
    }
    return references;
  }
}

/** Represents maps with selector as key splitted by type kind */
export interface MapsByTypeKind<T> {
  type?: Map<string, T>
  query?: Map<string, T>
  mutation?: Map<string, T>
  subscription?: Map<string, T>
}

/**
 * Parses a grapp meta to a map with selector as key and type meta as value,
 * and schema sources.
 */
export function parseGrappMeta(meta: GrappMeta): {
  metaMap: Map<string, TypeMeta>
  sources: SchemaSource[]
} {
  const metaMap = new Map<string, TypeMeta>();
  const sources: SchemaSource[] = [];
  if (meta.source) sources.push(meta.source);
  for (const typeTarget of meta.types) {
    const meta = getTypeMeta(typeTarget);
    if (!meta) throw new ReferenceError(
      `Failed to get type meta for type target (${typeTarget.name || typeTarget})`
    );
    if (metaMap.has(meta.selector)) throw new ReferenceError(
      `Duplicate meta type selector '${meta.selector}'`
    )
    metaMap.set(meta.selector, meta);
    if (meta.source) sources.push(meta.source);
  }
  return {metaMap, sources};
}

/**
 * Parses schema sources to maps by type kind of definition
 * and a set of the others nodes.
 */
export function parseSchemaSource(...sources: SchemaSource[]): {
  definitions: MapsByTypeKind<ObjectTypeDefinitionNode>
  nodes: Set<DefinitionNode>
} {
  const definitions: MapsByTypeKind<ObjectTypeDefinitionNode> = {};
  const nodes = new Set<DefinitionNode>();
  for (const source of sources) {
    let document: DocumentNode;
    try { document = graphqlParse(source.body); }
    catch (catched) {
      console.error(catched);
      throw new Error(`Failed to parse source '${source.name}': ${catched.message}`);
    }
    for (const definition of document.definitions) {
      if (definition.kind !== 'ObjectTypeDefinition') nodes.add(definition);
      else {
        const name = definition.name.value;
        const OPERATIONS_TYPES = ['query', 'mutation', 'subscription', 'type'];
        let operationType: string;
        for (const target of OPERATIONS_TYPES) {
          if (target === 'type') operationType = 'type';
          else if (name.match(new RegExp(`\\w+${capitalize(target)}$`))) {
            operationType = target;
            break;
          }
        }
        if (!definitions[operationType]) (definitions[operationType] = new Map());
        if (definitions[operationType].has(name)) throw new ReferenceError(
          `Duplicate ${operationType} name '${name}'`
        );
        definitions[operationType].set(name, definition);
      }
    }
  }
  return {definitions, nodes};
}
