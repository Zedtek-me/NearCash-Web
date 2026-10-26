import { gql } from "@apollo/client";

export const REGISTER_FIREBASE_DEVICE = gql`
  mutation RegisterFirebaseDevice($installationId: String!) {
    registerFirebaseDevice(
      installationId: $installationId
    ) {
      message
      installationId
    }
  }
`;
