# !bin/bash

echo "starting local dev server....."

exec webpack serve --progress --config webpack.config.js --mode development --open
echo "local dev server started!"