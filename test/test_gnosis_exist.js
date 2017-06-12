var assert = require('assert');
  describe('#sample test', function() {
    it('tests out of bounds array', function() {
      assert.equal(-1, [1,2,3].indexOf(4));
    });
  });
