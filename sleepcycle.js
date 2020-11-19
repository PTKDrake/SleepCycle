const date_time = global.nodemodule['date-and-time'];
const path = require('path');
const fs = require('fs');

var langMap = {
    'vi_VN': {
        remind_sleep_use: 'Sử dụng: %0% %1% để %2%',
        date_invalid: 'Thời gian không hợp lệ. Kiểu thời gian hợp lệ: HH:mm, ví dụ: 06:30|6:30.',
        sleep_wake_up: 'Nếu bạn muốn thức dậy lúc %0% thì bạn nên đi ngủ lúc: %1%%2%',
        sleep_now: 'Nếu bạn đi ngủ bây giờ(%0%) thì bạn nên dậy vào lúc: %1%%2%',
        sleep_msg: '\nNhớ đi ngủ sớm nha <3 <3.',
        or: ' hoặc ',
        info1: '(Gần đủ giấc)',
        info2: '(Đủ giấc)',
        info3: '(Thừa giấc)',
        remind_sleep_set: 'Bạn đã đặt giờ đi ngủ lúc %0%. Tôi sẽ nhắc bạn khi tới lúc.',
        remind_sleep: 'Bây giờ là %0%, đã đến giờ đi ngủ rồi bạn ơi. Hãy đi ngủ sớm nhé <3. Chúc bạn ngủ ngon.',
        remind_sleep_off: 'Bạn đã tắt tính năng hẹn giờ đi ngủ!',
        remind_sleep_not_exists: 'Bạn chưa đặt giờ đi ngủ. Nên không thể huỷ được.'
    },
    'en_US': {
        remind_sleep_use: 'Use: %0% %1% to %2%',
        date_invalid: 'Invalid time. Valid time type: HH:mm, for example: 06: 30|6:30.',
        sleep_wake_up: 'If you want to wake up at %0% then you should go to bed at: %1%%2%',
        sleep_now: 'If you go to bed now(%0%) then you should wake up at: %1%%2%',
        sleep_msg: '\nRemember to go to bed early <3 <3.',
        or: ' or ',
        info1: '(Near enough sleep)',
        info2: '(Enough sleep)',
        info3: '(Extra sleep)',
        remind_sleep_set: 'You have set a bedtime at %0%. I will remind you when the time comes.',
        remind_sleep: 'The time now is %0%, it\'s time to go to bed. Please go to bed early <3. Good night.',
        remind_sleep_off: 'You have turned off the bedtime timer!',
        remind_sleep_not_exists: 'You have not set a bedtime. So it cannot be canceled.'
    }
};

function getPath(filename) {
    return path.join(path.join(__dirname, "..", "SleepCycle"), filename);
}

function ensureExists(path, mask) {
    if (typeof mask != 'number') {
        mask = 0o777;
    }
    try {
        fs.mkdirSync(path, {
            mode: mask,
            recursive: true
        });
        return undefined;
    } catch (ex) {
        return { err: ex };
    }
}

ensureExists(path.join(__dirname, "..", "SleepCycle"));

var defaultConfig = {
    ver: 2.0,
    sleep: {

    }
};

var config = {};

var remind_times = {};

function onLoad(data) {
    if (!fs.existsSync(getPath('config.json'))) {
        fs.writeFileSync(getPath('config.json'), JSON.stringify(defaultConfig, null, 4));
        config = defaultConfig;
    } else {
        config = JSON.parse(fs.readFileSync(getPath('config.json'), {
            encoding: "utf8"
        }));
    }
    if(!config.hasOwnProperty('ver')){
        fs.writeFileSync(getPath('config.json'), JSON.stringify(defaultConfig, null, 4));
        config = defaultConfig;
    }else if(config.ver < defaultConfig.ver){
        fs.writeFileSync(getPath('config.json'), JSON.stringify(defaultConfig, null, 4));
        config = defaultConfig;
    }
    Object.keys(config.sleep).forEach(function(user){
        let time = config.sleep[user];
        if(!remind_times.hasOwnProperty(time)){
            remind_times[time] = [];
        }
        remind_times[time].push(user);
        loadRemind(time);
    })
}

function loadRemind(time){
    let now = new Date();
    let date = new Date(), parse_date;
    parse_date = parse(time);
    date.setHours(parse_date.getHours(), parse_date.getMinutes(), parse_date.getSeconds());
    if(date.getTime() <= now.getTime()) date = date_time.addDays(date, 1);
    let ms = date - now;
    setTimeout(function(){
        let users = remind_times[time] ?? [];
        users.forEach(function(user){
            let text = getLang('remind_sleep', global.data.userLanguage[user] ?? global.config.language, [date_time.format(date, 'HH:mm')]);
            global.fbchat(user, text);
        });
        setTimeout(() => loadRemind(time), 10);
    }, ms);
}

function getLang(str, lang = global.config.language, params = []){
    let text = langMap[lang].hasOwnProperty(str) ? langMap[lang][str] : str;
    for(let i = 0; i < params.length; i++){
        text = text.replace(new RegExp(`%${i}%`, 'g'), params[i]);
    }
    return text;
}

function sleep(type, data) {
    let args = data.args;
    let date = new Date();
    let params = [];
    let lang = data.resolvedLang;
    if (args.length > 1) {
        if (parse(args[1])) {
            date = date_time.addYears(parse(args[1]), 1);
        } else if (parse('0' + args[1])) {
            date = date_time.addYears(parse('0' + args[1]), 1);
        } else {
            return ({
                handler: "internal",
                data: getLang('date_invalid', lang)
            });
        }
    }
    params.push(
        date_time.format(date, 'HH:mm'),
        list(date, args.length > 1, lang),
        getLang('sleep_msg', lang)
    );
    return ({
        handler: "internal",
        data: getLang('sleep_'+(args.length > 1 ? 'wake_up' : 'now'), lang, params)
    });
}

function remind_sleep(type, data){
    let args = data.args;
    let lang = data.resolvedLang;
    let time;
    let id = data.msgdata.senderID;
    if(args.length > 1){
        switch (args[1].toLowerCase()) {
            case 'off':
            case 'huỷ':
            case 'unset':
                if(config.sleep.hasOwnProperty(id)){
                    remind_times[config.sleep[id]].splice(remind_times[config.sleep[id]].indexOf(id));
                    delete config.sleep[id];
                    fs.writeFileSync(getPath('config.json'), JSON.stringify(config, null, 4));
                    return ({
                        handler: 'internal',
                        data: getLang('remind_sleep_off', lang)
                    });
                }else{
                    return ({
                        handler: 'internal',
                        data: getLang('remind_sleep_not_exists', lang)
                    })
                }
        }
        if (parse(args[1])) {
            time = args[1];
        } else if (parse('0' + args[1])) {
            time = '0'+args[1];
        } else {
            return ({
                handler: "internal",
                data: getLang('date_invalid', lang)
            });
        }
        if(config.sleep.hasOwnProperty(id)) remind_times[config.sleep[id]].splice(remind_times[config.sleep[id]].indexOf(id));
        config.sleep[id] = time;
        fs.writeFileSync(getPath('config.json'), JSON.stringify(config, null, 4));
        if(!remind_times.hasOwnProperty(time)){
            remind_times[time] = [];
        }
        if(!remind_times[time].includes(id)) remind_times[time].push(id);
        loadRemind(time);
        return({
            handler: 'internal',
            data: getLang('remind_sleep_set', lang, [time])
        })
    }else{
        let cmdmap = global.commandMapping[args[0].replace('/', '')];
        return ({
            handler: 'internal',
            data: getLang('remind_sleep_use', lang, [
                args[0],
                cmdmap.args[lang],
                cmdmap.desc[lang]
            ])
        })
    }
}

function list(date, minus = false, lang = global.config.language){
    let string = '';
    for (let i = 1; i <= 7; i++) {
        if (i > 1) {
            string += getLang('or', lang);
        }
        if(minus){
            i = 8 - i;
            string += date_time.format(new Date(date.getTime() - (i * 90 + 15) * 60 * 1000), 'HH:mm');
        }
        else string += date_time.format(new Date(date.getTime() + (i * 90 + 15) * 60 * 1000), 'HH:mm');
        switch (i) {
            case 5:
                string += getLang('info1', lang);
                break;
            case 6:
                string += getLang('info2', lang);
                break;
            case 7:
                string += getLang('info3', lang);
                break;
        }
        if (minus) i = 8 - i;
    }
    return string;
}

function parse(time){
    if(!date_time.isValid(time, 'HH:mm:ss')) return false;
    return date_time.parse(time, 'HH:mm:ss');
}

module.exports = {
    sleep, remind_sleep, onLoad
};
