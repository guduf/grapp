import { Provider } from './di';
import { TypeMeta, TypeTarget } from './type';
export declare type OperationKind = 'Mutation' | 'Query' | 'Subscription';
export declare const OPERATION_KINDS: ['Mutation', 'Query', 'Subscription'];
export interface OperationParams {
    selector?: string;
    providers?: Provider[];
}
export declare class OperationMeta extends TypeMeta {
    kind: OperationKind;
    constructor(target: TypeTarget, kind: OperationKind, params: OperationParams);
}
export declare function decorateOperation(kind: OperationKind, params?: OperationParams): ClassDecorator;
export declare function decorateMutation(params?: OperationParams): ClassDecorator;
export declare function decorateQuery(params?: OperationParams): ClassDecorator;
export declare function decorateSubscription(params?: OperationParams): ClassDecorator;
