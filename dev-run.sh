tag=bw-device-check

docker build -t $tag . && 
docker run -it \
-v$PWD/config:/app/config \
-v$PWD/src:/app/src \
-v$PWD/package.json:/app/package.json \
$tag
