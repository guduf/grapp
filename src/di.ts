import { Inject } from '@angular/core';

import { TypeInstance } from './type';
import { Collection as mongodbCollection } from 'mongodb';

export const PAYLOAD = Symbol('PAYLOAD');

export const Payload: ParameterDecorator = Inject(PAYLOAD);

export const COLLECTION = Symbol('COLLECTION');

export const Collection: ParameterDecorator = Inject(COLLECTION);

export interface Collection<S = { [key: string]: any }> extends mongodbCollection<S> { }

export const CREATE_DOC = Symbol('CREATE_DOC');

export const CreateDoc: ParameterDecorator = Inject(CREATE_DOC);

export interface CreateDoc<I = TypeInstance> {
  (args: { candidate: { [key: string]: any } }): Promise<I>
}

export const UPDATE_DOC = Symbol('UPDATE_DOC');

export const UpdateDoc: ParameterDecorator = Inject(UPDATE_DOC);

export interface UpdateDoc<I = TypeInstance> {
  (args: { id: string, update: { [key: string]: any } }): Promise<I>
}

export const REMOVE_DOC = Symbol('REMOVE_DOC');

export const RemoveDoc: ParameterDecorator = Inject(REMOVE_DOC);

export interface RemoveDoc {
  (args: { id: string }): Promise<boolean>
}

export const VALIDATE_DOC = Symbol('VALIDATE_DOC');

export const ValidateDoc: ParameterDecorator = Inject(VALIDATE_DOC);

export interface ValidateDoc {
  (candidate: { [key: string]: any }): Promise<{ [key: string]: any }>
}

export const TYPER = Symbol('TYPER');

export const Typer: ParameterDecorator = Inject(TYPER);

export interface Typer {
  <T = {}>(type: string, payload?: { [key: string]: any }): T
}

export {
  Inject,
  Injectable,
  InjectionToken,
  Provider,
  ReflectiveInjector as Injector
} from '@angular/core';
