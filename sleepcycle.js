const date_time = global.nodemodule['date-and-time'];
const path = require('path');
const fs = require('fs');

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

var log = false;

function onLoad(data) {
    log = data.log;
}

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
        info3: '(Thừa giấc)'
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
        info3: '(Extra sleep)'
    }
};

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
        data.log(args[1]);
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
        list(date, true, lang),
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
    if(args > 1){
        return ({
            handler: 'internal',
            data: "Chưa xong iem."
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
            i = 7 - i;
            string += date_time.format(new Date(date.getTime() - (i * 90 + 15) * 60000), 'HH:mm');
        }
        else string += date_time.format(new Date(date.getTime() + (i * 90 + 15) * 60000), 'HH:mm');
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
        if (minus) i = 7 - i;
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
