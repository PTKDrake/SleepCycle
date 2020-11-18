const date_time = global.nodemodule['date-and-time'];

function sleep(type, data) {
    let args = data.args;
    let date = new Date();
    let output = "";
    if (args.length > 1) {
        data.log(args[1]);
        if (parse(args[1])) {
            date = date_time.addYears(parse(args[1]), 1);
        } else if (parse('0' + args[1])) {
            date = date_time.addYears(parse('0' + args[1]), 1);
        } else {
            return ({
                handler: "internal",
                data: "Thời gian không hợp lệ. Kiểu thời gian hợp lệ: HH:mm, ví dụ: 06:30|6:30"
            });
        }
        output += `Nếu bạn muốn thức dậy lúc ${date_time.format(date, 'HH:mm')} thì bạn nên đi ngủ lúc: `;
        output += list(date, true);
    } else {
        output += `Nếu bạn đi ngủ bây giờ(${date_time.format(date, 'HH:mm')}) thì bạn nên dậy vào lúc: `;
        output += list(date);
    }
    output += '\nNhớ đi ngủ sớm nha <3 <3.';
    return ({
        handler: "internal",
        data: output
    });
}

function wake_up(type, data){
    let args = data.args;
    if(args > 1){
        return ({
            handler: 'internal',
            data: "Mai nhá em nhá giờ đi ngủ đã."
        })
    }else{
        return ({
            handler: 'internal',
            data: `Sử dụng: ${global.config.commandPrefix}wake_up ${global.commandMapping['wake_up'].hargs['vi_VN']} để ${global.commandMapping['wake_up'].hdesc['vi_VN']}`
        })
    }
}

function list(date, minus = false){
    let string = '';
    for (let i = 1; i <= 7; i++) {
        if (i > 1) {
            string += " hoặc ";
        }
        if(minus) string += date_time.format(new Date(date.getTime() - (i * 90 + 15) * 60000), 'HH:mm');
        else string += date_time.format(new Date(date.getTime() + (i * 90 + 15) * 60000), 'HH:mm');
        switch (i) {
            case 5:
                string += '(gần đủ)';
                break;
            case 6:
                string += '(đủ giấc)';
                break;
            case 7:
                string += '(thừa giấc).';
                break;
        }
    }
    return string;
}

function parse(time){
    if(!date_time.isValid(time, 'HH:mm:ss')) return false;
    return date_time.parse(time, 'HH:mm:ss');
}

module.exports = {
    sleep, wake_up
};
