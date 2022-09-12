FROM node:16

WORKDIR /app

RUN npm i -g @bitwarden/cli

EXPOSE 8087

COPY package.json /app/
RUN npm i

COPY src /app/src

# CMD ["bw","serve","--port 8087","--hostname localhost"]

COPY ./init.sh /app/
# CMD "node src/app.js"
CMD ["node","src/app.js"]
