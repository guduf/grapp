import { DocInstance } from './doc';
import { DocRef } from './doc_ref';
import { TypeInstance, TypeTarget } from './type';
import { OperationMeta } from './operation';
import { OperationRef } from './operation_ref';
export declare class DocOperationRef<D = DocInstance> extends OperationRef<D> {
    docRef: DocRef<D>;
    target: TypeTarget;
    meta: OperationMeta;
    constructor(docRef: DocRef<D>, target: TypeTarget, meta: OperationMeta);
    instanciate(): TypeInstance;
    private _createDoc(candidate);
    private _findDoc(query);
    private _findOneDoc(query);
    private _removeDoc(id);
    private _updateDoc(id, update);
    private _validateDoc(candidate);
}
