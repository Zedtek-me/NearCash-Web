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