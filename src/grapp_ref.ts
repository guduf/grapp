import {
  DefinitionNode,
  DocumentNode,
  ObjectTypeDefinitionNode,
  Source as SchemaSource,
  parse as graphqlParse
} from 'graphql';

import { Injector } from './di';
import { getGrappMeta, GrappMeta, GrappTarget } from './grapp';
import { GrappRoot } from './root';
import { getTypeMeta, TypeInstance, TypeTarget, TypeMeta } from './type';
import { TypeRef } from './type_ref';
import { capitalize } from './utils';

/** Represents a unique instance of grapp reference created during bootstrap. */
export class GrappRef<M extends GrappMeta = GrappMeta> {
  readonly typeRefs: MapsByTypeKind<TypeRef>
  readonly imports: GrappRef[];
  readonly injector: Injector;

  /**
   * Initialize a grapp reference.
   * @param root The grapp root.
   * @param meta The meta of the grapp.
   */
  constructor(
    readonly root: GrappRoot,
    meta: M
  ) {
    this.imports = meta.imports.map(grappTarget => this.root.registerGrappRef(grappTarget));
    this.injector = this.root.injector.resolveAndCreateChild([...meta.providers]);
    const {metaMap, sources} = parseGrappMeta(meta);
    const {definitions, nodes} = parseSchemaSource(...sources);
    this.typeRefs = this._mapTypeDefinitions(definitions, metaMap);
  }

  /**
   * Maps a object of maps with type kind as key by combining definition and meta
   * @param definitions Type definiton maps by type kind
   * @param metaMap A selector map with type meta as v
   * @returns A object references maps by type kind
   */
  private _mapTypeDefinitions(
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
          throw new Error(`Failed to instanciate type ref '${selector}': ${catched.message}`);
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
    if (!(meta instanceof TypeMeta)) throw new ReferenceError(
      `Failed to get type meta for type target: ${typeTarget.name || typeTarget}`
    );
    if (metaMap.has(meta.selector)) throw new ReferenceError(
      `Duplicate meta type selector: '${meta.selector}'`
    )
    metaMap.set(meta.selector, meta);
    if (meta.source) sources.push(meta.source);
  }
  return {metaMap, sources};
}

/**
 * Parses schema sources to maps by type kind of definition
 * and a array of the others nodes.
 */
export function parseSchemaSource(...sources: SchemaSource[]): {
  definitions: MapsByTypeKind<ObjectTypeDefinitionNode>
  nodes: DefinitionNode[]
} {
  const definitions = {};
  const nodes: DefinitionNode[] = [];
  console.log(sources);
  for (const source of sources) {
    let document: DocumentNode;
    try { document = graphqlParse(source.body); }
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
            if (definitions['type'].has(name)) throw new ReferenceError(name);
            else definitions['type'].set(name, definition);
          if (name.match(new RegExp(`/\w+${capitalize(operationType)}$/`))) {
            if (!definitions[operationType]) (definitions[operationType] = new Map());
            if (!definitions[operationType].has(name)) throw new ReferenceError(name);
            definitions[operationType].set(name, definition);
            break;
          }
        }
      }
    }
  }
  return {definitions, nodes};
}
