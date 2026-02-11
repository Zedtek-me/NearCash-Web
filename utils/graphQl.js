import { ApolloClient } from '@apollo/client/core';
import { ApolloLink, HttpLink, InMemoryCache } from '@apollo/client';
import { setContext } from 'apollo-link-context';


const API_HOST = "https://nearcash.api.cadencepay.us/api/v1/gaphql/" || process.env.NEARCASH_API_URL;

const getApolloClient = async () => {
  const authLink = setContext((_, { headers }) => {
    const token = localStorage.getItem('nearcash_token');
    return {
      headers: {
        ...headers,
        authorization: token ? `JWT ${token}` : '',
      }
    };
  });

  const httpLink = new HttpLink({
    uri: API_HOST,
  });

  const cache = new InMemoryCache();

  return new ApolloClient({
    link: ApolloLink.from([
      authLink,
      httpLink
    ]),
    cache
  });
};

export default getApolloClient;




