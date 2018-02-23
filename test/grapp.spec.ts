import './chai';

import { decorateGrapp, GrappMeta, GrappParams, setGrappMeta } from '../src/grapp';
import { decorateOperation } from '../src/operation';
import { decorateType } from '../src/type';

describe('grapp.ts', function() {
  @decorateGrapp({})
  class TestGrapp { }

  @decorateType()
  class TestType { }

  @decorateOperation('Query')
  class TestOperation { }

  describe('new GrappMeta', function() {
    it('should throw a error when params is not a object', function() {
      function $newGrappMeta() { new(<any>GrappMeta)({}, 'WRONG') }
      $newGrappMeta.should.throw(Error);
    });
    it('should accept params.providers when it is a valid array', function() {
      const provider = {provide: 'TEST_FOO_BAR', useValue: true};
      const meta = new GrappMeta({}, {providers: [provider]});
      meta.providers[0].should.have.ownProperty('provide', 'TEST_FOO_BAR');
    });
    it('should accept params.imports when it is a valid array', function() {
      const meta = new GrappMeta({}, {imports: [TestGrapp]});
      meta.imports.should.include(TestGrapp);
    });
    it('should accept params.types when it is a valid array', function() {
      const meta = new GrappMeta({}, {types: [TestType]});
      meta.types.should.include(TestType);
    });
    it('should accept params.operations when it is a valid array', function() {
      const meta = new GrappMeta({}, {operations: [TestOperation]});
      meta.operations.should.include(TestOperation);
    });
    it('should accept params.operations when it is a valid object', function() {
      const resolvers = {
        User: {
          __resolveType({role}: {role: 'Admin'|'Member'}) { return role; }
        }
      }
      const meta = new GrappMeta({}, {resolvers});
      meta.resolvers.should.have.property('User').which.is.a('object');
    });
  });

  describe('setGrappMeta', function() {
    it('should throw a error when meta is not instance of GrappMeta', function() {
      function $setGrappMeta() { (<any>setGrappMeta)({}, 'WRONG'); }
      $setGrappMeta.should.throw(Error);
    });
  });
});
