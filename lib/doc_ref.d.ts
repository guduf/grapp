import { Collection } from './db';
import { DocMeta, DocOpeMeta } from './doc';
import { FieldMeta } from './fields';
import { GrappRef } from './grapp_ref';
import { TypeInstance, TypeTarget } from './type';
import { TypeRef } from './type_ref';
export declare class DocRef<I = TypeInstance> extends TypeRef {
    grappRef: GrappRef;
    target: TypeTarget;
    meta: DocMeta;
    collection: Collection;
    constructor(grappRef: GrappRef, target: TypeTarget, meta: DocMeta);
    instanciate<I extends TypeInstance = TypeInstance>(payload: {
        id: string;
    }): I;
}
export declare class DocOpeRef<I = TypeInstance> extends TypeRef {
    grappRef: GrappRef;
    target: TypeTarget;
    meta: DocOpeMeta;
    targetMeta: DocMeta;
    targetFields: Map<string, FieldMeta>;
    collection: Collection;
    constructor(grappRef: GrappRef, target: TypeTarget, meta: DocOpeMeta);
    instanciate(): TypeInstance;
    private _createDoc({candidate});
    private _removeDoc({id});
    private _updateDoc({id, update});
    private _validateDoc(candidate);
}
