import { DefinitionNode, DocumentNode, FieldDefinitionNode, ObjectTypeDefinitionNode } from 'graphql';
import { Root } from './root';
import { Collection } from './db';
import { Injector } from './di';
import { TypeTarget } from './type';
import { TypeRef } from './type_ref';
import { GrappMeta, GrappTarget } from './grapp';
import { OperationRef } from './operation_ref';
export interface GrappSchemaDefs {
    query: FieldDefinitionNode[];
    mutation: FieldDefinitionNode[];
    types: ObjectTypeDefinitionNode[];
    misc: DefinitionNode[];
}
export declare class GrappRef<M extends GrappMeta = GrappMeta> {
    root: Root;
    target: GrappTarget;
    meta: M;
    collection: Collection;
    operationRefs: Set<OperationRef>;
    typeRefs: Map<string, TypeRef>;
    imports: GrappRef[];
    injector: Injector;
    constructor(root: Root, target: GrappTarget, meta: M);
    referenceType<R extends TypeRef = TypeRef>(target: TypeTarget): R;
    parse(): {
        docNode: DocumentNode;
        resolverMap: {
            [key: string]: {
                [key: string]: any;
            };
        };
    };
}
