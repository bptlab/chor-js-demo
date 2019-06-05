# chor-js-demo

A simple demo application showing the usage of [`chor-js`](https://github.com/jan-ladleif/chor-js) to view and edit BPMN 2.0 choreography diagrams in the browser.

__A live version can be found [on our website](https://bpt-lab.org/chor-js-demo/).__

## Usage

### Node.js

You can install and run the demo locally with Node.js.

#### Use Only

```shell
npm install
npm run build
npm run serve
```

The demo is then served to `http://localhost:9013`.

#### Development Environment

If you want to use the demo while developing [chor-js](https://github.com/jan-ladleif/chor-js), you can link the two repositories:

```shell
git clone https://github.com/jan-ladleif/chor-js.git
cd chor-js
npm install
npm link

cd ..
git clone https://github.com/jan-ladleif/chor-js-demo.git
cd chor-js-demo
npm install
npm link chor-js
npm run dev
```

### Docker

We also provide a `Dockerfile` to use with Docker.

```shell
docker build -t chor-js-demo .
docker run --rm -p 9013:9013 --name chor-js-demo -it chor-js-demo
```

The demo is then served to `http://localhost:9013`.

## License

MIT
