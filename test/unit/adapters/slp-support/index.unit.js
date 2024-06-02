/*
  Unit tests for the main index.js library for slp-support adapters.
*/

// Global npm libraries
import { assert } from 'chai'
import sinon from 'sinon'

// Local libraries
import SlpSupportAdapter from '../../../../src/adapters/slp-support/index.js'

describe('#SlpSupportAdapter', () => {
  let uut, sandbox

  beforeEach(() => {
    // Restore the sandbox before each test.
    sandbox = sinon.createSandbox()

    uut = new SlpSupportAdapter()
  })

  afterEach(() => sandbox.restore())

  describe('#getStatus', () => {
    it('should return success', () => {
      const result = uut.getStatus()

      assert.equal(result.success, true)
    })
  })
})
