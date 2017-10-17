import { TypeInstance } from './type';
import { Collection as mongodbCollection } from 'mongodb';
export declare const PAYLOAD: symbol;
export declare const Payload: ParameterDecorator;
export declare const COLLECTION: symbol;
export declare const Collection: ParameterDecorator;
export interface Collection<S = {
    [key: string]: any;
}> extends mongodbCollection<S> {
}
export declare const CREATE_DOC: symbol;
export declare const CreateDoc: ParameterDecorator;
export interface CreateDoc<I = TypeInstance> {
    (args: {
        candidate: {
            [key: string]: any;
        };
    }): Promise<I>;
}
export declare const UPDATE_DOC: symbol;
export declare const UpdateDoc: ParameterDecorator;
export interface UpdateDoc<I = TypeInstance> {
    (args: {
        id: string;
        update: {
            [key: string]: any;
        };
    }): Promise<I>;
}
export declare const REMOVE_DOC: symbol;
export declare const RemoveDoc: ParameterDecorator;
export interface RemoveDoc {
    (args: {
        id: string;
    }): Promise<boolean>;
}
export declare const TYPER: symbol;
export declare const Typer: ParameterDecorator;
export interface Typer {
    <T = {}>(type: string, payload?: {
        [key: string]: any;
    }): T;
}
export { Inject, Injectable, InjectionToken, Provider, ReflectiveInjector as Injector } from '@angular/core';
