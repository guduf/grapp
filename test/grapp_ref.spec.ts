import { GrappRef, parseGrappMeta, parseSchemaSource } from '../src/grapp_ref';
import { GrappMeta, setGrappMeta, decorateGrapp, getGrappMeta } from '../src/grapp';
import { GrappRoot } from '../src/root';
import { decorateType, setTypeMeta, TypeMeta } from '../src/type';
import { GraphQLSchema } from 'graphql';

describe('grapp_ref.ts', () => {
  class PostGrapp { }

  const minimalGrappMeta = new GrappMeta(PostGrapp, {});

  const minimalGrappRoot = new GrappRoot(PostGrapp);

  describe('GrappRef', () => {
    describe('new GrappRef()' , () => {
      it('should throw a error when first is not instance of grapp root', () => {
        setGrappMeta(PostGrapp, minimalGrappMeta);

        expect(() => new GrappRef(null, minimalGrappMeta)).toThrowError('GrappRoot');
      });

      it('should throw a error when meta is not instance of grapp meta', () => {
        expect(() => new GrappRef(minimalGrappRoot, null)).toThrowError('GrappMeta');
      });

      it('should throw a error when one of the import is not a valid grapp target', () => {
        const meta = new GrappMeta(PostGrapp, {imports: [class InvalidImport { }]});

        expect(() => new GrappRef(minimalGrappRoot, meta)).toThrowError('import');
      });

      it('should throw a error when type definition has no associated type meta', () => {
        class AuthorGrapp { }

        const meta = new GrappMeta(AuthorGrapp, {schema: 'type Author { name: String! }'});
        setGrappMeta(AuthorGrapp, meta);

        expect(() => new GrappRef(minimalGrappRoot, meta)).toThrowError('Author');
      });

      it('should throw a error when imports have type reference conflict', () => {
        @decorateType({selector: 'Celebrity', schema: 'type Celebrity { }'})
        class Celebrity { }

        @decorateGrapp({types: [Celebrity]})
        class CelebrityGrapp { }

        @decorateType({selector: 'Celebrity', schema: 'type Celebrity { }'})
        class FakeCelebrity { }

        @decorateGrapp({types: [FakeCelebrity]})
        class FakeCelebrityGrapp { }

        class TestGrapp { }

        const meta = new GrappMeta(TestGrapp, {imports: [CelebrityGrapp, FakeCelebrityGrapp]});
        setGrappMeta(TestGrapp, meta);

        expect(() => new GrappRef(minimalGrappRoot, meta)).toThrowError(/conflict.*?celebrity/i);
      });

      it('should throw a catched error message when type reference constructor throw a error', () => {
        class Monkey { }

        class MonkeyRef {
          constructor() { throw new Error('CATCHED_ERROR'); }
        }

        setTypeMeta(Monkey, new TypeMeta(Monkey, {}, (MonkeyRef as any)));

        class MonkeyGrapp { }

        const meta = new GrappMeta(MonkeyGrapp, {schema: 'type Monkey { }', types: [Monkey]});
        setGrappMeta(MonkeyGrapp, meta);

        expect(() => new GrappRef(minimalGrappRoot, meta)).toThrowError(/Monkey.*?CATCHED_ERROR/);
      });

      it('should throw a catched error message when type reference constructor doesnt extend TypeRef', () => {
        class Monkey { }

        class MonkeyRef { }

        setTypeMeta(Monkey, new TypeMeta(Monkey, {}, (MonkeyRef as any)));

        class MonkeyGrapp { }

        const meta = new GrappMeta(MonkeyGrapp, {
          schema: 'type Monkey { }',
          types: [Monkey]
        });
        setGrappMeta(MonkeyGrapp, meta);

        expect(() => new GrappRef(minimalGrappRoot, meta))
          .toThrowError(/Monkey.*?TypeRef/);
      });

      it('should initialize a grapp ref instance with minimal meta', () => {
        setGrappMeta(PostGrapp, minimalGrappMeta);

        expect(new GrappRef(minimalGrappRoot, minimalGrappMeta)).toBeInstanceOf(GrappRef);
      });

      it('should initialize a grapp ref instance with type', () => {
        @decorateType({schema: 'type Author { name: String! }'})
        class Author {
          get name(): string { return 'Victor Hugo'; }
        }

        class AuthorGrapp { }

        const meta = new GrappMeta(AuthorGrapp, {types: [Author]});
        setGrappMeta(AuthorGrapp, meta);

        expect(new GrappRef(minimalGrappRoot, meta)).toBeInstanceOf(GrappRef);
      });

      it('should initialize a grapp ref instance with import', () => {
        @decorateGrapp({})
        class AuthorGrapp { }
        const meta = new GrappMeta(PostGrapp, {imports: [AuthorGrapp]});
        setGrappMeta(PostGrapp, meta);

        expect(new GrappRef(minimalGrappRoot, meta)).toBeInstanceOf(GrappRef);
      });

      it('should initialize a grapp ref instance with import with type', () => {
        @decorateType({schema: 'type Author { name: String! }'})
        class Author { get name(): string { return 'Victor Hugo'; } }

        @decorateGrapp({types: [Author]})
        class AuthorGrapp { }

        const meta = new GrappMeta(PostGrapp, {imports: [AuthorGrapp]});
        setGrappMeta(PostGrapp, meta);

        expect(new GrappRef(minimalGrappRoot, meta)).toBeInstanceOf(GrappRef);
      });

    });

    describe('GrappRef.build()', () => {
      it ('should throw a error when no queries are defined', () => {
        class PostGrapp { }
        const grappMeta = new GrappMeta(PostGrapp);
        const grappRef = new GrappRef(minimalGrappRoot, grappMeta);
        expect(() => grappRef.build()).toThrowError(/build.*?query/i);
      });

      it ('should return a GraphQL schema when one query is defined', () => {
        class HelloWorldQuery {
          get greetings() { return 'Hello world'; }
        }
        setTypeMeta(HelloWorldQuery, new TypeMeta(HelloWorldQuery));

        class HelloWorldGrapp { }
        const grappMeta = new GrappMeta(HelloWorldGrapp, {
          types: [HelloWorldQuery],
          schema: `type HelloWorldQuery { greetings: String! }`
        });
        setGrappMeta(HelloWorldGrapp, grappMeta);

        const grappRef = new GrappRef(minimalGrappRoot, grappMeta);
        expect(grappRef.build()).toBeInstanceOf(GraphQLSchema);
      });

      it ('should return a GraphQL schema when one query is defined', () => {
        class HelloWorldQuery {
          get greetings() { return 'Hello world'; }
        }
        setTypeMeta(HelloWorldQuery, new TypeMeta(HelloWorldQuery));

        class HelloWorldGrapp { }
        const grappMeta = new GrappMeta(HelloWorldGrapp, {
          types: [HelloWorldQuery],
          schema: `type HelloWorldQuery { greetings: String! }`
        });
        setGrappMeta(HelloWorldGrapp, grappMeta);

        const grappRef = new GrappRef(minimalGrappRoot, grappMeta);
        expect(grappRef.build()).toBeInstanceOf(GraphQLSchema);
      });

      it ('should return a GraphQL schema when one query and one type are defined', () => {
        class User {
          get name() { return 'John Doe'; }
        }
        setTypeMeta(User, new TypeMeta(User, {schema: `type User { name: String! }`}));

        class UserQuery {
          getJohn() { return new User(); }
        }
        setTypeMeta(UserQuery, new TypeMeta(UserQuery, {schema: `type UserQuery { getJohn: User }`}));

        class HelloWorldGrapp { }
        const grappMeta = new GrappMeta(HelloWorldGrapp, {
          types: [User, UserQuery]
        });
        setGrappMeta(HelloWorldGrapp, grappMeta);

        const grappRef = new GrappRef(minimalGrappRoot, grappMeta);
        expect(grappRef.build()).toBeInstanceOf(GraphQLSchema);
      });

    });

  });

  describe('parseGrappMeta', () => {
    it('should throw a error when a type target has no meta', () => {
      class Monkey { }

      const grappMeta = new GrappMeta(class EmptyGrapp { }, {types: [Monkey]});

      expect(() => parseGrappMeta(grappMeta)).toThrowError(/meta.*?monkey/i);
    });

    it('should throw a error when two type meta have the same selector', () => {
      class Monkey { }
      setTypeMeta(Monkey, new TypeMeta(Monkey, {selector: 'Monkey'}));

      class FakeMonkey { }
      setTypeMeta(FakeMonkey, new TypeMeta(FakeMonkey, {selector: 'Monkey'}));

      const grappMeta = new GrappMeta(class EmptyGrapp { }, {
        types: [Monkey, FakeMonkey]
      });

      expect(() => parseGrappMeta(grappMeta)).toThrowError(/duplicate.*?monkey/i);
    });
  });

  describe('parseSchemaSource()', () => {
    it('should throw a catched error with invalid sources', () => {
      const source = {name: 'InvalidSource', body: 'tope Foo { }'}
      expect(() => parseSchemaSource(source)).toThrowError(/parse.*?tope/i);
    });

    it('should throw a error with duplicate sources', () => {
      const source = {name: 'DuplicateSource', body: 'type FooBar { foobar: String }'}
      expect(() => parseSchemaSource(source, source).nodes.size)
        .toThrowError(/duplicate.*?FooBar/i);
    });

    it('should return a node definition when schema has scalar', () => {
      const source = {name: 'ScalarSource', body: 'scalar Date'}
      expect(parseSchemaSource(source).nodes.size).toEqual(1);
    });
  });

});
