const path = require("path");
const Dotenv = require("dotenv-webpack");
const webpack = require("webpack");


module.exports = {
    mode:  "development",
    entry: path.resolve(`./src/index.js`),
    output: {
        path: path.join(__dirname, "public"),
        filename: "bundle.js",
        publicPath: ""
    },
    module: {
        rules: [
            {
                test: /\.(js|jsx|ts)$/i,
                exclude: /node_modules/,
                use: {
                    loader: "babel-loader",
                    options: {
                        presets: ["@babel/preset-env", "@babel/preset-react"],
                        plugins: [
                            "@babel/plugin-transform-runtime"
                          ],
                        sourceType: "module"
                    },
                },
            },
            {
                test: /\.(css|scss)$/i,
                use: [
                    "style-loader", {
                        loader: "css-loader",
                        options: {
                            importLoaders: 1
                        }
                    },
                    "postcss-loader"
                ],
            },
            {
                test: /\.(png|jpg|gif|svg)$/i,
                type: "asset/resource",
            }
        ],
    },
    devServer: {
        static: {
            directory: path.join(__dirname, 'public'),
          },
          compress: true,
          historyApiFallback:true,
          hot:true,
          port: 8015,
    },
    plugins: [
        new webpack.DefinePlugin({
            "process.env.NEARCASH_GRAPHQL_API_URL": JSON.stringify(process.env.NEARCASH_GRAPHQL_API_URL),
            "process.env.GOOGLE_API_KEY": JSON.stringify(process.env.GOOGLE_API_KEY),
            "process.env.SOCKET_URL": JSON.stringify(process.env.SOCKET_URL),
            "process.env.GEOAPIFY_API_KEY": JSON.stringify(process.env.GEOAPIFY_KEY),
            "process.env.NEARCASH_REST_API_URL": JSON.stringify(process.env.NEARCASH_REST_API_URL),
            "process.env.NODE_ENV": JSON.stringify(process.env.NODE_ENV || "production"),
            "process.env.CLOUDINARY_CLOUD_NAME": JSON.stringify(process.env.CLOUDINARY_CLOUD_NAME),
            "process.env.CLOUDINARY_UPLOAD_PRESET": JSON.stringify(process.env.CLOUDINARY_UPLOAD_PRESET),
          }),
    ],
    resolve: {
        extensions: [".js", ".jsx", ".ts", ".tsx"],
    }
}
