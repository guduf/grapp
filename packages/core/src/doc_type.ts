import { TypeBuilder } from './type';
import { GenericDoc, DocMeta, DocTypePayload } from './doc';

export abstract class GenericDocType<D extends GenericDoc = GenericDoc> {
  constructor(payload: DocTypePayload) {
    if (!(this._typeBuilder = payload.typeBuilder))
      throw new Error('DocTypePayload had no typeBuilder');
    // if (!(this._db = payload.db)) throw new Error('DocTypePayload had no db');
    if (!(this.__docMeta = payload.meta)) throw new Error('DocTypePayload has no meta');
    if (!(this.__id = payload.docState.id)) throw new Error('DocTypePayload has no id');
    const docProps: PropertyDescriptorMap = {};
    const _docState: { [key: string]: any } = {};
    for (const [key] of payload.meta.fields) {
      _docState[key] = typeof payload.docState[key] === 'undefined' ?null : payload.docState[key];
      docProps[key] = <TypedPropertyDescriptor<Promise<any>>>{
        configurable: false,
        enumerable: true,
        get: this.__docGetter(key)
      };
    }
    this.__docState = Object.seal(_docState);
    this.__doc = Object.freeze(Object.create(Object.prototype, docProps));
  }
  get doc(): D { return this.__doc; }
  get id(): string { return this.__id; }
  protected _db: Promise<void>;
  protected _typeBuilder: TypeBuilder;
  private __doc: D;
  private __docMeta: DocMeta;
  private __docState: { [key: string]: any };
  private __id: string;
  private __docGetter(key: string): { (): Promise<any> } {
    return (async () => {
      if (this.__docState[key]) return key;
      throw new Error('__docGetter state have not the key');
    });
  }
}

export type DocTypeTarget = typeof GenericDocType;
