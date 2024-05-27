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
}

export default SlpSupportAdapter
