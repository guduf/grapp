import { DocState, DocTarget } from './doc';
import { GenericDocType } from './doc_type';
import { TypeTarget } from './type';


export abstract class DocStorage {
  create(input: { [key: string]: any }): Promise<DocState> {
    throw new Error(
      'This is an abstract function that should not be called. ' +
      'It serves for injection concern'
    );
  }
  find(conditions: { [key: string]: any } = {}, ...fields: string[]): Promise<DocState[]> {
    throw new Error(
      'This is an abstract function that should not be called. ' +
      'It serves for injection concern'
    );
  }
  findOne(conditions: { [key: string]: any } = {}, ...fields: string[]): Promise<DocState> {
    throw new Error(
      'This is an abstract function that should not be called. ' +
      'It serves for injection concern'
    );
  }
  remove(id: string): Promise<string> {
    throw new Error(
      'This is an abstract function that should not be called. ' +
      'It serves for injection concern'
    );
  }
  update(id: string, input: { [key: string]: any }): Promise<DocState> {
    throw new Error(
      'This is an abstract function that should not be called. ' +
      'It serves for injection concern'
    );
  }
}

export abstract class DocStorageFactory {
  create(target: DocTarget, input: { [key: string]: any }): Promise<DocState> {
    throw new Error(
      'This is an abstract function that should not be called. ' +
      'It serves for injection concern'
    );
  }
  find(
    target: DocTarget, conditions: { [key: string]: any } = {}, ...fields: string[]
  ): Promise<DocState[]> {
    throw new Error(
      'This is an abstract function that should not be called. ' +
      'It serves for injection concern'
    );
  }
  findOne(
    target: DocTarget, conditions: { [key: string]: any } = {}, ...fields: string[]
  ): Promise<DocState> {
    throw new Error(
      'This is an abstract function that should not be called. ' +
      'It serves for injection concern'
    );
  }
  remove(target: DocTarget, id: string): Promise<string> {
    throw new Error(
      'This is an abstract function that should not be called. ' +
      'It serves for injection concern'
    );
  }
  update(target: DocTarget, id: string, input: { [key: string]: any }): Promise<DocState> {
    throw new Error(
      'This is an abstract function that should not be called. ' +
      'It serves for injection concern'
    );
  }
}

export type DocStorageFactoryTarget = any;
