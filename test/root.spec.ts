import './chai';

import { connect, Db } from 'mongodb';

import { decorateGrapp } from '../src/grapp';

import { Root } from '../src/root';

describe('root.ts', function() {
  let db: Db;

  @decorateGrapp({})
  class TestGrapp { }

  before(async () => {
    db = await connect('mongodb://127.0.0.1:27017/grapp-test');
  });

  describe('new Root', function() {
    it('should throw Error when no args are provided', function () {
      function instanciateRoot() { return new (<any>Root)(); }
      instanciateRoot.should.throw(Error);
    });
    it('should throw Error when params is not a truthy object', function () {
      function instanciateRoot() { return new (<any>Root)({}, null); }
      instanciateRoot.should.throw(Error);
    });
    it('should throw Error when params.db is not instance of mongodb', function () {
      function instanciateRoot() { return new (<any>Root)({}, {db: {}}); }
      instanciateRoot.should.throw(Error);
    });
    it('should throw Error when params.providers is not Array', function () {
      function instanciateRoot() { return new (<any>Root)({}, {db, providers: 'WRONG'}); }
      instanciateRoot.should.throw(Error);
    });
    it('should throw Error when target has not been decorated with @Grapp', function () {
      function instanciateRoot() { return new (<any>Root)({}, {db, providers: []}); }
      instanciateRoot.should.throw(Error);
    });
    it('should not throw when args are valid', function() {
      function instanciateRoot() { return new (<any>Root)(TestGrapp, {db}); }
      instanciateRoot.should.not.throw(Error);
    });
  });
});
