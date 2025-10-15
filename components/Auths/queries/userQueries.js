import { gql } from "@apollo/client";


export const CURRENT_USER = gql`
    query CurrentUser{
        user{
            id
            email
            firstName
            lastName
            username
            meta
            userType
            businesses {
            id
            name
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
      dateCreated
      vendor {
        firstName
        lastName
        email
      }
      client {
        firstName
        lastName
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