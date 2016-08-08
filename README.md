# monitor-platform
Please use node v5.5.0

#### UI Develop
```sh
cd xbit
npm run dev
// Go to localhost:8080/front-end/resources/index.html
```
#### UI Build
```sh
cd xbit
npm run build
npm run start
// Go to localhost:3000/index.html
```

####UI debug with API
Please install haproxy first
```sh
cd /xbit
haproxy -f xbit.haproxy.config -d
npm run dev
// GO to localhost:8088/front-end/resources/index.html
```
