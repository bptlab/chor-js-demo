FROM node:12 as builder
# this part is only needed until packaging of chor-js is merged into upstream
RUN git clone --single-branch --branch packaging https://github.com/bptlab/chor-js.git
RUN cd chor-js & npm install & npm link chor-js

WORKDIR /usr/src
# copy both package and package-lock
COPY package*.json .

COPY app ./app
RUN npm install
# linking can be removed when packaging of chor-js is merged
RUN npm link chor-js
RUN npm run build

# second stage of the build
FROM nginx:stable-alpine
COPY --from=builder /usr/src/build /usr/share/nginx/html
RUN cat /etc/nginx/nginx.conf
