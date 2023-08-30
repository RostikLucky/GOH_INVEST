//////////////////////
//                  //
//    Библиотеки    //
//                  //
//////////////////////
const {open} = require("sqlite"); /// npm i sqlite
const sqlite3 = require("sqlite3"); /// npm i sqlite3
var prompt = require('prompt-sync')(); /// npm i prompt-sync
const TelegramBot = require('node-telegram-bot-api'); /// npm i node-telegram-bot-api
const {TinkoffInvestApi, Helpers, SandboxAccount} = require('tinkoff-invest-api'); /// npm i tinkoff-invest-api
//////////////////////
//                  //
//    Переменные    //
//                  //
//////////////////////
user = '';
info = '-';
get_bot = '';
history = [];
settings = '';
tinkoff_id = '';
active_page = 0;
client_api = null;
client_bot = null;
unsubscribe = null;
tinkoff_token = '';
history_procent = 0;
await_update = true;
bot_is_work = false;
all_instruments = {};
instruments_sort = [];
instruments_data = {};
bot_window_focus = false;
window_bot_reload = true;
default_color = '\x1b[42m%s\x1b[0m';
//////////////////////
//                  //
//    Интерфейс     //
//                  //
//////////////////////
bot_menu = {
  /// Главное меню
  'info_balance': {'text': '💰 *Баланс счёта:* `(?)`₽', 'buttons': [[{text: '🏠 Вернуться обратно', callback_data: 'main'}]]},
  'main': {'text': '📈 *Доходность портфеля:* `(?)%`\n💵 *Стоимость акций:* `(?)₽`', 'buttons': [[{text: '💰 Баланс', callback_data: 'info_balance'}, {text: '⚙️ Настройки', callback_data: 'main_settings'}]]},
  'main_settings': {'text': '', 'buttons': [[{text: '🚥 Сигналы на покупку и продажу', callback_data: 'buy_sell_signals'}], [{text: '📉 Настройки покупки', callback_data: 'buy_settings'}, {text: '📈 Настройки продажи', callback_data: 'sell_settings'}], [{text: '⌛ Настройки времени для торгов', callback_data: 'time_settings'}], [{text: '📝 Изменить токены бота', callback_data: 'change_tokens'}], [{text: '🏠 Вернуться обратно', callback_data: 'main'}]]},
  /// Настройки покупки и продажи
  'input_settings': {'text': '(?)*Введите число от* `(?)` *до* `(?)`:\n(?)', 'buttons': []},
  'buy_settings': {'text': '', 'buttons': [[{text: '🏠 Вернуться обратно', callback_data: 'main_settings'}]]},
  'time_settings': {'text': '', 'buttons': [[{text: '🏠 Вернуться обратно', callback_data: 'main_settings'}]]},
  'sell_settings': {'text': '', 'buttons': [[{text: '🏠 Вернуться обратно', callback_data: 'main_settings'}]]},
  'balance_add': {'text': '(?)💰 *Введите число от* `1` до `100000`:', 'buttons': [[{text: '🏠 Вернуться обратно', callback_data: 'info_balance'}]]},
  'stop_trading_notify': {'text': '👍 *Торги остановлены*\n - *Ваша выгода:* `(?)%`', 'buttons': [[{text: '🏠 Вернуться обратно', callback_data: 'main'}]]},
  'buy_sell_signals': {'text': '🚥 *Примеры сообщений боту:*\n` - ``Купить SBER`` `*или*` ``Продать SBER`', 'buttons': [[{text: '🏠 Вернуться обратно', callback_data: 'main_settings'}]]},
  'change_tokens': {'text': '', 'buttons': [[{text: '🧾 Брокерского счёта', callback_data: 'change_tinkoff_token'}, {text: '🤖 Telegram бота', callback_data: 'change_telegram_token'}], [{text: '🏠 Вернуться обратно', callback_data: 'main_settings'}]]},
  'candle_time_check': {'text': '📉 *Проверять на падение в течении:*', 'buttons': [[{text: '5 мин.', callback_data: 'candle_time_check_5'}, {text: '10 мин.', callback_data: 'candle_time_check_10'}, {text: '15 мин.', callback_data: 'candle_time_check_15'}, {text: '30 мин.', callback_data: 'candle_time_check_30'}], [{text: '🏠 Вернуться обратно', callback_data: 'buy_settings'}]]},
  /// Меню бота
  'main_bot': {'text': '📑 *Активные акции (*`(?)/(?)`*) (*`(?)`*):*\n\n(?)\n', 'buttons': [[{text: '🏠 Вернуться обратно', callback_data: 'main'}]]},
  'history_bot': {'text': '🗂 *История торгов (*`(?)`*) (*`(?)%`*):*\n\n(?)', 'buttons': [[{text: '🏠 Вернуться обратно', callback_data: 'open_bot'}]]},
  /// Уведомления
  'buy_notify': {'text': '🛒 *Приобретена акция:* (?)\n - Цена с комиссией: `(?)₽`\n - Комиссия за 1 шт: `(?)₽`\n - Количество лотов: `(?)` по `(?)` шт.', 'buttons': [[{text: '🗑 Удалить уведомление', callback_data: 'delete_notify'}]]},
  'sell_notify': {'text': '(?) *Продана акция:* (?)\n - Цена с комиссией: `(?)₽`\n - Выгода с комиссией: `(?)%`\n - Количество лотов: `(?)` по `(?)` шт.', 'buttons': [[{text: '🗑 Удалить уведомление', callback_data: 'delete_notify'}]]},
  /// Настройки при запуске
  'user_saved': {'text': '👍 *Ваш брокерский счёт сохранён*', 'buttons': [[{text: '🤖 Перейти в бота', callback_data: 'start_bot'}]]},
  'select_user': {'text': '👥 *Выберете брокерский счёт Тинькофф*', 'buttons': [[{text: '📝 Изменить токен брокерского счёта', callback_data: 'change_tinkoff_token'}]]},
  'invalid_user': {'text': '❗️ *Нет активных счетов в Тинькофф*\n ', 'buttons': [[{text: '📝 Изменить токен брокерского счёта', callback_data: 'change_tinkoff_token'}]]},
  'invalid_rub': {'text': '❗️ *Брокерский счёт должен быть в рублях*\n ', 'buttons': [[{text: '📝 Изменить токен брокерского счёта', callback_data: 'change_tinkoff_token'}]]},
  'invalid_token': {'text': '❗️ *Вы ошиблись при вводе токена*\n `- Попробуйте ввести еще раз!`', 'buttons': [[{text: '📝 Изменить токен Telegram бота', callback_data: 'change_telegram_token'}]]},
  'add_token': {'text': '⚙️ *(?), введите свой* [токен](https://www.tinkoff.ru/invest/settings/api/) брокерского счёта Тинькофф: ', 'buttons': [[{text: '📝 Изменить токен Telegram бота', callback_data: 'change_telegram_token'}]]},
  /// Ошибки
  'error_order': {'text': '❗️ Ошибка при создании ордера:\n - (?)', 'buttons': [[{text: '🗑 Удалить уведомление', callback_data: 'delete_notify'}]]},
  'error_instruments': {'text': '❗️ *Ошибка, у вас отсутствуют избранные акции* ', 'buttons': [[{text: '🏠 Вернуться обратно', callback_data: 'main'}]]},
  'error_token': {'text': '❗️ *Ошибка токена Тинькофф*\n` - Или перезагрузите бота`', 'buttons': [[{text: '📝 Изменить токен брокерского счёта', callback_data: 'change_tinkoff_token'}]]},
  'error_buy_notification': {'text': '❗️ *У вас куплены акции с помощью бота:*\n` - Aкции могут быть проданы только вами!`', 'buttons': [[{text: '🏠 Вернуться в главное меню', callback_data: 'main'}]]},
}
//////////////////////
//                  //
//    Создать БД    //
//                  //
//////////////////////
async function createTables(database) {
  try {
    await database.exec(`
      create table user (
        id integer,
        tinkoff_id text,
        tinkoff_name text,
        tinkoff_token text,
        telegram_id integer,
        telegram_token text,
        bot_last_id integer,
        bot_last_action text,
        telegram_first_name text
      );
      create table settings (
        id integer,
        signals_buy text,
        signals_sell text,
        stop_trading integer,
        start_trading integer,
        procent_buyers integer,
        sell_after_time integer,
        indicator_price_buy float,
        candle_time_check integer,
        notifications_buy integer,
        indicator_volume_buy float,
        indicator_price_sell float,
        stop_loss_price_sell float,
        notifications_sell integer,
        indicator_volume_sell float,
        buy_balance_procent integer,
        stop_trading_procent integer,
        sell_after_time_indicator integer
      );
    `);
    await database.run(`INSERT INTO settings (id, signals_buy, signals_sell, stop_trading, start_trading, procent_buyers, sell_after_time, indicator_price_buy, candle_time_check, notifications_buy, indicator_volume_buy, indicator_price_sell, stop_loss_price_sell, notifications_sell, indicator_volume_sell, buy_balance_procent, stop_trading_procent, sell_after_time_indicator) VALUES (0, 'да', 'да', 16, 10, 70, 60, 0.35, 5, 1, 15000, 0.25, 0.40, 1, 500, 40, 1, 2)`);
  } catch {}
}
//////////////////////
//                  //
//   Доп. функции   //
//                  //
//////////////////////
function clearTerm() {process.stdout.write('\033c')} /// Очистить консоль
function jsonConcat(o1, o2) {for (var key in o2) o1[key] = o2[key]; return o1} /// Объединить объекты
async function timeout(time) {await new Promise(resolve => setTimeout(resolve, time * 1000))} /// Таймер
function alertConsole(text) {process.stdout.write('\033c'); console.log(default_color, text)} /// Вывод данных
function reverseArr(input) {var re = new Array; for (var i = input.length-1; i >= 0; i--) {re.push(input[i])} return re} /// Инвертировать массив
async function updateDB(database, into, values) {return await database.all(`UPDATE ${into} SET ${values} WHERE id = 0`)} /// UPDATE - База данных
async function selectDB(database, from, select) {return await database.get(`SELECT ${select} FROM ${from} WHERE id = 0`)} /// SELECT ALL - База данных
async function insertDB(database, into, data, values) {return await database.all(`INSERT INTO ${into} (${data}) VALUES (${values})`)} /// INSERT - База данных
/////////////////////
//                 //
//    Портфолио    //
//                 //
/////////////////////
async function getPortfolio() {
  portfolio = null;
  try {
    portfolio = (user.tinkoff_name == 'Sandbox') ? await client_api.sandbox.getSandboxPortfolio({accountId: user.tinkoff_id}) : await client_api.operations.getPortfolio({accountId: user.tinkoff_id});
    portfolio.totalAmountShares = Helpers.toNumber(portfolio.totalAmountShares).toFixed(2);
    portfolio.totalAmountCurrencies = Helpers.toNumber(portfolio.totalAmountCurrencies).toFixed(2);
    if (portfolio.expectedYield !== undefined) portfolio.expectedYield = Helpers.toNumber(portfolio.expectedYield).toFixed(2);
    else portfolio.expectedYield = 0;
  } catch {}
  for (figi of Object.keys(instruments_data)) {
    for (var i = 0; i < portfolio.positions.length; i++) {
      if (portfolio.positions[i].averagePositionPrice !== undefined && portfolio.positions[i].figi == figi) {
        instruments_data[figi].avalible = false;
        break;
      } else instruments_data[figi].avalible = true;
    }
  }
  return portfolio
}
//////////////////////
//                  //
//   Кол-во акций   //
//                  //
//////////////////////
async function getCount(price, lot, balance) {
  count = -1;
  for (var i = 1; i < 100000; i++) {
    if (((lot * i) * price) > (Number(balance) * settings.buy_balance_procent) / 100) {if (i != 1) count = (((lot * (i - 1)) * price) > (Number(balance) * settings.buy_balance_procent) / 100) ? 0 : i - 1}
    if (count != -1) break;
  }
  return count;
}
///////////////////////
//                   //
//  Последние свечи  //
//                   //
///////////////////////
async function getCandles(database, figi) {
  settings = await selectDB(database, 'settings', '*');
  candle_time_check = 2;
  if (settings.candle_time_check == 10) candle_time_check = 8;
  else if (settings.candle_time_check == 15) candle_time_check = 3;
  else if (settings.candle_time_check == 30) candle_time_check = 9;
  try {candle = await client_api.marketdata.getCandles({figi: figi, interval: candle_time_check, ...client_api.helpers.fromTo(`-${settings.candle_time_check}m`)})} catch {candle = {candles: []}}
  if (candle.candles.length >= 1) {
    if (Helpers.toNumber(candle.candles[candle.candles.length - 1].open) >= Helpers.toNumber(candle.candles[candle.candles.length - 1].close)) candle = 'short';
    else candle = 'long';
  } else candle = '';
  if (candle != '') {
    try {
      orderBook = await client_api.marketdata.getOrderBook({figi: figi, depth: 30});
      if (orderBook.bids.length != 0 && orderBook.asks.length != 0) {
        buy_orderBook = 0;
        sell_orderBook = 0;
        for (var i = 0; i < orderBook.bids.length; i++) {buy_orderBook += orderBook.bids[i].quantity}
        for (var i = orderBook.asks.length - 1; i >= 0; i--) {sell_orderBook += orderBook.asks[i].quantity}
        orderBook_procent = (buy_orderBook + sell_orderBook)/100;
        return [candle, Helpers.toNumber(orderBook.bids[0].price), Helpers.toNumber(orderBook.asks[0].price), Number((buy_orderBook/orderBook_procent).toFixed(2))]
      } else return null;
    } catch {return null}
  } else return null;
}
///////////////////////
//                   //
//   Создать ордер   //
//                   //
///////////////////////
async function createOrder(figi, quantity, direction, order_type, price=0) {
  postOrder = null;
  try {
    direction = (direction == 'buy') ? 1 : 2;
    order_type = (order_type == 'limit') ? 1 : 2;
    orderId = Math.floor(Math.random() * 100000000);
    price = (order_type == 'limit') ? {price: Helpers.toQuotation(price)} : {};
    headers = jsonConcat({accountId: user.tinkoff_id, figi: figi, quantity: quantity, direction: direction, orderType: order_type, orderId: orderId.toString()}, price);
    if (user.tinkoff_name == 'Sandbox') postOrder = await client_api.sandbox.postSandboxOrder(headers);
    else postOrder = await client_api.orders.postOrder(headers);
  } catch (err) {try {await client_bot.sendMessage(user.telegram_id, bot_menu.error_order.text.replace('(?)', err.toString()), {reply_markup: JSON.stringify({inline_keyboard: bot_menu.error_order.buttons})})} catch (err) {console.log(err)}}
  return postOrder
}
///////////////////////
//                   //
//  Главные функции  //
//                   //
///////////////////////
(async() => {
  open({filename: './2. GOH_INVEST.db', driver: sqlite3.Database}).then(async (database) => {
    await createTables(database);
    ////////////////////////
    //                    //
    //  Отправить сообщ.  //
    //                    //
    ////////////////////////
    async function send_message(message, message_buttons, message_id, action='') {
      if (action != '') await database.run(`UPDATE user SET bot_last_action = '${action}' WHERE id = 0`);
      try {await client_bot.editMessageCaption(message, {chat_id: user.telegram_id, message_id: message_id, reply_markup: JSON.stringify({inline_keyboard: message_buttons}), parse_mode: "Markdown", has_spoiler: false})} 
      catch (err) {
        if (err.toString().indexOf('message is not modified') == -1) {
          try {
            result = await client_bot.sendPhoto(user.telegram_id, "./3. main.jpg", {caption: message, reply_markup: JSON.stringify({inline_keyboard: message_buttons}), parse_mode: "Markdown", has_spoiler: false});
            await database.run(`UPDATE user SET bot_last_id = ${result.message_id} WHERE id = 0`);
          } catch {}
        }
      }
    }
    /*//////////////////////////////////*/
    /*/                                /*/
    /*/                                /*/
    /*/    Первоначальная настройка    /*/
    /*/                                /*/
    /*/                                /*/
    /*//////////////////////////////////*/
    await firstSettings();
    async function firstSettings() {
      user = await selectDB(database, 'user', 'id, tinkoff_token, telegram_token');
      if (user === undefined) {
        while (true) {
          alertConsole(' [GOH_INVEST] Первоначальная настройка: ');
          telegram_token = prompt(' - Введите токен от Telegram бота: ');
          clearTerm();
          if (telegram_token.indexOf(':') != -1 && telegram_token.length >= 32) {
            try {
              client_bot = new TelegramBot(telegram_token, {polling: true});
              get_bot = await client_bot.getMe();
              if (get_bot.username !== undefined) {
                alertConsole(` [GOH_INVEST] Перейдите в бота @${get_bot.username} для настройки`);
                await addToken();
                break;
              }
            } catch {}
          }
          try {client_bot.stopPolling()} catch {}
          alertConsole(` [GOH_INVEST] Первоначальная настройка: `);
          console.log('\x1b[31m%s\x1b[0m', ' - Вы ошиблись при вводе токена! [Нажмите Enter для повтора]');
          prompt('');
        }
      } else {
        client_bot = new TelegramBot(user.telegram_token, {polling: true});
        get_bot = await client_bot.getMe();
        if (user.tinkoff_token == null || user.tinkoff_token == '') {
          alertConsole(` [GOH_INVEST] Перейдите в бота @${get_bot.username} для настройки`);
          await addToken();
        } else await runTGbot();
      }
    }
    /////////////////////////
    //                     //
    //  Добавить API ключ  //
    //                     //
    /////////////////////////
    async function addToken() {
      client_bot.on('message', async function onMessage(msg) {
        user = await selectDB(database, 'user', 'telegram_id, telegram_token, bot_last_id, bot_last_action');
        if (user === undefined) {
          user = {};
          user.telegram_id = msg.from.id;
          await insertDB(database, 'user', 'id, telegram_id, telegram_token, telegram_first_name', `0, ${msg.from.id}, '${telegram_token}', '${msg.from.first_name}'`);
          await send_message(bot_menu.add_token.text.replace('(?)', msg.from.first_name), bot_menu.add_token.buttons, 0, 'add_token');
        } else {
          if (msg.text.indexOf('t.') != -1 && msg.text.length >= 60) {
            try {
              client_api = new TinkoffInvestApi({token: msg.text});
              tinkoff_token = msg.text;
              add_button = [];
              try {
                accounts_array = await client_api.users.getAccounts({});
                accounts_array = accounts_array.accounts;
                for (var i = 0; i < accounts_array.length; i++) {if (accounts_array[i].type >= 1 && accounts_array[i].status == 2 && accounts_array[i].accessLevel == 1) add_button.push([{text: `📋 ${accounts_array[i].name} - ${accounts_array[i].id}`, callback_data: 'select_token_'+i}])}
              } catch {
                accounts_array = await client_api.sandbox.openSandboxAccount({});
                add_button.push([{text: `📋 Sandbox - ${accounts_array.accountId}`, callback_data: 'select_token_0'}]);
              }
              if (add_button.length > 0) await send_message(bot_menu.select_user.text, add_button.concat(bot_menu.select_user.buttons), user.bot_last_id, 'add_token');
              else await send_message(bot_menu.invalid_user.text, bot_menu.invalid_user.buttons, user.bot_last_id, 'add_token');
            } catch {await send_message(bot_menu.invalid_token.text, bot_menu.invalid_token.buttons, user.bot_last_id, 'add_token')}
          } else await send_message(bot_menu.invalid_token.text, bot_menu.invalid_token.buttons, user.bot_last_id, 'add_token');
        }
        try {await client_bot.deleteMessage(user.telegram_id, msg.message_id)} catch {}
      });
      client_bot.on('callback_query', async function onCallbackQuery(callbackQuery) {
        user = await selectDB(database, 'user', 'telegram_id, telegram_token, bot_last_id, bot_last_action');
        if (user !== undefined) {
          if (callbackQuery.message.chat.id == user.telegram_id) {
            if (callbackQuery.data == 'change_telegram_token') {
              await database.run(`DELETE FROM user`);
              await client_bot.sendMessage(user.telegram_id, '❗️ *Перейдите в окно с ботом*, для смены токена', {parse_mode: "Markdown"});
              try {await client_bot.deleteMessage(user.telegram_id, user.bot_last_id)} catch {}
              try {client_bot.stopPolling()} catch {}
              await firstSettings();
            } else if (callbackQuery.data == 'change_tinkoff_token') await send_message(bot_menu.add_token.text.replace('(?)', callbackQuery.message.chat.first_name), bot_menu.add_token.buttons, user.bot_last_id, 'add_token');
            else if (callbackQuery.data.indexOf('select_token_') != -1) {
              index = Number(callbackQuery.data.split('select_token_')[1]);
              data = callbackQuery.message.reply_markup.inline_keyboard[0][index].text;
              data = data.split('📋 ')[1].split(' - ');
              if (data[0] == 'Sandbox') portfolio = await client_api.sandbox.getSandboxPortfolio({accountId: data[1]});
              else portfolio = await client_api.operations.getPortfolio({accountId: data[1]});
              if (portfolio.totalAmountShares.currency == 'rub') {
                await updateDB(database, 'user', `tinkoff_id = '${data[1]}', tinkoff_name = '${data[0]}', tinkoff_token = '${tinkoff_token}'`);
                await send_message(bot_menu.user_saved.text, bot_menu.user_saved.buttons, user.bot_last_id, 'user_saved');
              } else await send_message(bot_menu.invalid_rub.text, bot_menu.invalid_rub.buttons, user.bot_last_id, 'add_token');
            } else if (callbackQuery.data == 'start_bot') {
              try {client_bot.stopPolling()} catch {}
              client_bot = new TelegramBot(user.telegram_token, {polling: true});
              get_bot = await client_bot.getMe();
              await runTGbot();
            }
          }
        }
      })
    }
    /*//////////////////////////////////*/
    /*/                                /*/
    /*/                                /*/
    /*/      Запуск Telegram бота      /*/
    /*/                                /*/
    /*/                                /*/
    /*//////////////////////////////////*/
    async function runTGbot() {
      user = await selectDB(database, 'user', '*');
      ///////////////////////
      //                   //
      //  Проверка данных  //
      //                   //
      ///////////////////////
      client_api = new TinkoffInvestApi({token: user.tinkoff_token});
      temp_bot_last_id = user.bot_last_id;
      user.bot_last_id = 0;
      //////////////////////
      //                  //
      //  Получить акции  //
      //                  //
      //////////////////////
      try {
        all_instruments_temp = await client_api.instruments.shares({InstrumentStatus: 1});
        all_instruments_temp = all_instruments_temp.instruments;
        all_instruments = {};
        for (var i = 0; i < all_instruments_temp.length; i++) {if (all_instruments_temp[i].currency == 'rub') all_instruments[all_instruments_temp[i].figi] = {'lot': all_instruments_temp[i].lot, 'ticker': all_instruments_temp[i].ticker}}
        await homeMenu();
        try {await client_bot.deleteMessage(user.telegram_id, temp_bot_last_id)} catch {}
        alertConsole(` [GOH_INVEST] Бот @${get_bot.username} работает! `);
      } catch {await send_message(bot_menu.error_token.text, bot_menu.error_token.buttons, 0, 'error_token')}
      /*//////////////////////////////////*/
      /*/                                /*/
      /*/                                /*/
      /*/    Интерфейс Telegram бота     /*/
      /*/                                /*/
      /*/                                /*/
      /*//////////////////////////////////*/
      async function homeMenu() {
        bot_window_focus = false;
        portfolio = await getPortfolio();
        add_button = (bot_is_work) ? [[{text: `🤖 Перейти к боту`, callback_data: 'open_bot'}]] : [[{text: `🤖 Запустить бота`, callback_data: 'start_bot'}]];
        if (portfolio != null) await send_message(bot_menu.main.text.replace('(?)', portfolio.expectedYield).replace('(?)', portfolio.totalAmountShares), add_button.concat(bot_menu.main.buttons), user.bot_last_id, 'main');
        else await send_message(bot_menu.error_token.text, bot_menu.error_token.buttons, 0, 'error_token');
      }
      /////////////////////////
      //                     //
      //       Сигналы       //
      //                     //
      /////////////////////////
      async function buySellSignals() {
        settings = await selectDB(database, 'settings', '*');
        add_button = [[{text: `📉 Покупки по индикаторам: ${settings.signals_buy}`, callback_data: 'change_signals_buy'}], [{text: `📈 Продажи по индикаторам: ${settings.signals_sell}`, callback_data: 'change_signals_sell'}]];
        await send_message(bot_menu.buy_sell_signals.text, add_button.concat(bot_menu.buy_sell_signals.buttons), user.bot_last_id, 'buy_sell_signals');
      }
      //////////////////////////
      //                      //
      // Управление сигналами //
      //                      //
      //////////////////////////
      async function changeBuySell(action) {
        action = action.split('change_signals_')[1];
        settings = await selectDB(database, 'settings', '*');
        if (action == 'buy') {
          settings.signals_buy = (settings.signals_buy == 'да') ? 'нет' : 'да';
          await updateDB(database, 'settings', `signals_buy='${settings.signals_buy}'`);
          await buySellSignals();
        } else {
          settings.signals_sell = (settings.signals_sell == 'да') ? 'нет' : 'да';
          await updateDB(database, 'settings', `signals_sell='${settings.signals_sell}'`);
          await buySellSignals();
        }
      }
      ////////////////////////
      //                    //
      //    Время торгов    //
      //                    //
      ////////////////////////
      async function timeSettings() {
        settings = await selectDB(database, 'settings', '*');
        add_button = [[{text: `⏳ Торговать с ${settings.start_trading} ч.`, callback_data: 'input_start_trading'}, {text: `⌛️ Торговать до ${settings.stop_trading} ч.`, callback_data: 'input_stop_trading'}], [{text: `⏰ Останавливать торги при выгоде: ${settings.stop_trading_procent}%`, callback_data: 'input_stop_trading_procent'}]];
        await send_message(bot_menu.time_settings.text, add_button.concat(bot_menu.time_settings.buttons), user.bot_last_id, 'time_settings');
      }
      /////////////////////////
      //                     //
      //  Настройка покупок  //
      //                     //
      /////////////////////////
      async function buySettings() {
        settings = await selectDB(database, 'settings', '*');
        settings.notifications_buy = (settings.notifications_buy == 0) ? 'нет' : 'да';
        add_button = [[{text: `💰 Покупать акции до ${settings.buy_balance_procent}% от баланса`, callback_data: 'input_buy_balance_procent'}], [{text: `📉 Проверять на падение в течении: ${settings.candle_time_check} мин.`, callback_data: 'candle_time_check'}], [{text: `💸 Цена < -${settings.indicator_price_buy}% `, callback_data: 'input_indicator_price_buy'}, {text: `🎚 Объем > ${settings.indicator_volume_buy}`, callback_data: 'input_indicator_volume_buy'}], [{text: `👥 Процент покупателей > ${settings.procent_buyers}%`, callback_data: 'input_procent_buyers'}], [{text: `🔔 Уведомление о покупке: ${settings.notifications_buy}`, callback_data: 'change_notify_notifications_buy'}]];
        await send_message(bot_menu.buy_settings.text, add_button.concat(bot_menu.buy_settings.buttons), user.bot_last_id, 'buy_settings');
      }
      //////////////////////////
      //                      //
      //   Настройка продаж   //
      //                      //
      //////////////////////////
      async function sellSettings() {
        settings = await selectDB(database, 'settings', '*');
        settings.notifications_sell = (settings.notifications_sell == 0) ? 'нет' : 'да';
        add_button = [[{text: `💰 Стоп-лосс до -${settings.stop_loss_price_sell}% от цены`, callback_data: 'input_stop_loss_price_sell'}], [{text: `⏳ Активировать стоп-лосс через ${settings.sell_after_time} мин`, callback_data: 'input_sell_after_time'}], [{text: `💸 Цена > ${settings.indicator_price_sell}% `, callback_data: 'input_indicator_price_sell'}, {text: `🎚 Объем > ${settings.indicator_volume_sell}`, callback_data: 'input_indicator_volume_sell'}], [{text: `🕔 Или продать акцию через: ${settings.sell_after_time_indicator} ч.`, callback_data: 'input_sell_after_time_indicator'}], [{text: `🔔 Уведомление о продаже: ${settings.notifications_sell}`, callback_data: 'change_notify_notifications_sell'}]];
        await send_message(bot_menu.sell_settings.text, add_button.concat(bot_menu.sell_settings.buttons), user.bot_last_id, 'sell_settings');
      }
      //////////////////////////
      //                      //
      //    Настройка свеч    //
      //                      //
      //////////////////////////
      async function candleTimeCheck(data) {
        if (data.split('candle_time_check')[1] == '') await send_message(bot_menu.candle_time_check.text, bot_menu.candle_time_check.buttons, user.bot_last_id, 'candle_time_check');
        else {await updateDB(database, 'settings', `candle_time_check=${data.split('candle_time_check_')[1]}`); await buySettings()}
      }
      /////////////////////////
      //                     //
      //     Ввод данных     //
      //                     //
      /////////////////////////
      async function inputSettings(action, message="") {
        action = action.split('input_')[1];
        if (action == 'buy_balance_procent') numbers = [10, 95, 'buy_settings', ''];
        else if (action == 'stop_trading_procent') numbers = [0, 10, 'time_settings', ''];
        else if (action == 'indicator_price_buy') numbers = [0.10, 10, 'buy_settings', ''];
        else if (action == 'sell_after_time_indicator') numbers = [1, 6, 'sell_settings', ''];
        else if (action == 'indicator_volume_buy') numbers = [5000, 90000, 'buy_settings', ''];
        else if (action == 'indicator_volume_sell') numbers = [100, 30000, 'sell_settings', ''];
        else if (action == 'sell_after_time') numbers = [1, 120, 'sell_settings', '` - Через это время активируется стоп-лосс`'];
        else if (action == 'stop_trading') numbers = [0, 23, 'time_settings', '` - Время сравнивается с временем вашего компьютера`'];
        else if (action == 'start_trading') numbers = [0, 23, 'time_settings', '` - Время сравнивается с временем вашего компьютера`'];
        else if (action == 'procent_buyers') numbers = [20, 90, 'buy_settings', '` - Процент людей, покупающих в данный момент акцию`'];
        else if (action == 'stop_loss_price_sell') numbers = [0.20, 5, 'sell_settings', '` - С учётом комиссии покупки`\n` - Без учёта комиссии продажи`'];
        else if (action == 'indicator_price_sell') numbers = [0.10, 10, 'sell_settings', '` - С учётом комиссии покупки`\n` - Без учёта комиссии продажи`'];
        if (message == '') await send_message(bot_menu.input_settings.text.replace('(?)', '').replace('(?)', numbers[0]).replace('(?)', numbers[1]).replace('(?)', numbers[3]), [[{text: '🏠 Вернуться обратно', callback_data: numbers[2]}]].concat(bot_menu.input_settings.buttons), user.bot_last_id, 'input_'+action);
        else {
          message = Number(message);
          if (message >= numbers[0] && message <= numbers[1]) {
            await updateDB(database, 'settings', `${action}=${message}`);
            if (numbers[2] == 'buy_settings') await buySettings();
            if (numbers[2] == 'sell_settings') await sellSettings();
            if (numbers[2] == 'time_settings') await timeSettings();
          } else await send_message(bot_menu.input_settings.text.replace('(?)', '❗️ *Вы ошиблись при вводе числа*\n').replace('(?)', numbers[0]).replace('(?)', numbers[1]).replace('(?)', ''), [[{text: '🏠 Вернуться обратно', callback_data: numbers[2]}]].concat(bot_menu.input_settings.buttons), user.bot_last_id, 'input_'+action);
        }
      }
      //////////////////////////
      //                      //
      //  Управление уведом.  //
      //                      //
      //////////////////////////
      async function changeNotify(action) {
        action = action.split('change_notify_')[1];
        settings = await selectDB(database, 'settings', '*');
        if (action == 'notifications_buy') {
          settings.notifications_buy = (settings.notifications_buy == 1) ? 0 : 1;
          await updateDB(database, 'settings', `notifications_buy=${settings.notifications_buy}`);
          await buySettings();
        } else {
          settings.notifications_sell = (settings.notifications_sell == 1) ? 0 : 1;
          await updateDB(database, 'settings', `notifications_sell=${settings.notifications_sell}`);
          await sellSettings();
        }
      }
      ////////////////////////
      //                    //
      //       Баланс       //
      //                    //
      ////////////////////////
      async function balanceMenu() {
        add_button = [];
        portfolio = await getPortfolio();
        if (user.tinkoff_name == 'Sandbox') add_button = [[{text: '💳 Пополнить баланс', callback_data: 'balance_add'}]]
        await send_message(bot_menu.info_balance.text.replace('(?)', portfolio.totalAmountCurrencies), add_button.concat(bot_menu.info_balance.buttons), user.bot_last_id, 'info_balance');
      }
      ////////////////////////
      //                    //
      //  Пополнить баланс  //
      //                    //
      ////////////////////////
      async function balanceAdd(data="") {
        if (data == "") await send_message(bot_menu.balance_add.text.replace('(?)', ''), bot_menu.balance_add.buttons, user.bot_last_id, 'balance_add');
        else {
          data = Number(data);
          if (data >= 1 && data <= 100000) {
            amount = Helpers.toQuotation(data);
            data = await client_api.sandbox.sandboxPayIn({accountId: user.tinkoff_id, amount: {currency: 'RUB', units: amount.units, nano: amount.nano}});
            await balanceMenu();
          } else await send_message(bot_menu.balance_add.text.replace('(?)', '❗️ *Вы ошиблись при вводе числа*\n'), bot_menu.balance_add.buttons, user.bot_last_id, 'balance_add');
        }
      }
      /*//////////////////////////////////*/
      /*/                                /*/
      /*/                                /*/
      /*/      Запуск Tinkoff бота       /*/
      /*/                                /*/
      /*/                                /*/
      /*//////////////////////////////////*/
      async function startBot() {
        if (!bot_is_work) {
          ////////////////////////
          //                    //
          //   Получить акции   //
          //                    //
          ////////////////////////
          info = '-';
          history = [];
          history_procent = 0;
          await_update = true;
          instruments_data = {};
          bot_window_focus = true;
          instruments = await client_api.instruments.getFavorites();
          favoriteInstruments = instruments.favoriteInstruments;
          instruments = [];
          settings = await selectDB(database, 'settings', '*');
          if (favoriteInstruments.length > 0) {
            bot_is_work = true;
            for (instrument of favoriteInstruments) {
              if (all_instruments[instrument.figi] !== undefined) {
                instruments.push({figi: instrument.figi, interval: 1});
                instruments_data[instrument.figi] = {'ticker': instrument.ticker, 'lot': all_instruments[instrument.figi].lot, 'avalible': true, 'direction': '', 'open': 0, 'close': 0, 'high': 0, 'low': 0, 'volume': 0, 'is_buy': false, 'buy_price': 0, 'buy_commision': 0, 'buy_lots': 0, 'buy_time': ''}
              }
            }
            /////////////////////////
            //                     //
            //  Подписка на акции  //
            //                     //
            /////////////////////////
            last_update = new Date();
            candle_date = new Date();
            portfolio = await getPortfolio();
            await menuBot();
            unsubscribe = await client_api.stream.market.candles({instruments: instruments, waitingClose: false}, async function (candle) {
              if (candle.volume != undefined) {
                candle_date = new Date(candle.lastTradeTs.toString());
                if (candle_date.getSeconds() == new Date().getSeconds()) {
                  instruments_data[candle.figi]['lastUpdate'] = candle_date;
                  instruments_data[candle.figi]['volume'] = Number(candle.volume);
                  instruments_data[candle.figi]['low'] = Helpers.toNumber(candle.low);
                  instruments_data[candle.figi]['high'] = Helpers.toNumber(candle.high);
                  instruments_data[candle.figi]['open'] = Helpers.toNumber(candle.open);
                  instruments_data[candle.figi]['close'] = Helpers.toNumber(candle.close);
                  if (candle_date.getSeconds() != last_update.getSeconds() && await_update) {
                    last_update = new Date();
                    if (last_update.getSeconds() == 0) {for (figi of Object.keys(instruments_data)) {instruments_data[figi].direction = ''}}
                    candles();
                  }
                }
              }
            });
            async function candles() {
              await_update = false;
              instruments_sort = [];
              for (figi of Object.keys(instruments_data)) {
                if (instruments_data[figi].close != 0) {
                  if (!instruments_data[figi].is_buy) {
                    ///////////////////////
                    //                   //
                    // Сигнал на покупку //
                    //                   //
                    ///////////////////////  
                    if (settings.signals_buy == 'да' && instruments_data[figi].direction != 'long' && instruments_data[figi].avalible && instruments_data[figi].is_buy == false && instruments_data[figi].volume >= Number(settings.indicator_volume_buy) && (instruments_data[figi].high / instruments_data[figi].low - 1) * 100 >= Number(settings.indicator_price_buy) && instruments_data[figi].close < instruments_data[figi].open) {
                      if (portfolio != null && Number(last_update.toLocaleTimeString('ru').split(':')[0]) >= settings.start_trading && Number(last_update.toLocaleTimeString('ru').split(':')[0]) < settings.stop_trading && history_procent <= settings.stop_trading_procent) {
                        buy_lots = await getCount(instruments_data[figi].high, instruments_data[figi].lot, portfolio.totalAmountCurrencies);
                        if (buy_lots > 0) await buyData(figi, buy_lots, instruments_data[figi].open);
                      }
                    }
                  } else {
                    ///////////////////////
                    //                   //
                    // Сигнал на продажу //
                    //                   //
                    ///////////////////////
                    if (settings.signals_sell == 'да' && instruments_data[figi].volume >= Number(settings.indicator_volume_sell) && (instruments_data[figi].close/instruments_data[figi].buy_price - 1) * 100 >= Number(settings.indicator_price_sell) && instruments_data[figi].close >= instruments_data[figi].buy_price) await sellData(figi, instruments_data[figi].close, instruments_data[figi].buy_price, false);
                    else if (settings.signals_sell == 'да' && (instruments_data[figi].close/instruments_data[figi].buy_price - 1) * 100 <= -Number(settings.stop_loss_price_sell) && instruments_data[figi].buy_time.getTime() + (settings.sell_after_time * 60000) <= new Date().getTime()) await sellData(figi, instruments_data[figi].close, instruments_data[figi].buy_price, true);
                    else if (instruments_data[figi].buy_time.getTime() + ((settings.sell_after_time_indicator * 60) * 60000) <= new Date().getTime()) await sellData(figi, instruments_data[figi].close, instruments_data[figi].buy_price, true);
                  }
                  //////////////////////
                  //                  //
                  //    Индикаторы    //
                  //                  //
                  //////////////////////
                  if (instruments_data[figi].is_buy == false) {
                    is_buy = '';
                    procent = (instruments_data[figi].high / instruments_data[figi].low - 1) * 100;
                    indicator_3 = (instruments_data[figi].close < instruments_data[figi].open) ? '🟥' : '🟩';
                    indicator_2 = (procent >= Number(settings.indicator_price_buy) && instruments_data[figi].close < instruments_data[figi].open) ? '⚡ ' : '';
                    indicator_1 = (instruments_data[figi].volume >= Number(settings.indicator_volume_buy) && instruments_data[figi].close < instruments_data[figi].open) ? '⚡ ' : '';
                  } else {
                    is_buy = '🛒 ';
                    indicator_1 = '';
                    indicator_2 = '';
                    procent = (instruments_data[figi].close/instruments_data[figi].buy_price - 1) * 100;
                    indicator_3 = (instruments_data[figi].close < instruments_data[figi].buy_price) ? '🟥' : '🟩';
                  }
                  if (isNaN(procent)) procent = 0;
                  volume = (instruments_data[figi].volume >= 1000) ? Math.trunc(instruments_data[figi].volume/1000)+'K' : instruments_data[figi].volume;
                  if (is_buy != '' || indicator_1 != '' || indicator_2 != '') instruments_sort.push(`${is_buy}${indicator_1}${indicator_2}${indicator_3} [${instruments_data[figi].ticker}](https://www.tinkoff.ru/invest/stocks/${instruments_data[figi].ticker}/) *|* \`${instruments_data[figi].close.toFixed(2)}₽\` *|* \`Vol:${volume}\` *|* \`${procent.toFixed(2)}%\``)
                }
              }
              //////////////////////
              //                  //
              // Вывод информации //
              //                  //
              //////////////////////
              instruments_sort.sort().reverse();
              if (last_update.getSeconds() % 5 == 0 || window_bot_reload) {window_bot_reload = false; await menuBot()}
              await_update = true;
            }
          } else await send_message(bot_menu.error_instruments.text, bot_menu.error_instruments.buttons, user.bot_last_id, 'main');
        } else {
          bot_is_work = false;
          alert_notify = false;
          await unsubscribe();
          try {await client_api.stream.market.cancel()} catch {}
          for (figi of Object.keys(instruments_data)) {if (instruments_data[figi].is_buy == true) alert_notify = true}
          if (alert_notify) await send_message(bot_menu.error_buy_notification.text, bot_menu.error_buy_notification.buttons, user.bot_last_id, 'main');
          else await homeMenu();
        }
      }
      //////////////////////
      //                  //
      //   Купить акцию   //
      //                  //
      //////////////////////
      async function buyData(figi, buy_lots, price, no_indicators=false) {
        candles_data = await getCandles(database, figi);
        if (candles_data != null) {
          if (candles_data[0] == 'short' || no_indicators) {
            if ((price / candles_data[2] - 1) * 100 >= Number(settings.indicator_price_buy) && candles_data[3] >= settings.procent_buyers || no_indicators) {
              order = await createOrder(figi, buy_lots, 'buy', 'market');
              if (order != null) {
                instruments_data[figi].is_buy = true;
                instruments_data[figi].buy_lots = buy_lots;
                instruments_data[figi].buy_time = new Date();
                try {
                  instruments_data[figi].buy_commision = (Helpers.toNumber(order.initialCommission) / (buy_lots * instruments_data[figi].lot));
                  instruments_data[figi].buy_price = Helpers.toNumber(order.executedOrderPrice) + instruments_data[figi].buy_commision;
                  portfolio = await getPortfolio();
                  if (settings.notifications_buy == 1 || settings.notifications_buy == 'да') try{await client_bot.sendMessage(user.telegram_id, bot_menu.buy_notify.text.replace('(?)', `[${instruments_data[figi].ticker}](https://www.tinkoff.ru/invest/stocks/${instruments_data[figi].ticker}/)`).replace('(?)', instruments_data[figi].buy_price.toFixed(2)).replace('(?)', instruments_data[figi].buy_commision.toFixed(2)).replace('(?)', instruments_data[figi].buy_lots).replace('(?)', instruments_data[figi].lot), {reply_markup: JSON.stringify({inline_keyboard: bot_menu.buy_notify.buttons}), parse_mode: "Markdown", disable_web_page_preview: true})} catch (err) {console.log(err)}
                } catch {}
                info = '-';
                window_bot_reload = true;
              } else instruments_data[figi].avalible = false;
            }
          } else instruments_data[figi].direction = 'long';
        }
      }
      ///////////////////////
      //                   //
      //   Продать акцию   //
      //                   //
      ///////////////////////
      async function sellData(figi, price, price_buy, stop_loss) {
        candles_data = await getCandles(database, figi);
        if (candles_data != null) {
          if ((candles_data[1]/price_buy - 1) * 100 >= Number(settings.indicator_price_sell) || stop_loss) {
            order_sell = await createOrder(figi, instruments_data[figi].buy_lots, 'sell', 'market');
            if (order_sell != null) {
              instruments_data[figi].is_buy = false;
              try {
                portfolio = await getPortfolio();
                sell_comission = (Helpers.toNumber(order.initialCommission) / (instruments_data[figi].buy_lots * instruments_data[figi].lot));
                sell_price = Helpers.toNumber(order_sell.executedOrderPrice) - sell_comission;
                procent_notify = (sell_price/instruments_data[figi].buy_price - 1) * 100;
                indicator_temp = (procent_notify > 0) ? '🟩' : '🟥';
                history.push({'ticker': instruments_data[figi].ticker, 'buy': instruments_data[figi].buy_price, 'sell': sell_price, 'lot': instruments_data[figi].lot, 'buy_lots': instruments_data[figi].buy_lots});
                if (settings.notifications_sell == 1 || settings.notifications_sell == 'да') try{await client_bot.sendMessage(user.telegram_id, bot_menu.sell_notify.text.replace('(?)', indicator_temp).replace('(?)', `[${instruments_data[figi].ticker}](https://www.tinkoff.ru/invest/stocks/${instruments_data[figi].ticker}/)`).replace('(?)', sell_price.toFixed(2)).replace('(?)', procent_notify.toFixed(2)).replace('(?)', instruments_data[figi].buy_lots).replace('(?)', instruments_data[figi].lot), {reply_markup: JSON.stringify({inline_keyboard: bot_menu.sell_notify.buttons}), parse_mode: "Markdown", disable_web_page_preview: true})} catch (err) {console.log(err)}
              } catch {}
              instruments_data[figi].buy_lots = 0;
              instruments_data[figi].buy_price = 0;
              instruments_data[figi].buy_commision = 0;
              info = '-';
              window_bot_reload = true;
              history_procent = 0;
              for (var i = 0; i < history.length; i++) {
                procent = (history[i].sell/history[i].buy - 1) * 100;
                history_procent += procent;
              }  
              if (history_procent >= settings.stop_trading_procent) {
                alert_notify = false;
                for (figi of Object.keys(instruments_data)) {if (instruments_data[figi].is_buy == true) alert_notify = true}
                if (!alert_notify) {
                  bot_is_work = false;
                  bot_window_focus = false;
                  await unsubscribe();
                  try {await client_api.stream.market.cancel()} catch {}
                  await send_message(bot_menu.stop_trading_notify.text.replace('(?)', history_procent.toFixed(2)), bot_menu.stop_trading_notify.buttons, user.bot_last_id, 'main');
                }
              }
            }
          }
        }
      }
      /////////////////////////
      //                     //
      //  Главное меню бота  //
      //                     //
      /////////////////////////
      async function menuBot() {
        if (info != instruments_sort.join('\n') && bot_window_focus || instruments_sort.length == 0 && bot_window_focus) {
          info = instruments_sort.slice(0, 10).join('\n');
          add_button = [[{text: `🗂 История торгов`, callback_data: 'history_bot'}, {text: '🤖 Остановить бота', callback_data: 'start_bot'}]];
          try {await send_message(bot_menu.main_bot.text.replace('(?)', instruments_sort.length).replace('(?)', instruments.length).replace('(?)', last_update.toLocaleTimeString('ru')).replace('(?)', info), add_button.concat(bot_menu.main_bot.buttons), user.bot_last_id, 'main_bot')} catch {}
        }
      }
      ////////////////////////
      //                    //
      //   История торгов   //
      //                    //
      ////////////////////////
      async function historyBot() {
        temp_history = [];
        bot_window_focus = false;
        info = '';
        history_procent = 0;
        for (var i = 0; i < history.length; i++) {
          procent = (history[i].sell/history[i].buy - 1) * 100;
          history_procent += procent;
        }
        temp_history = reverseArr(history).slice(0, 10);
        for (var i = 0; i < temp_history.length; i++) {
          color = '🟩';
          procent = (temp_history[i].sell/temp_history[i].buy - 1) * 100;
          if (procent <= 0) color = '🟥';
          info = info + `${color} [${temp_history[i].ticker}](https://www.tinkoff.ru/invest/stocks/${temp_history[i].ticker}/) *|* \`${temp_history[i].lot * temp_history[i].buy_lots}\` *|* \`${temp_history[i].buy.toFixed(2)}₽\` *->* \`${temp_history[i].sell.toFixed(2)}₽\` *=* \`${procent.toFixed(2)}%\`\n`
        }
        await send_message(bot_menu.history_bot.text.replace('(?)', history.length).replace('(?)', history_procent.toFixed(2)).replace('(?)', info), bot_menu.history_bot.buttons, user.bot_last_id, 'history_bot');
      }
      /*//////////////////////////////////*/
      /*/                                /*/
      /*/                                /*/
      /*/      Обработчик сообщений      /*/
      /*/                                /*/
      /*/                                /*/
      /*//////////////////////////////////*/
      client_bot.on('message', async function onMessage(msg) {
        user = await selectDB(database, 'user', '*');
        if (msg.chat.id == user.telegram_id) {
          if (user.bot_last_action == 'balance_add') await balanceAdd(msg.text);
          else if (user.bot_last_action.indexOf('input_') != -1) await inputSettings(user.bot_last_action, msg.text);
          if (bot_is_work) {
            if (msg.text.toLowerCase().indexOf('купить ') != -1) {
              figi_signal = null;
              for (figi_temp of Object.keys(all_instruments)) {if (all_instruments[figi_temp].ticker == msg.text.split(' ')[1]) figi_signal = figi_temp}
              if (figi_signal != null) {
                portfolio = await getPortfolio();
                if (portfolio != null && instruments_data[figi_signal].is_buy == false) {
                  buy_lots = await getCount(instruments_data[figi_signal].close, instruments_data[figi_signal].lot, portfolio.totalAmountCurrencies);
                  if (buy_lots > 0) await buyData(figi_signal, buy_lots, instruments_data[figi_signal].close, true);
                }
              }
            } else if (msg.text.toLowerCase().indexOf('продать ') != -1) {
              figi_signal = null;
              for (figi of Object.keys(all_instruments)) {if (all_instruments[figi].ticker == msg.text.split(' ')[1]) figi_signal = figi}
              if (figi_signal != null) {if (instruments_data[figi_signal].is_buy == true) await sellData(figi_signal, instruments_data[figi_signal].close, instruments_data[figi_signal].buy_price, true)}
            }
          }
          try {await client_bot.deleteMessage(msg.chat.id, msg.message_id)} catch {}
        }
      });
      client_bot.on('callback_query', async function onCallbackQuery(msg) {
        user = await selectDB(database, 'user', '*');
        if (msg.message.chat.id == user.telegram_id) {
          if (msg.data == 'main') await homeMenu();
          else if (msg.data == 'menu_bot') await menuBot();
          else if (msg.data == 'start_bot') await startBot();
          else if (msg.data == 'history_bot') await historyBot();
          else if (msg.data == 'balance_add') await balanceAdd();
          else if (msg.data == 'info_balance') await balanceMenu();
          else if (msg.data == 'buy_settings') await buySettings();
          else if (msg.data == 'sell_settings') await sellSettings();
          else if (msg.data == 'time_settings') await timeSettings();
          else if (msg.data == 'buy_sell_signals') await buySellSignals();
          else if (msg.data.indexOf('input_') != -1) await inputSettings(msg.data);
          else if (msg.data.indexOf('change_notify_') != -1) await changeNotify(msg.data);
          else if (msg.data.indexOf('change_signals_') != -1) await changeBuySell(msg.data);
          else if (msg.data.indexOf('candle_time_check') != -1) await candleTimeCheck(msg.data);
          else if (msg.data == 'open_bot') {bot_window_focus = true; info = '-'; await menuBot()}
          else if (msg.data == 'delete_notify') try {await client_bot.deleteMessage(msg.message.chat.id, msg.message.message_id)} catch {}
          else if (msg.data == 'main_settings') await send_message(bot_menu.main_settings.text, bot_menu.main_settings.buttons, user.bot_last_id, 'main_settings');
          else if (msg.data == 'change_tokens') await send_message(bot_menu.change_tokens.text, bot_menu.change_tokens.buttons, user.bot_last_id, 'change_tokens');
          else if (msg.data == 'change_telegram_token') {await database.run(`DELETE FROM user`); await client_bot.sendMessage(user.telegram_id, '❗️ *Перезапустите окно с ботом*, для смены токена', {parse_mode: "Markdown"})}
          else if (msg.data == 'change_tinkoff_token') {await updateDB(database, 'user', `tinkoff_id = '', tinkoff_name = '', tinkoff_token = ''`); await client_bot.sendMessage(user.telegram_id, '❗️ *Перезапустите окно с ботом*, для смены токена', {parse_mode: "Markdown"})} 
          try {await client_bot.answerCallbackQuery(msg.id)} catch {}
        }
      });
    }
  });
})();