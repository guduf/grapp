import { Provider } from './di';
import { TypeTarget } from './type';
export declare type GrappTarget = any;
export interface GrappContext {
}
export interface GrappParams {
    imports?: GrappTarget[];
    types?: TypeTarget[];
    providers?: Provider[];
    schema?: string;
    resolvers?: {
        [key: string]: any;
    };
}
export declare class GrappMeta implements GrappParams {
    target: GrappTarget;
    imports: GrappTarget[];
    types: TypeTarget[];
    providers: Provider[];
    schema?: string;
    resolvers: {
        [key: string]: any;
    };
    constructor(target: GrappTarget, params: GrappParams);
}
export declare function decorateGrapp(params: GrappParams): ClassDecorator;
export declare function getGrappMeta(target: GrappTarget): GrappMeta;
