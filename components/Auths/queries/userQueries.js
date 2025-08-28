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