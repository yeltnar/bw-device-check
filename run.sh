tag=bw-device-check

docker build -t $tag . && 
docker run \
-e TZ=America/Chicago \
-v$PWD/config:/app/config \
$tag 
