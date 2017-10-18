import { Provider } from './di';
import { TypeMeta, TypeTarget } from './type';
export interface OperationParams {
    providers?: Provider[];
}
export declare class OperationMeta extends TypeMeta {
    kind: 'mutation' | 'query';
    constructor(target: TypeTarget, kind: 'mutation' | 'query', params: OperationParams);
}
export declare function decorateOperation(kind: 'mutation' | 'query', params?: OperationParams): ClassDecorator;
export declare function decorateMutation(params?: OperationParams): ClassDecorator;
export declare function decorateQuery(params?: OperationParams): ClassDecorator;
