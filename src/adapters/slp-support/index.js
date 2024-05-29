/*
*/

// Global npm libraries

// Local libraries
import RPC from './rpc.js'
import Blacklist from './blacklist.js'
import Transaction from './transaction.js'
import Cache from './cache.js'
import Utils from './utils.js'

class SlpSupportAdapter {
  constructor () {
    // Encapsulate dependencies
    this.rpc = new RPC()
    this.blacklist = new Blacklist()
    this.transaction = new Transaction()
    this.cache = new Cache()
    this.utils = new Utils()
  }

  getStatus () {
    return {
      success: true
    }
  }
}

export default SlpSupportAdapter
