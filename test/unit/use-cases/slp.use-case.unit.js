/*
  Unit tests for the src/use-cases/slp.js business logic library.
*/

// Public npm libraries
import { assert } from 'chai'
import sinon from 'sinon'

// Local support libraries
import SlpLib from '../../../src/use-cases/slp.js'
import adapters from '../mocks/adapters/index.js'

describe('#slp-use-case', () => {
  let uut
  let sandbox

  before(async () => {
    // Delete all previous users in the database.
    // await testUtils.deleteAllUsers()
  })

  beforeEach(() => {
    sandbox = sinon.createSandbox()

    uut = new SlpLib({ adapters })
  })

  afterEach(() => sandbox.restore())

  describe('#constructor', () => {
    it('should throw an error if adapters are not passed in', () => {
      try {
        uut = new SlpLib()

        assert.fail('Unexpected code path')
      } catch (err) {
        assert.include(
          err.message,
          'Instance of adapters must be passed in when instantiating SLP Use Cases library.'
        )
      }
    })
  })

  describe('#_retryWrapper', () => {
    it('should throw an error if function handler is not provided', async () => {
      try {
        await uut.retryWrapper()
        assert.fail('unexpected code path')
      } catch (err) {
        assert.include(err.message, 'function handler is required')
      }
    })

    it('should throw an error if input object  is not provided', async () => {
      try {
        const funcHandler = () => {}
        await uut.retryWrapper(funcHandler)
        assert.fail('unexpected code path')
      } catch (err) {
        assert.include(err.message, 'input object is required')
      }
    })

    it('should execute the given function.', async () => {
      const inputTest = 'test'
      // func mock to execute into the retry wrapper
      const funcHandle = sinon.spy()

      await uut.retryWrapper(funcHandle, inputTest)

      assert.equal(inputTest, funcHandle.getCall(0).args[0])
      assert.equal(funcHandle.callCount, 1)
    })

    it('should call handleValidationError() when p-retry error is thrown', async () => {
      try {
        const inputTest = 'test'
        const funcHandle = () => {
          throw new Error('test error')
        }
        uut.attempts = 1

        await uut.retryWrapper(funcHandle, inputTest)

        assert.fail('unexpected code path')
      } catch (err) {
        assert.include(err.message, 'test error')
      }
    })

    it('should retry the specific number of times before giving up', async () => {
      const inputTest = 'test'
      const funcHandle = () => {
        throw new Error('test error')
      }
      // func handler
      const spy = sinon.spy(funcHandle)

      // p-retry attempts
      const attempts = 1

      try {
        uut.attempts = attempts

        await uut.retryWrapper(spy, inputTest)

        assert.fail('unexpected code path')
      } catch (error) {
        assert.equal(spy.callCount, attempts + 1)
      }
    })
  })

  describe('#filterSlpTxs', () => {
    it('should filter SLP txs from block', async () => {
      // From block 652,276
      const txs = [
        '5d7001c04bfb21a3d45bb084269ce811bf11269bc020eb4146440ebd66057d4a',
        '01b2118775d84a48dec3d31c760fddd8abc44dad6073b26f72d57fbc636d912d',
        '38d5f98dbe7ff2f0205c1a370d5d587d8d98aa65ad60d7026e381e7ba559d5d0',
        'a0b18e78d60b8ead3a5c45a00a964d04c2a8c268d62043fccc644b0efdcf5dd8',
        'e05035a3719559fa4627016fd1edb2cc490092c906a3415394a16b0d0add8178'
      ]

      // The first 4 blocks are not SLP. The 5th is.
      sandbox
        .stub(uut.adapters.slp.transaction, 'getTokenInfo')
        .onCall(0)
        .resolves(false)
        .onCall(1)
        .resolves(false)
        .onCall(2)
        .resolves(false)
        .onCall(3)
        .resolves(false)
        .onCall(4)
        .resolves(true)
      // sandbox.stub(uut, 'deleteBurnedUtxos').resolves(true)

      const { slpTxs, nonSlpTxs } = await uut.filterSlpTxs(txs)
      // console.log(slpTxs)

      assert.isArray(slpTxs)
      assert.isArray(nonSlpTxs)
      assert.equal(slpTxs.length, 1)
      assert.equal(slpTxs[0], txs[4])
    })

    it('should catch and throw errors', async () => {
      try {
        // From block 652,276
        const txs = [
          '5d7001c04bfb21a3d45bb084269ce811bf11269bc020eb4146440ebd66057d4a',
          '01b2118775d84a48dec3d31c760fddd8abc44dad6073b26f72d57fbc636d912d',
          '38d5f98dbe7ff2f0205c1a370d5d587d8d98aa65ad60d7026e381e7ba559d5d0',
          'a0b18e78d60b8ead3a5c45a00a964d04c2a8c268d62043fccc644b0efdcf5dd8',
          'e05035a3719559fa4627016fd1edb2cc490092c906a3415394a16b0d0add8178'
        ]

        // Force an error
        sandbox
          .stub(uut.adapters.slp.transaction, 'getTokenInfo')
          .rejects(new Error('test error'))

        // Force retry to be 0.
        uut.attempts = 0

        await uut.filterSlpTxs(txs)

        assert.fail('Unexpected code path')
      } catch (err) {
        assert.equal(err.message, 'test error')
      }
    })
  })

  describe('#filterAndSortSlpTxs2', () => {
    it('should filter and sort a combination of independent and chained txs', async () => {
      const blockHeight = 543413
      const txids = [
        '170147548aad6de7c1df686c56e4846e0936c4573411b604a18d0ec76482dde2',
        '82a9c47118dd221bf528e8b9ee9daef626ca52fb824b92cbe52a83e87afb0fac',
        'e5ff3083cd2dcf87a40a4a4a478349a394c1a1eeffe4857c2a173b183fdd42a2'
      ]

      // Mock dependencies
      sandbox.stub(uut, 'filterSlpTxs').resolves({ slpTxs: txids, nonSlpTxs: [] })

      const result = await uut.filterAndSortSlpTxs({ txids, blockHeight })
      // console.log(`result: ${JSON.stringify(result, null, 2)}`)

      assert.equal(result.slpTxs.length, 3)
      assert.equal(result.nonSlpTxs.length, 0)
    })

    it('should return an empty array if given an empty array', async () => {
      const blockHeight = 543413
      const txids = []

      const result = await uut.filterAndSortSlpTxs({ txids, blockHeight })
      // console.log(`result: ${JSON.stringify(result, null, 2)}`)

      assert.equal(result.slpTxs.length, 0)
      assert.equal(result.nonSlpTxs.length, 0)
    })

    it('should throw an error if txids is not an array', async () => {
      try {
        const blockHeight = 543413
        const txids = 'string'

        await uut.filterAndSortSlpTxs({ txids, blockHeight })

        assert.fail('Unexpected code path')
      } catch (err) {
        assert.include(err.message, 'txids input to filterAndSortSlpTxs() must be an array of TXIDs.')
      }
    })

    it('should throw an error blockHeight is undefined', async () => {
      try {
        const blockHeight = undefined
        const txids = []

        await uut.filterAndSortSlpTxs({ txids, blockHeight })

        assert.fail('Unexpected code path')
      } catch (err) {
        assert.include(err.message, 'blockHeight input to filterAndSortSlpTxs() must contain a non-zero number representing the block height.')
      }
    })

    it('should catch and throw errors', async () => {
      try {
        // Force an error
        sandbox.stub(uut, 'filterSlpTxs').rejects(new Error('test error'))

        const blockHeight = 543413
        const txids = []

        await uut.filterAndSortSlpTxs({ txids, blockHeight })

        assert.fail('Unexpected code path')
      } catch (err) {
        assert.include(err.message, 'test error')
      }
    })
  })
})
