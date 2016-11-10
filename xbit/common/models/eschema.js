var xBitLogger = require('common/xBitLogger');
var logger = xBitLogger.createLogger({module: 'data'});

var TYPE_NUMBER = 'number';
var TYPE_TEXT = 'text';
var PROP_KEY_TIMESTAMP = "@timestamp";
var SUPPORT_SCHEMA_TYPE = [TYPE_NUMBER, TYPE_TEXT];
var NUMBER_DATA_TYPES = ['integer', 'float', 'boolean'];
var INDEX_VALUES = ['analyzed', 'not_analyzed', 'no'];
var MAX_REPLICAS = 1;
var MIN_REPLICAS = 1;
var MAX_SHARDS = 10;
var MIN_SHARDS = 1;
var MIN_REFRESH_INTERVAL = "60s";

/**
 * Validate the schema
 * @params type: String, can be number, or text
 * @params schmea: the schema in JSON format
 * sample of numerical schema:
  {
    "type": "number",
    "settings": {
      "index": {
        "refresh_interval": "5s",
        "number_of_replicas": 1,
        "number_of_shards": 5
      }
    },
    "mappings": {
        "_routing": {
          "required": true
        },
        "_all": {"enabled": false},
        "_source": {"enabled": false},
        "properties": { 
        "@timestamp": {
          "type": "date",
          "doc_values": true,
          "index": "not_analyzed"
        },
        "field1": {
          "type": "float",
          "doc_values": true,
          "index": "no"
        },
        "field2": {
          "type": "integer",
          "doc_values": true,
          "index": "no"
        },
        "field3": {
          "type": "boolean",
          "doc_values": true,
          "index": "no"
        }
      }
    }
  }

  sample of textual schema
  { 
    "type": "text",
    "settings":
      { 
        "index":
        { 
          "refresh_interval": "60s",
          "number_of_replicas": 1,
          "number_of_shards": 5 
        }
      },
      "mappings": {
          "_routing": {"required": true},
          "_all": { "enabled": false },
          "_source": { "enabled": false }, 
          "properties": {
            "@timestamp":{
              "type": "date",
              "doc_values": true,
              "index": "not_analyzed"
            },
            "field1":{
              "type": "string",
              "doc_values": false,
              "index": "analyzed",
              "analyzer": "xxx"
            },
            "field2":{
              "type": "string",
              "doc_values": false,
              "index": "not_analyzed"
            }, 
            "field3":{
              "type": "string",
              "doc_values": false,
              "index": "no"
            }
          }
      }
 }
 */
var validateSchema = function(schema) {
  schema = JSON.parse(schema);
  var type = schema.type;
  if (!type || SUPPORT_SCHEMA_TYPE.indexOf(type) == -1) {
    logger.error("Unsupported schema type: %s", type);
    return false;
  }

  if (!validateSettings(schema.settings)) {
    logger.error("invalid settings in schema: %s", schema.settings);
    return false;
  }

  if (!validateMappings(schema.mappings, type)) {
    logger.error('invalid mappings in schema: %s', schema.mappings);
    return false;
  }

  return true;
}

var validateMappings = function(mappings, type) {
  if (!(mappings instanceof Object)) {
    logger.error('mappings is not an object: %s', mappings);
    return false;
  }

  if (!mappings._routing || (typeof mappings._routing.required != "boolean") || !mappings._routing.required) {
    logger.error("invalid _routing: %s", mappings._routing);
    return false;
  }

  if (!mappings._all || typeof mappings._all.enabled != "boolean" || mappings._all.enabled) {
    logger.error("invalid _all: %s", mappings._all);
    return false;
  }

  if (!mappings._source || typeof mappings._source.enabled != "boolean" || mappings._source.enabled) {
    logger.error("invalid _source: %s", mappings._source);
    return false;
  }

  for (var key in mappings.properties) {
    if (!validateProperty(key, mappings.properties[key], type)) {
      logger.error("invalid property: %s", mappings.properties[key]);
      return false;
    }
  }

  return true;
}

var validateProperty = function(key, property, type) {
  if (key == PROP_KEY_TIMESTAMP) {
    return property.type && property.type == "date"
            && typeof property.doc_values == 'boolean' && property.doc_values
            && typeof property.index == "string" && property.index == "not_analyzed";
  }

  if (type == TYPE_NUMBER) {
      return property.type && NUMBER_DATA_TYPES.indexOf(property.type) != -1
              && typeof property.doc_values == "boolean" && property.doc_values
              && typeof property.index == "string" && property.index == "no";
  }

  if (type == TYPE_TEXT) {
      return property.type && property.type == "string"
              && typeof property.doc_values == "boolean" && !property.doc_values
              && typeof property.index == "string" && INDEX_VALUES.valueOf(property.index) != -1;
  }

  return false;
}

/**
"settings": {
  "index": {
    "refresh_interval": "5s",
    "number_of_replicas": 1,
    "number_of_shards": 5
  }
}
*/
var validateSettings = function(settings) {
  if (!settings || !settings.index) {
    return false;
  }

  if ((typeof settings.index.number_of_replicas == "number") &&
      (typeof settings.index.number_of_shards == "number") &&
      (typeof settings.index.refresh_interval == "string")) {
      var reg = /^(\d+)s$/ig;

      if (!/^(\d+)s$/ig.test(settings.index.refresh_interval) || parseInt(settings.index.refresh_interval) < MIN_REFRESH_INTERVAL) {
        logger.error("invalid refresh interval: %s", settings.index.refresh_interval);
        return false;
      }

      if (settings.index.number_of_replicas < MIN_REPLICAS || settings.index.number_of_replicas > MAX_REPLICAS) {
        logger.error("invalid replicas: %s", settings.index.number_of_replicas);
        return false;
      }

      if (settings.index.number_of_shards < MIN_SHARDS || settings.index.number_of_shards > MAX_SHARDS) {
        logger.error("invalid shards: %s", settings.index.number_of_shards);
        return false;
      }
      return true;
  }
  else {
    logger.error("wrong format of settings: %s", settings);
    return false;
  }
}


module.exports = validateSchema;
