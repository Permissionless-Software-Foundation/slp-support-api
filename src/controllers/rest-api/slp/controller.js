/*
  REST API Controller library for the /ipfs route
*/

// Global npm libraries

// Local libraries
import wlogger from '../../../adapters/wlogger.js'

class SlpRESTControllerLib {
  constructor (localConfig = {}) {
    // Dependency Injection.
    this.adapters = localConfig.adapters
    if (!this.adapters) {
      throw new Error(
        'Instance of Adapters library required when instantiating /slp REST Controller.'
      )
    }
    this.useCases = localConfig.useCases
    if (!this.useCases) {
      throw new Error(
        'Instance of Use Cases library required when instantiating /slp REST Controller.'
      )
    }

    // Encapsulate dependencies
    // this.UserModel = this.adapters.localdb.Users
    // this.userUseCases = this.useCases.user

    // Bind 'this' object to all subfunctions
    this.getStatus = this.getStatus.bind(this)
    this.filterAndSortSlpTxs = this.filterAndSortSlpTxs.bind(this)
  }

  /**
   * @api {get} /ipfs Get status on IPFS infrastructure
   * @apiPermission public
   * @apiName GetIpfsStatus
   * @apiGroup REST BCH
   *
   * @apiExample Example usage:
   * curl -H "Content-Type: application/json" -X GET localhost:5019/slp
   *
   */
  async getStatus (ctx) {
    try {
      const status = this.adapters.slp.getStatus()

      ctx.body = { status }
    } catch (err) {
      wlogger.error('Error in slp/controller.js/getStatus(): ')
      // ctx.throw(422, err.message)
      this.handleError(ctx, err)
    }
  }

  // Filter and sort block transactions, to make indexing more efficient
  // and easier to debug.
  async filterAndSortSlpTxs (ctx) {
    try {
      // const {txids, blockHeight} = ctx.request.body

      const filteredTxs = await this.useCases.slp.filterAndSortSlpTxs(ctx.request.body)

      ctx.body = filteredTxs
    } catch (err) {
      wlogger.error('Error in slp/controller.js/getPeers(): ')
      // ctx.throw(422, err.message)
      this.handleError(ctx, err)
    }
  }

  // DRY error handler
  handleError (ctx, err) {
    // If an HTTP status is specified by the buisiness logic, use that.
    if (err.status) {
      if (err.message) {
        ctx.throw(err.status, err.message)
      } else {
        ctx.throw(err.status)
      }
    } else {
      // By default use a 422 error if the HTTP status is not specified.
      ctx.throw(422, err.message)
    }
  }
}

// module.exports = IpfsRESTControllerLib
export default SlpRESTControllerLib
