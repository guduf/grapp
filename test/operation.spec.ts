import './chai';

import { decorateMutation, decorateQuery, decorateSubscription } from '../src/operation';
import { decorateType } from '../src/type';

describe('operation.ts', function() {
  class TestClass { }

  describe('decorateQuery', function() {
    it('should decorate operation with kind Query', function() {
      function $decorateQuery() {
        decorateQuery()(TestClass);
      }
      $decorateQuery.should.not.throw(Error);
    });
  });

  describe('decorateMutation', function() {
    it('should decorate operation with kind Mutation', function() {
      function $decorateMutation() {
        decorateMutation()(TestClass);
      }
      $decorateMutation.should.not.throw(Error);
    });
  });

  describe('decorateSubscription', function() {
    it('should decorate operation with kind Subscription', function() {
      function $decorateSubscription() {
        decorateSubscription()(TestClass);
      }
      $decorateSubscription.should.not.throw(Error);
    });
  });
});
