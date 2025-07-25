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
`