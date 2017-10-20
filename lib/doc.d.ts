import { TypeMeta, TypeParams, TypeTarget } from './type';
export declare const DOC_DATA: symbol;
export interface DocInstance {
    id?: Promise<string>;
    [key: string]: any;
}
export interface DocParams extends TypeParams {
    collectionName?: string;
}
export declare class DocMeta extends TypeMeta implements DocParams {
    collectionName: string;
    constructor(target: TypeTarget, params: DocParams);
}
export declare function decorateDoc(params?: DocParams): ClassDecorator;
export interface DocOpeParams extends TypeParams {
    docTarget: TypeTarget;
}
export declare class DocOpeMeta extends TypeMeta {
    docTarget: {
        (): TypeTarget;
    };
    constructor(target: TypeTarget, params: DocOpeParams);
}
export declare function decorateDocOpe(params: DocOpeParams): ClassDecorator;
