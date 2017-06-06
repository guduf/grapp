import 'mocha';
import * as chai from 'chai';
import * as chaiAsPromised from 'chai-as-promised';
chai.use(chaiAsPromised);
chai.should();

import { Grapp } from '../src/grapp';
import { Query } from '../src/operation';
import { bootstrapGrapp, TypeTokenStore } from '../src/core';

describe('bootstrapGrapp()', function() {
  @Query()
  class GreetingsQuery {
    resolve() { return 'hello world'; }
  }
  const schema = `
    type Query {
      greetings: String!
    }
  `;
  it('should reject if no arg is passed', function() {
    return bootstrapGrapp(undefined).should.be.rejectedWith(TypeError);
  });
  it('should reject if no arg is passed', function() {
    return bootstrapGrapp(Date).should.be.rejectedWith(TypeError);
  });
  it('should return middleware', function() {
    @Grapp({schema, operations: [GreetingsQuery]})
    class AppGrapp { }
    return bootstrapGrapp(AppGrapp).should.eventually.be.a('object');
  });
});

describe('TypeTokenStore', function() {
  it('should retrieve type token the same string', function() {
    const store = new TypeTokenStore();
    const token = store.create('FooQuery');
    store.get('FooQuery').should.be.equal(token);
  });
  it('should throw Error when creating twice the same type', function() {
    const store = new TypeTokenStore();
    store.create('FooQuery');
    (() => store.create('FooQuery')).should.throw(Error);
  });
});
