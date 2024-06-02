/*
  unit tests for the Cache library
*/

// Global npm libraries
import { assert } from 'chai'
import sinon from 'sinon'

import Cache from '../../../../src/adapters/slp-support/cache.js'

describe('#cache.js', () => {
  let uut, sandbox

  beforeEach(() => {
    // Restore the sandbox before each test.
    sandbox = sinon.createSandbox()

    uut = new Cache()
  })

  afterEach(() => sandbox.restore())

  describe('#put', () => {
    it('should throw an error if input is not a string', async () => {
      try {
        uut.put(1234)

        assert.fail('Unexpected code path')
      } catch (err) {
        assert.equal(err.message, 'key must be a string')
      }
    })
  })

  describe('#get', () => {
    it('should get tx data cache on second call', async () => {
      // Mock devDependencies
      sandbox
        .stub(uut.transaction, 'get')
        .onCall(0)
        .resolves({ blockheight: 543957 })
        .onCall(1)
        .rejects(new Error('Unexpected code path'))

      const txid =
        '6bc111fbf5b118021d68355ca19a0e77fa358dd931f284b2550f79a51ab4792a'

      let result = await uut.get(txid)
      // console.log('result: ', result)

      result = await uut.get(txid)

      assert.equal(result.blockheight, 543957)

      // If data doesn't come from the cache on the second call, the mock above
      // will throw an error.
    })

    it('should get tx data from full-node on first call', async () => {
      // Mock dependencies and force desired code path
      sandbox.stub(uut.transaction, 'get').resolves({
        txid: '6bc111fbf5b118021d68355ca19a0e77fa358dd931f284b2550f79a51ab4792a',
        blockheight: 543957
      })

      const txid =
        '6bc111fbf5b118021d68355ca19a0e77fa358dd931f284b2550f79a51ab4792a'

      const result = await uut.get(txid)
      // console.log('result: ', result)

      assert.equal(result.blockheight, 543957)
    })

    it('should increment and report the cacheCnt', async () => {
      // Mock devDependencies
      sandbox
        .stub(uut.transaction, 'get')
        .onCall(0)
        .resolves({ blockheight: 543957 })
        .onCall(1)
        .rejects(new Error('Unexpected code path'))

      const txid =
        '6bc111fbf5b118021d68355ca19a0e77fa358dd931f284b2550f79a51ab4792a'

      // Force count to be 99, so that it rolls over to 100.
      uut.cacheCnt = 99

      await uut.get(txid)
      // const result = await uut.get(txid)
      // console.log('result: ', result)

      // console.log(`uut.cacheCnt: ${uut.cacheCnt}`)
      assert.equal(uut.cacheCnt, 100)
    })

    it('should clear the cache when it gets too big', async () => {
      // Mock devDependencies
      sandbox
        .stub(uut.transaction, 'get')
        .onCall(0)
        .resolves({ blockheight: 543957 })
        .onCall(1)
        .rejects(new Error('Unexpected code path'))

      const txid =
        '6bc111fbf5b118021d68355ca19a0e77fa358dd931f284b2550f79a51ab4792a'

      // Force count to be 99, so that it rolls over to 100.
      uut.cacheCnt = 9999999999

      await uut.get(txid)
      // const result = await uut.get(txid)
      // console.log('result: ', result)

      // console.log(`uut.cacheCnt: ${uut.cacheCnt}`)
      assert.equal(uut.cacheCnt, 0)
    })
  })

  describe('#delete', () => {
    it('should delete key from cache', () => {
      uut.delete('test')

      assert.isOk('Not throwing an error is a pass')
    })
  })
})
