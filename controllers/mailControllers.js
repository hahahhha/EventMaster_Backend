const transporter = require('../config/mail');

class MailController {
    static async sendCode(email, code) {
        // transporter.sendMail({
        //   from: 'studentflow@yandex.ru',
        //   to: email,
        //   subject: 'Ваш код подтверждения',
        //   html: `<h1>Код подтверждения на сайте StudentFlow</h1><h2>${code}</h2>`,
        // }, (err, info) => {
        //   if (err) console.error('Ошибка:', err);
        //   else console.log('Отправлено:', info.response);
        // });
        console.log('отправка кода временно отключена (на время теста)')
    }
}

module.exports = MailController;