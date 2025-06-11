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
                        meta
                    }
                    token
                }
            }
        }
`