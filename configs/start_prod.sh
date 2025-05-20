# !bin/bash

echo "starting prod server....."

exec webpack --config webpack.config.prod.js --mode production build
# start express server that renders our temlate...
echo "starting express server....."
node server.js
echo "prod server started!"