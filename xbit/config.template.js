/**
 * Created on 8/26/16.
 */

exports = module.exports = {
    ssl: false,
    port: 8080,
    dns: "www.xbit.ga",
    address: "127.0.0.1",
    sesAWSId: "xxx",
    sesAWSKey: "xxxxxxx",
    sesRegion: "us-west-2",
    logFilePath: "xbitLog",
    connectString: "zookeeper:2181",
    kafka: {
        address: "127.0.0.1",
        port: "2181"
    },
    backend: {
        /**
         * Backend usu. provide a monitor portal for internal use
         */
        address: "127.0.0.1",
        port: 8081
    },
    agent: {
        /**
         * Agent will provide service to outside word
         *
         * Note: uri is the prefix for the actual data reporting uri, the actual reporting uri would be
         * /<configured uri>/<app type>/<device>
         */
        ssl: false,
        dns: "www.xbit.ga",
        address: "127.0.0.1",
        port: 8000,
        uri: "data"
    }
};
