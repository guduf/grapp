import { DefinitionNode, ObjectTypeDefinitionNode, Source as SchemaSource } from 'graphql';
import { Injector } from './di';
import { GrappMeta } from './grapp';
import { GrappRoot } from './root';
import { TypeMeta } from './type';
import { TypeRef } from './type_ref';
/** Represents a unique instance of grapp reference created during bootstrap. */
export declare class GrappRef<M extends GrappMeta = GrappMeta> {
    readonly root: GrappRoot;
    readonly typeRefs: MapsByTypeKind<TypeRef>;
    readonly imports: GrappRef[];
    readonly injector: Injector;
    /**
     * Initialize a grapp reference.
     * @param root The grapp root.
     * @param meta The meta of the grapp.
     */
    constructor(root: GrappRoot, meta: M);
    /**
     * Maps a object of maps with type kind as key by combining definition and meta
     * @param definitions Type definiton maps by type kind
     * @param metaMap A selector map with type meta as v
     * @returns A object references maps by type kind
     */
    private _mapTypeDefinitions(definitions, metaMap);
}
/** Represents maps with selector as key splitted by type kind */
export interface MapsByTypeKind<T> {
    type?: Map<string, T>;
    query?: Map<string, T>;
    mutation?: Map<string, T>;
    subscription?: Map<string, T>;
}
/**
 * Parses a grapp meta to a map with selector as key and type meta as value,
 * and schema sources.
 */
export declare function parseGrappMeta(meta: GrappMeta): {
    metaMap: Map<string, TypeMeta>;
    sources: SchemaSource[];
};
/**
 * Parses schema sources to maps by type kind of definition
 * and a array of the others nodes.
 */
export declare function parseSchemaSource(...sources: SchemaSource[]): {
    definitions: MapsByTypeKind<ObjectTypeDefinitionNode>;
    nodes: DefinitionNode[];
};
