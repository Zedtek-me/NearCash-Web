const path = require("path")
const Dotenv = require("dotenv-webpack");


module.exports = {
    mode:  "development",
    entry: "./src/index.js",
    output: {
        path: "./src/",
        filename: "bundle.js",
    },
    module: {
        rules: [
            {
                test: /\.(js|jsx|.ts)$/,
                exclude: /node_modules/,
                use: {
                    loader: "babel-loader",
                    options: {
                        presets: ["@babel/preset-env", "@babel/preset-react"],
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
        contentBase: path.join(__dirname, "src"),
        compress: true,
        port: 8005,
    },
    plugin: [
        new Dotenv()
    ]
}
