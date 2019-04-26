FROM node:9.4

# expose ports
EXPOSE 9013

# install packages
COPY package*.json /
RUN npm install

# copy sources
COPY . /
RUN npm run build

ENTRYPOINT ["npm"]
CMD ["run", "serve"]