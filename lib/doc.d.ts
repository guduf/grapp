import { GrappMeta, GrappParams } from './grapp';
import { TypeMeta, TypeParams, TypeTarget } from './type';
import { TypeRef } from './type_ref';
export declare const DOC_DATA: symbol;
export interface DocInstance {
    id?: Promise<string>;
    [key: string]: any;
}
export interface DocParams extends GrappParams, TypeParams {
    collectionName?: string;
    operations?: TypeTarget[];
    selector?: string;
}
export declare class DocMeta extends GrappMeta implements TypeMeta {
    constructor(target: TypeTarget, params: DocParams);
    collectionName: string;
    selector: string;
    TypeRefClass: typeof TypeRef;
}
export declare function decorateDoc(params?: DocParams): ClassDecorator;
export declare const docDocIdDecorator: PropertyDecorator;
export declare function checkDocId(target: TypeTarget): boolean;
export interface DocOpeParams extends TypeParams {
    docTarget: TypeTarget;
}
