import { TypeInstance } from './type';
export declare const PAYLOAD: unique symbol;
export declare const Payload: ParameterDecorator;
export declare const TYPER: unique symbol;
export declare const Typer: ParameterDecorator;
export interface Typer {
    <T extends TypeInstance = TypeInstance>(type: string, payload?: {
        [key: string]: any;
    }): T;
}
export { Inject, Injectable, InjectionToken, Provider, ReflectiveInjector as Injector } from '@angular/core';
