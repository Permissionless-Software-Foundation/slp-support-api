/*
*/

// Global npm libraries

// Local libraries
import RPC from './rpc.js'

class SlpSupportAdapter {
  constructor () {
    // Encapsulate dependencies
    this.rpc = new RPC()
  }

  getStatus () {
    return {
      success: true
    }
  }
}

export default SlpSupportAdapter
