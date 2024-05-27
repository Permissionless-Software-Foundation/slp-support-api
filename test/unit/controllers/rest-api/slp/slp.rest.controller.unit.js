/*
  Unit tests for the REST API handler for the /ipfs endpoints.
*/

// Public npm libraries
import { assert } from 'chai'
import sinon from 'sinon'

// Local libraries
import SlpApiController from '../../../../../src/controllers/rest-api/slp/controller.js'
import adapters from '../../../mocks/adapters/index.js'
import UseCasesMock from '../../../mocks/use-cases/index.js'

import { context as mockContext } from '../../../mocks/ctx-mock.js'
let uut
let sandbox
let ctx

describe('#SLP REST API', () => {
  before(async () => {
  })

  beforeEach(() => {
    const useCases = new UseCasesMock()

    uut = new SlpApiController({ adapters, useCases })

    sandbox = sinon.createSandbox()

    // Mock the context object.
    ctx = mockContext()
  })

  afterEach(() => sandbox.restore())

  describe('#constructor', () => {
    it('should throw an error if adapters are not passed in', () => {
      try {
        uut = new SlpApiController()

        assert.fail('Unexpected code path')
      } catch (err) {
        assert.include(
          err.message,
          'Instance of Adapters library required when instantiating /slp REST Controller.'
        )
      }
    })

    it('should throw an error if useCases are not passed in', () => {
      try {
        uut = new SlpApiController({ adapters })

        assert.fail('Unexpected code path')
      } catch (err) {
        assert.include(
          err.message,
          'Instance of Use Cases library required when instantiating /slp REST Controller.'
        )
      }
    })
  })

  describe('#GET /status', () => {
    it('should return 422 status on biz logic error', async () => {
      try {
        // Force an error
        sandbox.stub(uut.adapters.slp, 'getStatus').throws(new Error('test error'))

        await uut.getStatus(ctx)

        assert.fail('Unexpected result')
      } catch (err) {
        assert.equal(err.status, 422)
        assert.include(err.message, 'test error')
      }
    })

    it('should return 200 status on success', async () => {
      // Mock dependencies
      sandbox.stub(uut.adapters.slp, 'getStatus').returns({ a: 'b' })

      await uut.getStatus(ctx)
      // console.log('ctx.body: ', ctx.body)

      assert.property(ctx.body, 'status')
      assert.equal(ctx.body.status.a, 'b')
    })
  })
})
