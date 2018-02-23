import './chai';

import { TypeMeta, getTypeMeta, setTypeMeta } from '../src/type';

describe('type.ts', function() {
  describe('new TypeMeta', function() {
    it('should throw a error when params is not a object', function() {
      function $newTypeMeta() { new (<any>TypeMeta)({}, 'WRONG'); }
      $newTypeMeta.should.throw(Error);
    });
    it('should set right selector when provided in params', function() {
      const meta = new (<any>TypeMeta)({}, {selector: 'FOO_BAR'});
      meta.should.have.ownProperty('selector', 'FOO_BAR');
    });
    it('should throw a error when no selector is provided and target has no name property', function() {
      function $newTypeMeta() { new (<any>TypeMeta)({}, {}); }
      $newTypeMeta.should.throw(Error);
    });
  });

  describe('setTypeMeta', function() {
    it('should throw a error when meta is not instance of TypeMeta', function() {
      function $setTypeMeta() { (<any>setTypeMeta)({}, 'WRONG'); }
      $setTypeMeta.should.throw(Error);
    });
  });

  describe('getTypeMeta', function() {
    it('should return null when target has not been decorated', function() {
      Object.is(getTypeMeta({}), null).should.equal(true);
    });
  });
});
