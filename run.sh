tag=bw-device-check

docker build -t $tag . && 
docker run \
-v$PWD/config:/app/config \
$tag 
