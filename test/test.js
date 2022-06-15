const axios = require('axios');
const logger = require('./config/winston');
const Cronr = require('cronr');
const dotenv = require('dotenv');
const path = require('path');
const Decimal = require('decimal');
const moment = require("moment");

var crawlerBrowser = null;
var crawlerPage = null;
var failCount = 0;
var oldPrice = Decimal("0").toNumber();
var job = null;

async function StartCollector(param) {
  // 1초 주기로 환율 데이터 수집할 수 있도록 한다.
  job = new Cronr(param.CRON_EXP, async function () {
    try {
      var price = 0;
      var coinTigerPrice = 0;
      var digifinexPrice = 0;
      var mexcPrice = 0;

      if (param.EXCHANGE_ID == 'COMMON' && param.CURRENCY_PAIR == 'btc') {
        price = await bittrex(process.env.BITTREX_TRX_BTC_URL);

        // 비트렉스 trx/btc
        await callHttp(param.API_URI, "BITTREX", "trx/btc", price);
        // 캐셔레스트 asta/btc
        await callHttp(param.API_URI, "CASHIEREST", "asta/btc", price);
        // 캐셔레스트 myce/btc
        await callHttp(param.API_URI, "CASHIEREST", "myce/btc", price);
        // 켜셔레스트 bmp/usdt
        await callHttp(param.API_URI, "CASHIEREST", "bmp/btc", price);
      } else if (param.EXCHANGE_ID == 'COMMON' && param.CURRENCY_PAIR == 'usdt') {
        // price = await gdac(process.env.GDAC_USDT_KRW_URL);
        price = await cashierUsdt(process.env.CASHIER_USDT_KRW_URL);
        // logger.info(price);
        coinTigerPrice = await cointigerUsdt();
        // logger.info(coinTigerPrice);
        // bitforexPrice = await bitforexUsdt();
        // logger.info(bitforexPrice);
        digifinexPrice = await digifinexUsdt();
        mexcPrice = await mexcUsdt();

        // 비트렉스 trx/btc
        await callHttp(param.API_URI, "BITTREX", "bmp/usdt", price);
        await callHttp(param.API_URI, "BITTREX", "myce/usdt", price);
        // 캐셔레스트 asta/usdt
        await callHttp(param.API_URI, "CASHIEREST", "asta/usdt", price);
        // 캐셔레스트 myce/usdt
        await callHttp(param.API_URI, "CASHIEREST", "myce/usdt", price);
        // 켜셔레스트 bmp/usdt
        await callHttp(param.API_URI, "CASHIEREST", "bmp/usdt", price);
        // 코인타이거 gwp/usdt
        await callHttp(param.API_URI, "COINTIGER", "gwp/usdt", coinTigerPrice);
        await callHttp(param.API_URI, "COINTIGER", "cls/usdt", coinTigerPrice);
        // 비트포렉스 gwp/usdt
        // await callHttp(param.API_URI, "BITFOREX", "gwp/usdt", bitforexPrice);
        // 디지파이넥스 gwp/usdt
        await callHttp(param.API_URI, "DIGIFINEX", "gwp/usdt", digifinexPrice);
        // MEXC mav/usdt
        await callHttp(param.API_URI, "MEXC", "mav/usdt", mexcPrice);
        // azbit
        await callHttp(param.API_URI, "AZBIT", "gwp/usdt", mexcPrice);
        // 바이낸스
        await callHttp(param.API_URI, "BINANCE", "strm/usdt", mexcPrice);
        // XT.com
        await callHttp(param.API_URI, "XTCOM", "gwp/usdt", mexcPrice);
        await callHttp(param.API_URI, "XTCOM", "kees/usdt", mexcPrice);
        // hotbit
        await callHttp(param.API_URI, "HOTBIT", "gwp/usdt", mexcPrice);
        // coinsbit
        await callHttp(param.API_URI, "COINSBIT", "cls1/usdt", mexcPrice);
      } else if (param.EXCHANGE_ID == 'GLOBAL_UPBIT' && param.CURRENCY_PAIR == 'btc/idr') {
        price = await upbitGlobal(process.env.INDONESIA_EXCHANGE_URL);
        callHttp(param.API_URI, param.EXCHANGE_ID, param.CURRENCY_PAIR, price);
      } else {
        logger.error("Exchange & Currency pair warnning ==> " + param.EXCHANGE_ID + " | ==>" + param.CURRENCY_PAIR);
        process.exit(0);
        job.stop();
        return;
      }
    } catch (error) {
      logger.error("EXCEPTION | " + error);
    }
  });
  job.start();
}

async function callHttp(API_URI, exchangeId, currencyPair, price) {
  if (price == null || price == undefined) {
    logger.error("Price Not Found ==> " + price);
    return;
  }

  // 서버 전송하기 위해서 파라메터를 변경할 수 있도록 한다.
  var url = API_URI.replace("{exchangeId}", exchangeId);
  url = url.replace("{currencyPair}", currencyPair);
  url = url.replace("{coinPayment}", -1);
  url = url.replace("{krwPayment}", price);
  logger.info("URL | " + url);

  // 웹서버로 전송한다.
  const platformRes = await axios.get(url)
    .catch(function (error) {
      logger.error("RES ERROR | " + error);
    });

  logger.info("Platform RES DATA | " + JSON.stringify(platformRes.data));
}

// * 비트렉스
async function bittrex(targetUrl) {
  // 웹서버로 전송한다.
  const res = await axios.get(targetUrl)
    .catch(function (error) {
      logger.error("RES ERROR | " + error);
    });

  logger.info("PRICE RES DATA | " + JSON.stringify(res.data));
  return res.data.last;
}

// * 업비트
async function upbitGlobal(targetUrl) {
  let date = moment();

  var url = targetUrl.replace("{TODAY_DATE}", date.format("YYYYMMDD"));
  logger.info("CALL URL : " + url);

  const res = await axios.get(url)
    .catch(function (error) {
      logger.error("RES ERROR | " + error);
    });

  if (res.data == null || res.data == undefined) {
    logger.error("RES ERROR | " + "Null값으로 응답되어 수집할 수 없습니다.");
    return null;
  }

  const ret = res.data.find(obj => obj.cur_unit === 'IDR(100)');
  if (ret == null || ret == undefined || ret.deal_bas_r == undefined) {
    logger.error("RES ERROR | " + "인도네시아 루피아 환율을 찾을수가 없습니다.");
    return null;
  }

  // 사용하는 측에서는 루피아에서 나누기 100을 할 수 없어, 원화 환율에 나누기 100하여 균형을 맞춘다.
  logger.info("PRICE RES DATA | " + (ret.deal_bas_r / 100));
  return (ret.deal_bas_r / 100);
}

async function gdac(targetUrl) {
  const res = await axios.get(targetUrl)
    .catch(function (error) {
      logger.error("RES ERROR | " + error);
    });

  const ret = res.data.find(obj => obj.pair === 'USDT/KRW');
  if (ret == null || ret == undefined) {
    logger.error("RES ERROR | " + "USDT/KRW 환율 정보를 수집하지 못하였습니다.");
    return null;
  }

  logger.info("PRICE RES DATA | " + ret.last);
  return ret.last;
}

async function cashierUsdt(targetUrl) {
  const res = await axios.get(targetUrl)
    .catch(function (error) {
      logger.error("RES ERROR | " + error);
    });

  if (typeof res.data.Cashierest.USDT_KRW !== 'object') {
    logger.error("RES ERROR | " + "USDT/KRW 환율 정보를 수집하지 못하였습니다.");
    return null;
  }
  const ret = res.data.Cashierest.USDT_KRW;

  logger.info("PRICE RES DATA | " + ret.last);
  return ret.last;
}

async function cointigerUsdt() {
  // 웹서버로 전송한다.
  const res = await axios.get('https://www.cointiger.com/exchange/internal/sperate/public/symbol/amount?domain=www.cointiger.com')
    .catch(function (error) {
      logger.error("RES ERROR | " + error);
    });

  logger.info("PRICE RES DATA | " + JSON.stringify(res.data));
  var price = parseFloat(res.data.data.coinCashMap.KRWCNY) * parseFloat(res.data.data.coinCashMap.USDTCNY);
  return price.toFixed(8);
}

async function bitforexUsdt() {
  // 웹서버로 전송한다.
  const res = await axios.get('https://www.bitforex.com/napi/getRate2?v=1647306068695')
    .catch(function (error) {
      logger.error("RES ERROR | " + error);
    });

  logger.info("PRICE RES DATA | " + JSON.stringify(res.data));
  var price = parseFloat(res.data.data.krw.usdt);
  return price.toFixed(2);
}

async function digifinexUsdt() {
  // 웹서버로 전송한다.
  const res = await axios.get('https://api.digifinex.com/rate/fiat_list?timestamp=1649038890910')
    .catch(function (error) {
      logger.error("RES ERROR | " + error);
    });

  logger.info("PRICE RES DATA | " + JSON.stringify(res.data));
  var price = parseFloat(res.data.data.usdt2fiat.KRW);
  return price.toFixed(2);
}

async function mexcUsdt() {
  // 웹서버로 전송한다.
  const res = await axios.get('https://www.mexc.com/api/platform/common/currency/exchange/rate')
    .catch(function (error) {
      logger.error("RES ERROR | " + error);
    });

  logger.info("PRICE RES DATA | " + JSON.stringify(res.data));
  var price = parseFloat(res.data.data.KRW);
  return price.toFixed(2);
}

(async () => {
  if (process.env.NODE_ENV === 'development') {
    dotenv.config({ path: path.join(__dirname, './env/development.env') });
  } else if (process.env.NODE_ENV === 'production') {
    dotenv.config({ path: path.join(__dirname, './env/production.env') });
  } else if (process.env.NODE_ENV === 'local') {
    dotenv.config({ path: path.join(__dirname, './env/local.env') });
  } else {
    dotenv.config({ path: path.join(__dirname, './env/local.env') });
  }

  var exchangeId = null;
  var currencyPair = null;

  var args = process.argv.slice(2);
  for (var index = 0; index < args.length; index++) {
    var value = args[index];
    var lastIndex = value.lastIndexOf("--exchange");
    if (lastIndex != -1) {
      exchangeId = value.substring(11, value.length);
      continue;
    }

    lastIndex = value.lastIndexOf("--currencyPair");
    if (lastIndex != -1) {
      currencyPair = value.substring(15, value.length);
    }
  }

  if (exchangeId == null || currencyPair == null) {
    process.exit(1);
    return;
  }

  var cron_exp = null;
  if (exchangeId == 'GLOBAL_UPBIT' && currencyPair == 'btc/idr') {
    cron_exp = process.env.EXCHANGE_CRON_EXP;
  } else {
    cron_exp = process.env.DEF_CRON_EXP;
  }

  var param = {
    NODE_ENV: process.env.NODE_ENV,
    EXCHANGE_ID: exchangeId,
    CURRENCY_PAIR: currencyPair,
    API_URI: process.env.API_URL,
    CRON_EXP: cron_exp
  };

  logger.info("| Exchange Collector START | " + JSON.stringify(param));

  StartCollector(param);
})();


process.on('SIGTERM', async () => {
  logger.info("############################################### SIGTERM #####################################################");
  job.stop();
});

process.on('SIGINT', async () => {
  logger.info("############################################### SIGINT #####################################################");
  job.stop();
});

process.on('SIGQUIT', async () => {
  logger.info("############################################### SIGQUIT #####################################################");
  job.stop();
});

process.on('exit', async () => {
  logger.info("############################################### Forever Stop #####################################################");
  job.stop();
});
