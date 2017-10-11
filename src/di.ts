import { Inject } from '@angular/core';
import { Collection as mongodbCollection } from 'mongodb';

export const PAYLOAD = Symbol('PAYLOAD');

export const Payload: ParameterDecorator = Inject(PAYLOAD);

export const COLLECTION = Symbol('COLLECTION');

export const Collection: ParameterDecorator = Inject(COLLECTION);

export interface Collection<S = { [key: string]: any }> extends mongodbCollection<S> { }

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
