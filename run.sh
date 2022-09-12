tag=bw-cli-docker

docker build -t $tag . && 
docker run -it \
-v$PWD/email:/app/email \
-v$PWD/password:/app/password \
-v$PWD/server:/app/server \
$tag