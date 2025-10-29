import { gql } from "@apollo/client";


export const GET_ANALYTICS = gql`
    query Analytics(
        $userType: String!
        $businessId: String
    ){
        analytics(userType: $userType, businessId: $businessId){
            totalTransactions
            fulfilledTransactions
            currentMonthTransactions
            totalTransactionValue
            currentMonthTransactionValue
            percentageReductionFromPastMonth
            totalChargesPlusExtra
            extraCharges
        }
    }
`

export const GET_TRANSACTION = gql`
    query Transaction($transactionId: String!){
        transaction(transactionId: $transactionId){
            id
            txnRef
            amount
            charge
            description
            status
            collectionMode
            txnLocation
            discounted
            meta
            dateCreated
            lastUpdated
            business{
                id
                name
                address
            }
            vendor{
                id
                fullName
                firstName
                lastName
                email
            }
            client{
                id
                fullName
                firstName
                lastName
                email
            }
        }
    }
`