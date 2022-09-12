tag=bw-device-check

docker build -t $tag . && 
docker run -it \
--network=bw-device-check
-v$PWD/config:/app/config \
-v$PWD/src:/app/src \
-v$PWD/package.json:/app/package.json \
-v$PWD/email:/app/config/email \
-v$PWD/password:/app/config/password \
-v$PWD/server:/app/config/server \
$tag
