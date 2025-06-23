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
                    authUrl
                    user{
                        id
                        email
                        firstName
                        lastName
                        username
                        password
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
                        password
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
                meta
            }
            token
        }
    }
}
`;