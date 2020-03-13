FROM node:12 as builder
# this part is only needed until packaging of chor-js is merged into upstream
# Always use --no-cache for building otherwise older versions of chor-js might be used
# RUN git clone --single-branch --branch master https://github.com/bptlab/chor-js.git (Add after merge)
RUN git clone --single-branch --branch packaging https://github.com/bptlab/chor-js.git
RUN cd chor-js && npm install && npm link chor-js

WORKDIR /usr/src
# copy both package and package-lock
COPY package*.json .

COPY app ./app
COPY .babelrc .babelrc
RUN npm install
RUN npm link chor-js
RUN npm run build

# second stage of the image build. This allows us to not carry over all the requirements from the build process
FROM node:current-alpine
EXPOSE 9013
COPY --from=builder /usr/src/build /usr/src/build
WORKDIR /usr/src
RUN npm install http-server -g
CMD http-server ./build -p 9013