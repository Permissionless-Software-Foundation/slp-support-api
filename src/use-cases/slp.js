/*
  This library contains business-logic for dealing with SLP transactions. Most
  of these functions are called by the /slp REST API endpoints.
*/

// Global npm libraries
import PQueue from 'p-queue'
import pRetry from 'p-retry'
// import BigNumber from 'bignumber.js'

// Local libraries
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
    this.pQueue = new PQueue({ concurrency: 20 })
    this.pRetry = pRetry

    // Bind 'this' object to all subfunctions.
    this.filterAndSortSlpTxs = this.filterAndSortSlpTxs.bind(this)
    this.filterSlpTxs = this.filterSlpTxs.bind(this)

    // State
    this.attempts = 5
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

      console.log(`txids before filtering: ${txids.length}`)

      // Filter out all the non-SLP transactions.
      const filteredData = await this.filterSlpTxs(txids)
      const slpTxs = filteredData.slpTxs
      const nonSlpTxs = filteredData.nonSlpTxs
      console.log(`txs in slpTxs prior to sorting: ${slpTxs.length}`)

      const filteredTxs = { slpTxs, nonSlpTxs }

      return filteredTxs
    } catch (err) {
      wlogger.error('Error in use-cases/slp.js/filterAndSortSlpTxs(): ', err)
      throw err
    }
  }

  // Filter out raw block transactions and return an array of txs that are
  // (unvalidated) SLP transactions.
  // An array of TXIDs are expected as input. An array of TXIDs are output.
  async filterSlpTxs (txids) {
    try {
      const slpTxs = []
      const nonSlpTxs = []
      // const utxosToDelete = []

      // Add Tx to slpTxs array if it passes the OP_RETURN check.
      // This function is used below with the queue.
      const processTx = async (txid) => {
        // Is the TX an SLP TX?
        let isSlp = await this.adapters.slp.transaction.getTokenInfo(txid)
        // console.log(`isSlp: ${JSON.stringify(isSlp, null, 2)}`)

        // Force TX to be non-token, if it *is* a token in the blacklist.
        if (isSlp) {
          const isInBlacklist = this.adapters.slp.blacklist.checkBlacklist(isSlp.tokenId)

          if (isInBlacklist) isSlp = false
        }

        if (isSlp) {
          slpTxs.push(txid)
        } else {
          // Non-token TX
          nonSlpTxs.push(txid)
        }
      }

      const promiseArray = []

      // Filter out all the non-SLP transactions.
      for (let i = 0; i < txids.length; i++) {
        const txid = txids[i]
        // console.log('txid: ', txid)

        // Create a promise that will automatically retry.
        const p1 = this.retryWrapper(processTx, txid)

        // Add the promise to the queue
        const thisPromise = this.pQueue.add(() => p1)

        // Add the queued promise to the array.
        promiseArray.push(thisPromise)
        // promiseArray.push(this.pQueue.add(() => this.transaction.getTokenInfo(txid)))
      }

      // TODO: Implement q-retry for when the full node throws an error.

      // Wait for all promises in the array to resolve.
      await Promise.all(promiseArray)

      // Wait for all the transactions in the block to be processed.
      // This should be redundent.
      await this.pQueue.onEmpty()

      return { slpTxs, nonSlpTxs }
    } catch (err) {
      console.error('Error in filterSlpTxs()')
      throw err
    }
  }

  // Wrap the p-retry library.
  // This function returns a promise that will resolve to the output of the
  // function 'funcHandle'.
  async retryWrapper (funcHandle, inputObj) {
    try {
      // console.log('retryWrapper inputObj: ', inputObj)

      if (!funcHandle) {
        throw new Error('function handler is required')
      }
      if (!inputObj) {
        throw new Error('input object is required')
      }
      // console.log('Entering retryWrapper()')

      // Add artificial delay to prevent 429 errors.
      // await this.sleep(this.retryPeriod)

      return this.pRetry(
        async () => {
          return await funcHandle(inputObj)
        },
        {
          onFailedAttempt: (error) => {
            console.log(
              `Attempt ${error.attemptNumber} failed. There are ${error.retriesLeft} tries left. `
            )
          },
          retries: this.attempts // Retry 5 times
        }
      )
    } catch (err) {
      console.error('Error in retryWrapper()')
      throw err
    }
  }
}

export default SlpUseCases
