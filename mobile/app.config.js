const fs = require("node:fs");

const androidFirebaseConfig = "./google-services.json";
const iosFirebaseConfig = "./GoogleService-Info.plist";
const firebaseConfigured =
  fs.existsSync(androidFirebaseConfig) || fs.existsSync(iosFirebaseConfig);

const plugins = [
  "expo-router",
  "expo-secure-store",
  "@react-native-community/datetimepicker",
  [
    "react-native-maps",
    {
      ...(process.env.GOOGLE_MAPS_ANDROID_API_KEY
        ? { androidGoogleMapsApiKey: process.env.GOOGLE_MAPS_ANDROID_API_KEY }
        : {}),
    },
  ],
  [
    "expo-location",
    {
      locationWhenInUsePermission:
        "NearCash uses your location to find nearby cash and FX vendors.",
    },
  ],
];

if (firebaseConfigured) {
  plugins.push([
    "@react-native-firebase/app",
    {
      ...(fs.existsSync(androidFirebaseConfig)
        ? { androidGoogleServicesFile: androidFirebaseConfig }
        : {}),
      ...(fs.existsSync(iosFirebaseConfig)
        ? { iosGoogleServicesFile: iosFirebaseConfig }
        : {}),
    },
  ]);
  plugins.push("@react-native-firebase/messaging");
}

module.exports = {
  expo: {
    name: "NearCash",
    slug: "nearcash-mobile",
    scheme: "nearcash",
    version: "1.0.0",
    orientation: "portrait",
    userInterfaceStyle: "light",
    newArchEnabled: true,
    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.cadencepay.nearcash",
      ...(fs.existsSync(iosFirebaseConfig)
        ? { googleServicesFile: iosFirebaseConfig }
        : {}),
    },
    android: {
      package: "com.cadencepay.nearcash",
      ...(fs.existsSync(androidFirebaseConfig)
        ? { googleServicesFile: androidFirebaseConfig }
        : {}),
      permissions: ["ACCESS_COARSE_LOCATION", "ACCESS_FINE_LOCATION"],
      ...(process.env.GOOGLE_MAPS_ANDROID_API_KEY
        ? { config: { googleMaps: { apiKey: process.env.GOOGLE_MAPS_ANDROID_API_KEY } } }
        : {}),
    },
    experiments: { typedRoutes: true },
    plugins,
    extra: {
      firebaseConfigured,
      router: {},
      eas: { projectId: process.env.EAS_PROJECT_ID || undefined },
    },
  },
};
