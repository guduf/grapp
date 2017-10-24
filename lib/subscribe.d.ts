import { DocumentNode, ExecutionResult, GraphQLFieldResolver, GraphQLSchema } from 'graphql';
export declare function subscribe(schema: GraphQLSchema, document: DocumentNode, rootValue?: any, contextValue?: any, variableValues?: {
    [key: string]: any;
}, operationName?: string, fieldResolver?: GraphQLFieldResolver<any, any>, subscribeFieldResolver?: GraphQLFieldResolver<any, any>): Promise<AsyncIterator<ExecutionResult> | ExecutionResult>;
