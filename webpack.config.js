const path = require("path")
const Dotenv = require("dotenv-webpack");


module.exports = {
    mode:  "development",
    entry: path.resolve(`./src/index.js`),
    output: {
        path: path.join(__dirname, "public"),
        filename: "bundle.js",
    },
    module: {
        rules: [
            {
                test: /\.(js|jsx|ts)$/,
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
                test: /\.(css|scss)$/,
                use: ["style-loader", "css-loader"],
            },
            {
                test: /\.(png|jpg|gif|svg)$/,
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
        new Dotenv()
    ],
    resolve: {
        extensions: [".js", ".jsx", ".ts", ".tsx"],
    }
}
