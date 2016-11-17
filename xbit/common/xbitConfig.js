/**
 * Created on 11/17/16.
 */
let config = {};

/**
 * Initialize the configuration for others to use
 *
 * Usu. we load the config and set it in bootstrap code, so other parts of logic an use this config directly
 *
 * @param conf - load configurations
 */
config.$initialize = function(conf) {
    console.log("Try initialize configuration", conf);

    for(let key in conf) {
        if(conf.hasOwnProperty(key) && !key.startsWith("$")) {
            config[key] = conf[key];
        }
    }
};

exports = module.exports = config;