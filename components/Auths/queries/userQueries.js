import { gql } from "@apollo/client";


export const CURRENT_USER = gql`
    query CurrentUser{
        user{
            id
            email
            firstName
            lastName
            username
            fullName
            meta
            userType
            businesses {
            id
            name
            isPrimary
            }
            
        }    
    }
`;

export const VENDOR_LIST = gql`
query VendorsNearMe(
    $currentLat: Float!, $currentLong: Float!
){
    businessesAroundMe(
        currentLat: $currentLat, currentLong: $currentLong
    ){
        id
        name
        description
        address
        location
        distance
        nearest
    }
}`;

export const GET_VENDOR_POLICIES = gql`
query businessTransactionPolicyForUser(
    $businessId: String!, 
){
    businessTransactionPolicyForUser(
        businessId: $businessId, 
    ){
       id
        name
        cashCollectionMode
        meetUpCharge
        meta
    }
}`;
export const GET_ASSETS = gql`
query BusinessAssets(
    $businessId: String,
    $location: String,
    $range: String,
    $chargeRate: Float
){
    businessAssets(
        businessId: $businessId,
        location: $location,
        range: $range,
        chargeRate: $chargeRate
    ){
        business{
            name
            country
            address
        }
        id
        range
        chargeRate
    }
}
`;


export const GET_TRANSACTIONS = gql`
  query GetTransactions(
    $status: String
    $businessId: String
    $walletId: String
    $search: String
    $pageCount: Int
    $pageNumber: Int
  ) {
    transactions(
      status: $status
      businessId: $businessId
      walletId: $walletId
      search: $search
      pageCount: $pageCount
      pageNumber: $pageNumber
    ) {
      id
      description
      status
      amount
      dateCreated
      vendor {
        firstName
        lastName
        fullName
        email
      }
      client {
        firstName
        lastName
        fullName
      }
        business{
        id
        }
    }
    pagination
  }
`;


export const GET_SUB_BUSINESSES = gql`
  query Businesses(
    $address: String
    $id: String
    $name: String
    $ownerId: String
    $pageCount: Int
    $pageNumber: Int
  ) {
    businesses(
      address: $address
      id: $id
      name: $name
      ownerId: $ownerId
      pageCount: $pageCount
      pageNumber: $pageNumber
    ) {
      id
      name
      address
      location 
    }
  }
`;


export const FETCH_TRANSACTION_POLICIES = gql`
  query FetchBusinessTransactionPolicies(
    $id: String
    $name: String
    $businessId: String!
    $meetUpCharge: Float
    $cashCollectionMode: CashCollectionModes
  ) {
    businessTransactionPolicies(
      id: $id
      name: $name
      businessId: $businessId
      meetUpCharge: $meetUpCharge
      cashCollectionMode: $cashCollectionMode
    ) {
      id
      name
      description
      cashCollectionMode
      meetUpCharge
      dateCreated
      lastUpdated
      business {
        id
        name
      }
    }
  }
`;

export const FETCH_BUSINESS_CLIENTS = gql`
  query BusinessClients($businessId: String, $categoryId: String) {
    businessClients(businessId: $businessId, categoryId: $categoryId) {
      client {
        id
        email
        firstName
        lastName
        username
        fullName
      }
      category {
        id
        name
      }
      business {
        id
        name
      }
      lastPatronized
    }
  }
`;

export const TRANSACTION_DETIALS = gql`
query Transactiion(
    $transactionId: String!
){
    transaction(
        transactionId: $transactionId
    ){
        id
        description
        status
        dateCreated
        lastUpdated
        amount
        charge
        currency
        collectionMode
        txnLocation
        meta
        business{
            id
            name
            address
        }
        vendor{
            id
            firstName
            lastName
            email
        }
        client{
             id
            firstName
            lastName
            email
        }
    }
}
`

export const GET_CATEGORIES = gql`
  query ClientCategories(
    $businessId: String!,
    $id: String, $search: String,
    $pageCount: Int, $pageNumber: Int
){
    categories(
        businessId: $businessId, id: $id,
        search: $search, pageCount: $pageCount,
        pageNumber: $pageNumber
    ){
        id
        name
        description
        business{
            id
            name
        }
        txnPolicy{
            id
            name
        }
        businessclientSet{
            client{
                id
                fullName
                email
            }
        }
      dateCreated
      lastUpdated
    }
    pagination
}`


export const GET_VENDORS = gql`
 query Vendors(
  $id: String, $search: String
){
  vendors(
    id: $id, search: $search
  ){
    id
    fullName
    email
    userType
  }
}
`

export const GET_CLIENTS = gql`
  query Clients(
    $id: String, $search: String
){
    clients(id: $id, search: $search){
      id
      fullName
      email
    }
  }
`