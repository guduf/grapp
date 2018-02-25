import { GraphQLSchema } from 'graphql';

import { decorateGrapp } from '../src/grapp';
import { bootstrapGrapp, GrappRoot } from '../src/root';
import { decorateType } from '../src/type';

describe('root.ts', () => {
  @decorateGrapp({})
  class EmptyGrapp { }

  @decorateType()
  class HelloWorldQuery {
    get helloWord(): string { return 'Hello World !'; }
  }

  @decorateGrapp({
    operations: [HelloWorldQuery],
    schema: 'type Query { helloWorld: String! }'
  })
  class HelloWorldGrapp { }

  describe('GrappRoot', () => {
    let emptyRoot: GrappRoot;

    describe('new GrappRoot()', () => {
      it('should throw a TypeError with invalid object as target', () =>
        expect(() => new GrappRoot(undefined, undefined)).toThrowError(TypeError)
      );

      it('should return a instance of GrappRoot when no params are passed', () =>
        expect(emptyRoot = new GrappRoot(EmptyGrapp)).toBeInstanceOf(GrappRoot)
      );
    });
  });
});
