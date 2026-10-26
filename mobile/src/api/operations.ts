import { gql } from "@apollo/client";

export const CURRENT_USER = gql`
  query CurrentUser {
    user {
      id
      email
      firstName
      lastName
      username
      fullName
      meta
      userType
      businesses { id name isPrimary }
      phoneNumber
    }
  }
`;

export const LOGIN = gql`
  mutation Login($email: String, $password: String) {
    login(email: $email, password: $password) {
      message
      data {
        token
        user {
          id email firstName lastName username fullName meta userType
        }
      }
    }
  }
`;

export const SIGNUP = gql`
  mutation SignUp($data: AuthInputType) {
    signup(data: $data) {
      message
      data {
        token
        user { id email firstName lastName username fullName userType }
      }
    }
  }
`;

export const GOOGLE_LOGIN_URL = gql`
  mutation GoogleLoginUrl($signInWith: SignInWithEnum) {
    login(signInWith: $signInWith) {
      message
      data { authUrl }
    }
  }
`;

export const GOOGLE_SIGNUP_URL = gql`
  mutation GoogleSignupUrl($signUpWith: SignInWithEnum) {
    signup(signUpWith: $signUpWith) {
      message
      data { authUrl }
    }
  }
`;

export const AUTHORIZE_WITH_SOCIAL_CODE = gql`
  mutation AuthorizeWithSocialCode($code: String!, $socialType: SignInWithEnum!, $authType: String!) {
    authorizeWithCode(code: $code, socialType: $socialType, authType: $authType) {
      message
      data {
        token
        user { id email firstName lastName username fullName meta userType }
      }
    }
  }
`;

export const UPDATE_USER = gql`
  mutation UpdateUser($data: UpdateUserInputType!) {
    updateUser(data: $data) { message user { id email firstName lastName userType businesses { id name isPrimary } } }
  }
`;

export const CREATE_BUSINESS = gql`
  mutation CreateBusiness($data: CreateBusinessInputType!, $financialAssets: [AssetInputType]) {
    createBusiness(data: $data, financialAssets: $financialAssets) {
      message
      business { id name address country businessType currency }
    }
  }
`;

export const UPDATE_BUSINESS_TYPE = gql`
  mutation NormalizeBusinessType($businessId: String!, $updateData: UpdateBusinessInputType, $financialAssets: [AssetInputType]) {
    updateBusiness(businessId: $businessId, updateData: $updateData, financialAssets: $financialAssets) {
      message business { id businessType }
    }
  }
`;

export const VENDOR_LIST = gql`
  query VendorsNearMe(
    $currentLat: Float!, $currentLong: Float!, $vendorType: String,
    $collectionMode: String, $pageCount: Int, $pageNumber: Int
  ) {
    businessesAroundMe(
      currentLat: $currentLat, currentLong: $currentLong,
      vendorType: $vendorType, collectionMode: $collectionMode,
      pageCount: $pageCount, pageNumber: $pageNumber
    ) {
      businesses {
        id name description address location distance nearest isOnline
        businessPolicyForCurrentUser { cashCollectionMode }
      }
      pagination { totalPages currentPage }
    }
  }
`;

export const GET_VENDOR_POLICY_FOR_USER = gql`
  query VendorPolicy($businessId: String!) {
    businessTransactionPolicyForUser(businessId: $businessId) {
      id name cashCollectionMode meetUpCharge meta
    }
  }
`;

export const GET_ASSETS = gql`
  query BusinessAssets($businessId: String, $location: String, $range: String) {
    businessAssets(businessId: $businessId, location: $location, range: $range) {
      id range chargeRate business { name country address }
    }
  }
`;

export const GET_TRANSACTIONS = gql`
  query GetTransactions(
    $status: String, $businessId: String, $clientId: String, $vendorId: String,
    $dateFrom: Date, $dateTo: Date, $requestType: String,
    $pageCount: Int, $pageNumber: Int, $txnType: String
  ) {
    transactions(
      status: $status, businessId: $businessId, clientId: $clientId, vendorId: $vendorId,
      dateFrom: $dateFrom, dateTo: $dateTo, requestType: $requestType,
      pageCount: $pageCount, pageNumber: $pageNumber, txnType: $txnType
    ) {
      transactions {
        id description status amount dateCreated charge currency txnType meta
        transferMode awaitingTransfer
        vendor { firstName lastName fullName email }
        client { id firstName lastName fullName }
        business { id name }
      }
      pagination { totalPages currentPage }
    }
  }
`;

export const GET_VENDORS = gql`
  query Vendors($vendorId: String, $search: String, $pageCount: Int, $pageNumber: Int) {
    vendors(vendorId: $vendorId, search: $search, pageCount: $pageCount, pageNumber: $pageNumber) {
      id name owner { id fullName email }
    }
    vendorsPagination: pagination { totalPages currentPage }
  }
`;

export const GET_CLIENTS = gql`
  query Clients($vendorId: String!, $clientId: String, $businessId: String!, $pageCount: Int, $pageNumber: Int) {
    clients(vendorId: $vendorId, clientId: $clientId, businessId: $businessId, pageCount: $pageCount, pageNumber: $pageNumber) {
      id fullName email
    }
    clientsPagination: pagination { totalPages currentPage }
  }
`;

export const GET_TRANSACTION = gql`
  query TransactionDetails($transactionId: String!) {
    transaction(transactionId: $transactionId) {
      id txnRef amount charge currency txnType description status collectionMode
      transferMode awaitingTransfer txnLocation discounted meta dateCreated lastUpdated
      business { id name address meta location }
      vendor { id fullName firstName lastName email meta phoneNumber }
      client { id fullName firstName lastName email meta phoneNumber }
    }
  }
`;

export const GET_TRANSACTION_POLICIES = gql`
  query BusinessTransactionPolicies($businessId: String!) {
    businessTransactionPolicies(businessId: $businessId) {
      id name description cashCollectionMode meetUpCharge maxDeliveryAmount
      maxDeliveryDistance dateCreated lastUpdated business { id name }
    }
  }
`;

export const CREATE_TRANSACTION_POLICY = gql`
  mutation CreateTransactionPolicy($businessId: String!, $data: CreateTransactionPolicyInputType!) {
    createTransactionPolicy(businessId: $businessId, data: $data) {
      message policy { id name description cashCollectionMode meetUpCharge maxDeliveryAmount maxDeliveryDistance }
    }
  }
`;

export const UPDATE_TRANSACTION_POLICY = gql`
  mutation UpdateTransactionPolicy($policyId: String!, $data: CreateTransactionPolicyInputType!) {
    updateTransactionPolicy(policyId: $policyId, data: $data) {
      message policy { id name description cashCollectionMode meetUpCharge maxDeliveryAmount maxDeliveryDistance }
    }
  }
`;

export const ACCEPT_PROPOSED_FX_RATE = gql`
  mutation AcceptProposedFxRate($txnId: String!, $rate: Float!, $vendorBusinessId: String!) {
    acceptProposedFxRate(txnId: $txnId, rate: $rate, vendorBusinessId: $vendorBusinessId) {
      message transaction { id status amount charge currency transferMode business { id name } }
    }
  }
`;

export const GENERATE_VIRTUAL_ACCOUNT = gql`
  mutation GenerateVirtualAccount($txnId: String!) {
    generateVirtualAccount(txnId: $txnId) {
      message accountInfo { accountNumber accountBankName accountName amount reference accountExpirationDatetime note provider currency }
    }
  }
`;

export const GET_SUB_BUSINESSES = gql`
  query Businesses($ownerId: String, $pageCount: Int, $pageNumber: Int) {
    businesses(ownerId: $ownerId, pageCount: $pageCount, pageNumber: $pageNumber) {
      businesses {
        id name address location isPrimary availableLiquidity currency businessType
        assets { range chargeRate id }
        description country
      }
      pagination { totalPages currentPage }
    }
  }
`;

export const GET_ANALYTICS = gql`
  query Analytics($userType: String!, $businessId: String) {
    analytics(userType: $userType, businessId: $businessId) {
      totalTransactions fulfilledTransactions currentMonthTransactions
      totalTransactionValue currentMonthTransactionValue
      percentageReductionFromPastMonth totalChargesPlusExtra extraCharges
    }
  }
`;

export const CREATE_TRANSACTION = gql`
  mutation InitiateTransaction($transactionData: InitiateTransactionInputType!) {
    initiateTransaction(transactionData: $transactionData) {
      message
      transaction {
        id status amount currency txnType transferMode
        business { id name }
      }
    }
  }
`;

// The backend argument is txn_id (Graphene exposes it as txnId).
export const UPDATE_TRANSACTION_STATUS = gql`
  mutation UpdateTransactionStatus($txnId: String!, $status: TxnStatusType!) {
    updateTransactionStatus(txnId: $txnId, status: $status) { message }
  }
`;

export const RESPOND_TO_TRANSACTION = gql`
  mutation RespondToDelayedTransaction($txnId: String!, $decision: DelayedTransactionResponseEnum) {
    respondToDelayedTransaction(txnId: $txnId, decision: $decision) { message }
  }
`;

export const ACCEPT_TRANSACTION_OPPORTUNITY = gql`
  mutation AcceptTransactionOpportunity(
    $txnId: String, $txnRef: String, $businessId: String,
    $proposedAmount: Float, $isVendorToVendor: Boolean, $proposedRate: Float
  ) {
    acceptTransactionOpportunity(
      txnId: $txnId, txnRef: $txnRef, businessId: $businessId,
      proposedAmount: $proposedAmount, isVendorToVendor: $isVendorToVendor,
      proposedRate: $proposedRate
    ) { message }
  }
`;

export const INITIATE_VENDOR_TO_VENDOR_TRANSACTION = gql`
  mutation InitiateVendorToVendorTransaction($data: InitiateVendorToVendorTransactionInputType!) {
    initiateVendorToVendorTransaction(data: $data) {
      message txn { id status amount currency }
    }
  }
`;

export const ACCEPT_PROPOSAL = gql`
  mutation AcceptProposal($txnId: String!, $vendorBusinessId: String!, $proposedAmount: Float!) {
    acceptProposedAmount(
      txnId: $txnId, vendorBusinessId: $vendorBusinessId,
      proposedAmount: $proposedAmount
    ) { message txn { id status amount currency } }
  }
`;
