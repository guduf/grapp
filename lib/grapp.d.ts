import { Provider } from './di';
import { TypeTarget } from './type';
import { GrappRef } from './grapp_ref';
export declare type GrappTarget = any;
export interface GrappParams {
    imports?: GrappTarget[];
    types?: TypeTarget[];
    operations?: TypeTarget[];
    providers?: Provider[];
    schema?: string;
    resolvers?: {
        [key: string]: any;
    };
}
export declare class GrappMeta implements GrappParams {
    target: GrappTarget;
    ctor: typeof GrappRef;
    imports: GrappTarget[];
    types: TypeTarget[];
    operations: TypeTarget[];
    providers: Provider[];
    schema?: string;
    resolvers: {
        [key: string]: any;
    };
    constructor(target: GrappTarget, params: GrappParams, ctor?: typeof GrappRef);
}
export declare function decorateGrapp(params: GrappParams): ClassDecorator;
export declare function setGrappMeta(target: GrappTarget, meta: GrappMeta): void;
export declare function getGrappMeta<M extends GrappMeta = GrappMeta>(target: GrappTarget): M;
