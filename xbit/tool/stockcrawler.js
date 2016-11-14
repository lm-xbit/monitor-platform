// stock crawler of sina finacial

var ESClient = require("lib/esclient");

var schedule = require('node-schedule');
var gbk = require('gbk');
var http = require('http');
var qs = require('querystring');
var iconv = require('iconv-lite');
var BufferHelper = require('bufferhelper');

var xBitLogger = require('common/xBitLogger');
var logger = xBitLogger.createLogger({module: 'crawler'});

var SINA_FINANCE_HOSTNAME = 'hq.sinajs.cn';
var SINA_FINANCE_PATH = "/list=";

/**
 * cache records the timestamp of last record for each stock to avoid duplicated records
 */
var epochs = {};

var StockList = require('tool/stocklist');

var StockSplit = function(map) {
  var result = [];
  var idx = 0;
  var sublist = [];
  for (var key in map) {
    if (idx >= 20) {
      result.push(sublist);
      sublist = [];
      idx = 0;
    }
    sublist.push("sh" + key);
    idx = idx + 1;
  }
  if (sublist.length > 0) {
    result.push(sublist);
  }
  return result;
};

var batches = StockSplit(StockList);

var StockJson = function(stock) {
  var keyval = stock.split('=');
  if (keyval.length != 2 || keyval[1] == undefined || keyval[1] == '') {
    return null;
  }
  var code = keyval[0].replace(/^.*_sh/, 'sh');
  var values = keyval[1].replace(/[";]/g, '').split(',');

  if (values.length < 32) {
    return null;
  }

  var epoch = new Date((values[30] + ' ' + values[31]).replace(/-/g, '/')).getTime();
  if (epochs[code] && epoch <= epochs[code]) {
    // the record has been polled already, ignore
    return null;
  }
  var json = {
    'code': code,
    'epoch': epoch,
    'opening_price': parseFloat(values[1]),
    'closing_price': parseFloat(values[2]),
    'price': parseFloat(values[3]),
    'max_price': parseFloat(values[4]),
    'min_price': parseFloat(values[5]),
    'buy1': parseFloat(values[6]),
    'sell1': parseFloat(values[7]),
    'vol': parseInt(values[8]), // 成交量
    'turnover': parseFloat(values[9]), // 成交金额
    'buy1cnt': parseInt(values[10]),
    'buy1price': parseFloat(values[11]),
    'buy2cnt': parseInt(values[12]),
    'buy2price': parseFloat(values[13]),
    'buy3cnt': parseInt(values[14]),
    'buy3price': parseFloat(values[15]),
    'buy4cnt': parseInt(values[16]),
    'buy4price': parseFloat(values[17]),
    'buy5cnt': parseInt(values[18]),
    'buy5price': parseFloat(values[19]),
    'sell1cnt': parseInt(values[20]),
    'sell1price': parseFloat(values[21]),
    'sell2cnt': parseInt(values[22]),
    'sell2price': parseFloat(values[23]),
    'sell3cnt': parseInt(values[24]),
    'sell3price': parseFloat(values[25]),
    'sell4cnt': parseInt(values[26]),
    'sell4price': parseFloat(values[27]),
    'sell5cnt': parseInt(values[28]),
    'sell5price': parseFloat(values[29]),
    'date': values[30],
    'time': values[31]
  };
  epochs[code] = epoch;
  return json;
}

/*
var hq_str_sh601006="大秦铁路, 27.55, 27.25, 26.91, 27.55, 26.20, 26.91, 26.92,
22114263, 589824680, 4695, 26.91, 57590, 26.90, 14700, 26.89, 14300,
26.88, 15100, 26.87, 3100, 26.92, 8900, 26.93, 14230, 26.94, 25150, 26.95, 15220, 26.96, 2008-01-11, 15:05:32";
这个字符串由许多数据拼接在一起，不同含义的数据用逗号隔开了，按照程序员的思路，顺序号从0开始。
0：”大秦铁路”，股票名字；
1：”27.55″，今日开盘价；
2：”27.25″，昨日收盘价；
3：”26.91″，当前价格；
4：”27.55″，今日最高价；
5：”26.20″，今日最低价；
6：”26.91″，竞买价，即“买一”报价；
7：”26.92″，竞卖价，即“卖一”报价；
8：”22114263″，成交的股票数，由于股票交易以一百股为基本单位，所以在使用时，通常把该值除以一百；
9：”589824680″，成交金额，单位为“元”，为了一目了然，通常以“万元”为成交金额的单位，所以通常把该值除以一万；
10：”4695″，“买一”申请4695股，即47手；
11：”26.91″，“买一”报价；
12：”57590″，“买二”
13：”26.90″，“买二”
14：”14700″，“买三”
15：”26.89″，“买三”
16：”14300″，“买四”
17：”26.88″，“买四”
18：”15100″，“买五”
19：”26.87″，“买五”
20：”3100″，“卖一”申报3100股，即31手；
21：”26.92″，“卖一”报价
(22, 23), (24, 25), (26,27), (28, 29)分别为“卖二”至“卖四的情况”
30：”2008-01-11″，日期；
31：”15:05:32″，时间；
*/
var ParseStockString = function(stocks) {
  // stock: multiple lines of:
  // var hq_str_sh603737="三棵树,88.000,86.690,85.770,88.000,85.200,85.750,85.850,1183385,101657581.000,100,85.750,300,85.700,300,85.680,200,85.660,900,85.650,300,85.850,1500,85.860,1200,85.870,5500,85.880,460,85.970,2016-11-07,15:00:00,00";
  var lines = stocks.split('\n');
  var jsons = [];
  for (var key in lines) {
    var json = StockJson(lines[key]);
    if (json) {
      jsons.push(json);
    }
  }
  for (var key in jsons) {
    ESClient.index({
        index: "xbit",
        type: "stockData",
        body: jsons[key]
    });
  }
}

var minuteTask = function() {
  // schedule the task once per minute between 9:00 ~ 14:59 from monday to friday
  return schedule.scheduleJob('0 * 9-14 * * 1-5', function(){
    logger.info("start crawling data");
    for (var idx in batches) {
      var reqOpt = {
        hostname: SINA_FINANCE_HOSTNAME,
        path: SINA_FINANCE_PATH + batches[idx].join(','),
        method: 'GET'
      };
      var req = http.request(reqOpt, (res) => {
        var bufferHelper = new BufferHelper();
        res.on('data', (chunk) =>{
          bufferHelper.concat(chunk);
        });

        res.on('end', () => {
          var bufferhelper = bufferHelper.toBuffer();
          var result = iconv.decode(bufferhelper, 'GBK');
          ParseStockString(result);
        });
      });

      req.on('error', (e) => {
        logger.error('Get stock failed: ' + e.message);
      });

      req.end();
    }
  });
}

module.exports = minuteTask;
