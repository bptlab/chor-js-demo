FROM node:12 as builder

WORKDIR /usr/src
# copy both package and package-lock
COPY package*.json .

COPY app ./app
RUN npm install
RUN npm run build

# second stage of the image build. This allows us to not carry over all the requirements from the build process
FROM node:current-alpine
EXPOSE 9013
COPY --from=builder /usr/src/build /usr/src/build
WORKDIR /usr/src
RUN npm install http-server -g
CMD http-server ./build -p 9013
