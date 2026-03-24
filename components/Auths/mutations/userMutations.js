import { gql } from "@apollo/client";


export const AUTHORIZE_WITH_SOCIAL_CODE = gql`
    mutation AuthenticateUserWithAuthCode(
        $code: String!, $socialType: SignInWithEnum!, $authType: String!
        ){
            authorizeWithCode(code: $code, socialType: $socialType, authType: $authType){
                message
                data{
                    user{
                        email
                        firstName
                        lastName
                        username
                        fullName
                        meta
                        userType
                    }
                    token
                }
            }
        }
`;

export const SIGNUP = gql`
    mutation SignUp(
    $signUpWith: SignInWithEnum,
    $data: AuthInputType
        ){
            signup(
                signUpWith: $signUpWith, data: $data
            ){
                message
                
                data{
                token
                    authUrl
                    user{
                        id
                        email
                        firstName
                        lastName
                        username
                        fullName
                        password
                        userType
                    }
                }
            }
        }
`;

export const UpdateUserMutation = gql`
mutation UpdateUser($data: UpdateUserInputType!){
    updateUser(data: $data){
        message
        user{
            id
            email
            firstName
            lastName
            username
            meta
            userType
            businesses{
                id
                name
                country
                address
                currency
            }
        }
    }
}
`;

export const LOGIN_WITH_S = gql`
    mutation login(
    $signInWith: SignInWithEnum,
        ){
            login(
                signInWith: $signInWith,
            ){
                message
                token
                data{
                    authUrl
                    user{
                        id
                        email
                        firstName
                        lastName
                        username
                        fullName
                        password
                        userType
                    }
                }
            }
        }
`;

export const LOGIN = gql`
mutation Login($signinWith: SignInWithEnum, $email: String, $password: String){
    login(signInWith: $signinWith, email: $email, password: $password){
        message
        data{
            authUrl
            user{
                id
                email
                firstName
                lastName
                username
                fullName
                meta
                userType
            }
            token
        }
    }
}
`;

export const CREATE_STORE = gql`

mutation createBusiness(
    $data: CreateBusinessInputType!, $financialAssets: [AssetInputType]
){
    createBusiness(data: $data, financialAssets: $financialAssets){
       message
       business{
        id
        name
        address
        owner{
            email
        }
        location
       }
    }
}
`

export const CREATE_TRANSACTION = gql`
mutation InitiateTransaction($transactionData: InitiateTransactionInputType!){
    initiateTransaction(
        transactionData: $transactionData
    ){
        message
        transaction{
            id
            status
            business{
                id
                name
                location
            }
            client{
                id
                email
                username
                userType
            }
            vendor{
                id
                email
                username
                userType
            }
            collectionMode
            txnLocation
            amount
            charge
            currency
        }
    }
}
`;

export const UPDATE_TRANSACTION_STATUS = gql`
  mutation UpdateTransactionStatus($id: String!, $status: TxnStatusType!) {
    updateTransactionStatus(txnId: $id, status: $status) {
      message
    }
  }
`;

export const CREATE_TRANSACTION_POLICY = gql`
  mutation CreateTransactionPolicy($businessId: String!, $data: CreateTransactionPolicyInputType!) {
    createTransactionPolicy(businessId: $businessId, data: $data) {
      message
      policy {
        id
        name
        description
        cashCollectionMode
        meetUpCharge
        dateCreated
        business {
          id
          name
        }
      }
    }
  }
`;

export const CREATE_CLIENT_CATEGORY = gql`
  mutation CreateClientCategory($businessId: String!, $categoryInfo: CreateClientCategoryInputType!) {
    createClientCategory(businessId: $businessId, categoryInfo: $categoryInfo) {
      message
      category {
        id
        name
        description
        txnPolicy {
          id
          name
          cashCollectionMode
          meetUpCharge
          meta
        }
        businessclientSet {
          id
          client {
            id
            fullName
            email
          }
          business {
            id
          }
        }
      }
    }
  }
`;

export const ADD_CLIENTS_TO_CATEGORY = gql`
  mutation AddClientsToCategory($data: AddClientsToCategoryInputType!) {
    addClientsToACategory(data: $data) {
      message
      categoryClients {
        id
        category {
          name
          description
        }
        client {
          email
          firstName
          lastName
        }
        business {
          id
          name
        }
      }
    }
  }
`;

export const UPDATE_STORE = gql`

mutation updateBusiness(
    $updateData: UpdateBusinessInputType!, $businessId: String!, $financialAssets: [AssetInputType]
){
    updateBusiness(updateData: $updateData, businessId: $businessId, financialAssets: $financialAssets){
       message
       business{
        id
        name
        address
        owner{
            email
        }
        location
       }
    }
}
`

export const UPDATE_ASSET = gql`
mutation updateFinancialAsset(
    $id: String!, $data: [AssetInputType]!
){
    updateFinancialAsset(assetId: $id, data: $data){
       message
       asset{
        id
        range
        chargeRate
       }
    }
}
`
export const UPDATE_NOTIFICATION = gql`
mutation UpdateNotification(
    $notificationId: String!,
    $status: NotificationEnum!
){
    updateNotification(
        notificationId: $notificationId,
        status: $status
    ){
        message
        notification{
            id
            title
            status
            message
            dateCreated
            lastUpdated
        }
    }
}

`

export const UPDATE_BUSINESS = gql`

mutation UpdateBusiness(
    $businessId: String!, $updateData: UpdateBusinessInputType,
    $financialAssets: [AssetInputType]
){
    updateBusiness(
        businessId: $businessId, updateData: $updateData
        financialAssets: $financialAssets
    ){
        message
        business{
            id
            name
            parentBusinessId
            address
            location
            isOnline
            assets{
                id
                range
                chargeRate
            }
            owner{
                email
            }
        }
    }
}`;

export const RESPOND_TO_TRANSACTION = gql`
mutation RespondToDelayedTransaction(
    $txnId: String!,
    $decision: DelayedTransactionResponseEnum
){
    respondToDelayedTransaction(
        txnId: $txnId,
        decision: $decision
    ){
        message
    }
}

`;

export const GENERATE_VIRTUAL_ACCOUNT = gql`
  mutation GenerateVirtualAccount($txnId: String!) {
    generateVirtualAccount(txnId: $txnId) {
      message
      accountInfo {
        accountNumber
        accountBankName
        accountName
        amount
        reference
        accountExpirationDatetime
        note
        provider
        currency
      }
    }
  }
`;

export const ACCEPT_TRANSACTION_OPPORTUNITY = gql`
  mutation AcceptTransactionOpportunity(
    $txnId: String
    $txnRef: String
    $businessId: String
  ) {
    acceptTransactionOpportunity(txnId: $txnId, txnRef: $txnRef, businessId: $businessId) {
      message
    }
  }
`;