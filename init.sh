# cat /app/server && echo
# cat /app/email && echo
# cat /app/password && echo

# exit

bw config server $(cat /app/config/server)

email=$(cat /app/config/email)
passwordfile=/app/config/password

bw login $email --passwordfile "$passwordfile" --raw > /tmp/session_id

export BW_SESSION=$(cat /tmp/session_id)

bw serve --port 8087 --hostname localhost
