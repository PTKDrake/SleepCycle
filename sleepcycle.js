const date_time = global.nodemodule['date-and-time'];

function sleep(type, data) {
    let args = data.args;
    let date = new Date();
    let output = "";
    if (args.length > 1) {
        data.log(args[1]);
        if (date_time.isValid(args[1], 'HH:mm:ss')) {
            date = date_time.addYears(date_time.parse(args[1], 'HH:mm:ss'), 1);
        } else if (date_time.isValid('0' + args[1], 'HH:mm:ss')) {
            date = date_time.addYears(date_time.parse('0' + args[1], 'HH:mm:ss'), 1);
        } else {
            return ({
                handler: "internal",
                data: "Thời gian không hợp lệ. Kiểu thời gian hợp lệ: HH:mm:ss, ví dụ: 6:30|6:30:00"
            });
        }
        output += `Nếu bạn muốn thức dậy lúc ${date_time.format(date, 'HH:mm:ss')} thì bạn nên đi ngủ lúc: `;
        for (let i = 7; i >= 1; i--) {
            if (i < 7) {
                output += " hoặc ";
            }
            output += date_time.format(new Date(date.getTime() - (i * 90 + 15) * 60000), 'HH:mm:ss');
            switch (i) {
                case 5:
                    output += '(gần đủ)';
                    break;
                case 6:
                    output += '(đủ giấc)';
                    break;
                case 7:
                    output += '(thừa giấc)';
                    break;
                case 1:
                    output += '.';
            }
        }
    } else {
        output += `Nếu bạn đi ngủ bây giờ(${date_time.format(date, 'HH:mm:ss')}) thì bạn nên dậy vào lúc: `;
        for (let i = 1; i <= 7; i++) {
            if (i > 1) {
                output += " hoặc ";
            }
            output += date_time.format(new Date(date.getTime() + (i * 90 + 15) * 60000), 'HH:mm:ss');
            switch (i) {
                case 5:
                    output += '(gần đủ)';
                    break;
                case 6:
                    output += '(đủ giấc)';
                    break;
                case 7:
                    output += '(thừa giấc).';
                    break;
            }
        }
    }
    return ({
        handler: "internal",
        data: output
    });
}

module.exports = {
    sleep
};
