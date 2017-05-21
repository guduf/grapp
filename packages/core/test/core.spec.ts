import 'mocha';
import * as chai from 'chai';
import * as chaiAsPromised from 'chai-as-promised';
chai.use(chaiAsPromised);
chai.should();

import { Grapp, Type } from '../src/';
import { bootstrapGrapp, TypeTokenStore } from '../src/core';

describe('bootstrapGrapp()', function() {
  @Type({})
  class GreetingQuery {
    hello() { return 'hello world'; }
  }
  const schema = `
    type GreetingQuery {
      hello: String!
    }
    type Query {
      greetings: GreetingQuery
    }
  `;
  it('should reject if no arg is passed', function() {
    return bootstrapGrapp(undefined).should.be.rejectedWith(TypeError);
  });
  it('should reject if no arg is passed', function() {
    return bootstrapGrapp(Date).should.be.rejectedWith(TypeError);
  });
  it('should return middleware', function() {
    @Grapp({schema, types: [GreetingQuery]})
    class AppGrapp { }
    return bootstrapGrapp(AppGrapp).should.eventually.be.a('function');
  });
  it('should reject when GrappRef construction failed', function() {
    @Grapp(<any>{})
    class AppGrapp { }
    return bootstrapGrapp(AppGrapp).should.be.rejectedWith(Error);
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
