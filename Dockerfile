FROM node:12 as builder
# this part is only needed until packaging of chor-js is merged into upstream
# Update the checkout for newer versions, as the clone will be cached
RUN git clone --single-branch --branch packaging https://github.com/bptlab/chor-js.git && cd chor-js && git checkout b7f577a
RUN cd chor-js & npm install & npm link chor-js

WORKDIR /usr/src
# copy both package and package-lock
COPY package*.json .

COPY app ./app
COPY .babelrc .babelrc
RUN npm install
# linking can be removed when packaging of chor-js is merged
RUN npm link chor-js
RUN npm run build

# second stage of the build. This allows us to not carry over all the requirements from the build process
FROM node:current-alpine
EXPOSE 9013
COPY --from=builder /usr/src/build /usr/src/build
WORKDIR /usr/src
RUN npm install http-server -g
CMD http-server ./build -p 9013