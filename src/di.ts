import { Inject } from '@angular/core';

import { TypeInstance } from './type';

export const PAYLOAD = Symbol('PAYLOAD');

export const Payload: ParameterDecorator = Inject(PAYLOAD);

export const TYPER = Symbol('TYPER');

export const Typer: ParameterDecorator = Inject(TYPER);

export interface Typer {
  <T extends TypeInstance = TypeInstance>(type: string, payload?: { [key: string]: any }): T
}

export {
  Inject,
  Injectable,
  InjectionToken,
  Provider,
  ReflectiveInjector as Injector
} from '@angular/core';
