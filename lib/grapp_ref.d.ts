import { DefinitionNode, DocumentNode, GraphQLResolveInfo, FieldDefinitionNode, ObjectTypeDefinitionNode } from 'graphql';
import { GrappRoot } from './root';
import { Collection } from './db';
import { Injector } from './di';
import { TypeRef } from './type_ref';
import { GrappMeta, GrappTarget } from './grapp';
import { OperationRef } from './operation_ref';
export interface GraphQLResolver<T = any> {
    (args: {
        [key: string]: any;
    }, context: {
        [key: string]: any;
    }, info: GraphQLResolveInfo): T | Promise<T>;
}
export interface GrappSchemaDefs {
    query: FieldDefinitionNode[];
    mutation: FieldDefinitionNode[];
    types: ObjectTypeDefinitionNode[];
    misc: DefinitionNode[];
}
export declare class GrappRef {
    target: GrappTarget;
    root: GrappRoot;
    collection: Collection;
    operationRefs: Set<OperationRef>;
    typeRefs: Map<string, TypeRef>;
    meta: GrappMeta;
    imports: GrappRef[];
    injector: Injector;
    constructor(target: GrappTarget, root: GrappRoot);
    parse(): {
        docNode: DocumentNode;
        resolverMap: {
            [key: string]: {
                [key: string]: any;
            };
        };
    };
}
