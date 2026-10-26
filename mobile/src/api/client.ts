import {
  ApolloClient,
  ApolloLink,
  HttpLink,
  InMemoryCache,
} from "@apollo/client";
import { setContext } from "@apollo/client/link/context";
import * as SecureStore from "expo-secure-store";

export const TOKEN_KEY = "nearcash_token";
const endpoint = process.env.EXPO_PUBLIC_NEARCASH_GRAPHQL_API_URL;

const authLink = setContext(async (_, { headers }) => {
  const token = await SecureStore.getItemAsync(TOKEN_KEY);
  return {
    headers: {
      ...headers,
      authorization: token ? `JWT ${token}` : "",
    },
  };
});

const httpLink = new HttpLink({ uri: endpoint });

export const apolloClient = new ApolloClient({
  link: ApolloLink.from([authLink, httpLink]),
  cache: new InMemoryCache(),
});

export function getGraphQLEndpoint() {
  return endpoint;
}
