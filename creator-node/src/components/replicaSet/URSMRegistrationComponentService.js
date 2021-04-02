const axios = require('axios')
const { promisify } = require('util')
const crypto = require('crypto')
const randomBytes = promisify(crypto.randomBytes)
const { Utils: LibsUtils } = require('@audius/libs')

const {
  parseCNodeResponse,
  ErrorServerError,
  ErrorBadRequest
} = require('../../apiHelpers')
const { recoverWallet, signatureHasExpired } = require('../../apiSigning')

/**
 * This function is part of the L2 UserReplicaSetManager contract (URSM) chain of trust node registration flow.
 *    A requesting node submits a request for signature to self (proposer node) which it uses to submit as
 *    part of the contract addOrUpdateContentNode transaction.
 *
 * Steps:
 *  1. Fetch node info from L1 ServiceProviderFactory for spID
 *    a. Reject if node is not registered as valid SP
 *    b. Short circuit if L2 record for node already matches L1 record (i.e. delegateOwnerWallets match)
 *  2. Confirm request was signed by delegate owner wallet registered on L1 for spID, given request signature artifacts
 *  3. Confirm SP is within valid stake bounds on L1 ServiceProviderFactory
 *  4. Confirm health check returns healthy and response data matches on-chain data
 *    a. Confirm health check response was signed by delegate owner wallet registered on L1 for spID
 *  5. Generate & return proposal signature artifacts
 *
 * @param {ServiceRegistry} serviceRegistry
 * @param {*} logger
 * @param {number} spID L1 spID of requesting node, used by self (proposer node) in validation
 * @param {string} reqTimestamp timestamp when reqSignature was generated, used in public key recovery
 * @param {string} reqSignature signature generated by requesting node, used in public key recovery
 */
const respondToURSMRequestForSignature = async ({ libs: audiusLibs, nodeConfig }, logger, spID, reqTimestamp, reqSignature) => {
  if (!spID || !reqTimestamp || !reqSignature) {
    throw new ErrorBadRequest('Must provide all required query parameters: spID, timestamp, signature')
  }

  spID = parseInt(spID)

  /**
   * Fetch node info from L1 ServiceProviderFactory for spID
   */
  const spRecordFromSPFactory = await audiusLibs.ethContracts.ServiceProviderFactoryClient.getServiceEndpointInfo(
    'content-node',
    spID
  )
  let {
    owner: ownerWalletFromSPFactory,
    delegateOwnerWallet: delegateOwnerWalletFromSPFactory,
    endpoint: nodeEndpointFromSPFactory
  } = spRecordFromSPFactory
  delegateOwnerWalletFromSPFactory = delegateOwnerWalletFromSPFactory.toLowerCase()

  /**
   * Reject if node is not registered as valid SP on L1 ServiceProviderFactory
   */
  if (
    LibsUtils.isZeroAddress(ownerWalletFromSPFactory) ||
    LibsUtils.isZeroAddress(delegateOwnerWalletFromSPFactory) ||
    !nodeEndpointFromSPFactory
  ) {
    throw new ErrorBadRequest(`SpID ${spID} is not registered as valid SP on L1 ServiceProviderFactory`)
  }

  /**
   * Short-circuit if L2 record already matches L1 record (i.e. delegateOwnerWallets match)
   */
  const delegateOwnerWalletFromURSM = (
    (await audiusLibs.contracts.UserReplicaSetManagerClient.getContentNodeWallets(spID))
      .delegateOwnerWallet
  ).toLowerCase()
  if (delegateOwnerWalletFromSPFactory === delegateOwnerWalletFromURSM) {
    throw new ErrorBadRequest(
      `No-op - UserReplicaSetManager record for node with spID ${spID} already matches L1 ServiceProviderFactory record`
    )
  }

  /**
   * Confirm request was signed by delegate owner wallet registered on L1 for spID, given request signature artifacts
   */
  let requesterWalletRecoveryObj = { spID, timestamp: reqTimestamp }
  let recoveredDelegateOwnerWallet = (recoverWallet(requesterWalletRecoveryObj, reqSignature)).toLowerCase()
  if (delegateOwnerWalletFromSPFactory !== recoveredDelegateOwnerWallet) {
    throw new ErrorBadRequest(
      'Request for signature must be signed by delegate owner wallet registered on L1 for spID'
    )
  }

  /**
   * Confirm service provider is within valid stake bounds on L1 ServiceProviderFactory
   */
  const spDetailsFromSPFactory = await audiusLibs.ethContracts.ServiceProviderFactoryClient.getServiceProviderDetails(
    ownerWalletFromSPFactory
  )
  if (!spDetailsFromSPFactory.validBounds) {
    throw new ErrorBadRequest('ServiceProvider for given spID is not within valid bounds on L1 ServiceProviderFactory')
  }

  /**
   * Request node's up-to-date health info
   *  - uses endpoint registered on L1 for spID
   *  - passes `randomBytesToSign` string in request to check that response was signed for provided data
   */
  const randomBytesToSign = (await randomBytes(18)).toString()
  const nodeHealthCheckResp = await axios({
    baseURL: nodeEndpointFromSPFactory,
    url: '/health_check',
    method: 'get',
    timeout: 1000,
    params: {
      randomBytesToSign
    }
  })
  const { responseData, signatureData } = parseCNodeResponse(
    nodeHealthCheckResp,
    ['healthy', 'creatorNodeEndpoint', 'spID', 'spOwnerWallet', 'randomBytesToSign']
  )

  /**
   * Confirm health check returns healthy and response data matches on-chain data
   */
  if (
    !(responseData.healthy) ||
    (responseData.creatorNodeEndpoint !== nodeEndpointFromSPFactory) ||
    (responseData.spID !== spID) ||
    ((responseData.spOwnerWallet).toLowerCase() !== ownerWalletFromSPFactory.toLowerCase())
  ) {
    throw new ErrorServerError(
      `Content node health check response from endpoint ${nodeEndpointFromSPFactory} indicates unhealthy or misconfigured`
    )
  }

  /**
   * Confirm health check response was signed by delegate owner wallet registered on L1
   *    for spID and includes `randomBytesToSign`
   */
  const {
    timestamp,
    signature,
    signer
  } = signatureData
  if (signatureHasExpired(timestamp)) {
    throw new ErrorBadRequest('Health check response signature has expired')
  }
  const responderWalletRecoveryObj = {
    data: responseData,
    signer,
    timestamp
  }
  const recoveredDelegateOwnerWallet2 = (recoverWallet(responderWalletRecoveryObj, signature)).toLowerCase()
  if (delegateOwnerWalletFromSPFactory !== recoveredDelegateOwnerWallet2) {
    throw new ErrorBadRequest(
      'Health check response must be signed by delegate owner wallet registered on L1 for spID'
    )
  }

  /**
   * Generate proposal signature artifacts
   */
  const proposalSignatureInfo = await audiusLibs.contracts.UserReplicaSetManagerClient.getProposeAddOrUpdateContentNodeRequestData(
    /* new node L1 spID */ spID,
    /* new node L1 delegateOwnerWallet */ delegateOwnerWalletFromSPFactory,
    /* proposing node (self) ownerWallet */ ownerWalletFromSPFactory,
    /* proposing node (self) L1 spID */ nodeConfig.get('spID')
  )

  return {
    nonce: proposalSignatureInfo.nonce,
    sig: proposalSignatureInfo.sig,
    spID: nodeConfig.get('spID') /* spID of self */
  }
}

module.exports = {
  respondToURSMRequestForSignature
}
