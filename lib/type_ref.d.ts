import { Injector } from './di';
import { FieldRef } from './field_ref';
import { GrappRef } from './grapp_ref';
import { TypeMeta, TypeInstance } from './type';
import { GrappRoot } from './root';
import { ObjectTypeDefinitionNode } from 'graphql';
export declare const DOC_DATA: unique symbol;
export declare class TypeRef<I extends TypeInstance = TypeInstance, M extends TypeMeta = TypeMeta> {
    grappRef: GrappRef;
    meta: M;
    readonly fields: Map<string, FieldRef>;
    readonly injector: Injector;
    readonly root: GrappRoot;
    readonly selector: string;
    constructor(grappRef: GrappRef, meta: M, definition: ObjectTypeDefinitionNode);
    instanciate(payload: {
        [key: string]: any;
    }): I;
    private _mapFieldDefinitions(definitions, metaMap);
}
