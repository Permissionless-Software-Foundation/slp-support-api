/*
  This library contains business-logic for dealing with SLP transactions. Most
  of these functions are called by the /slp REST API endpoints.
*/

// import UserEntity from '../entities/user.js'

import wlogger from '../adapters/wlogger.js'

class SlpUseCases {
  constructor (localConfig = {}) {
    // console.log('User localConfig: ', localConfig)
    this.adapters = localConfig.adapters
    if (!this.adapters) {
      throw new Error(
        'Instance of adapters must be passed in when instantiating SLP Use Cases library.'
      )
    }

    // Encapsulate dependencies
    // this.UserEntity = new UserEntity()
    // this.UserModel = this.adapters.localdb.Users
  }

  async filterAndSortSlpTxs (inObj = {}) {
    try {
      const { txids, blockHeight } = inObj

      // Input validation
      if (!Array.isArray(txids)) {
        throw new Error('txids input to filterAndSortSlpTxs() must be an array of TXIDs.')
      }
      if (!blockHeight) {
        throw new Error(`blockHeight input to filterAndSortSlpTxs() must contain a non-zero number representing the block height. Recieved: ${blockHeight}`)
      }

      const combined = []
      const nonSlpTxs = []
      const filteredTxs = { combined, nonSlpTxs }

      return filteredTxs
    } catch (err) {
      wlogger.error('Error in use-cases/slp.js/filterAndSortSlpTxs(): ', err)
      throw err
    }
  }
}

export default SlpUseCases
