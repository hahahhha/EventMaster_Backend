// Подключаем библиотеку Nodemailer
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: 'smtp.yandex.ru',
  port: 465, 
  secure: true, 
  auth: {
    user: process.env.EMAIL_LOGIN, 
    pass: process.env.EMAIL_PASSWORD, 
  }
});

module.exports = transporter;

// Пример отправки
// transporter.sendMail({
//   from: 'studentflow@yandex.ru',
//   to: 'micha3lbarannikov@yandex.ru',
//   subject: 'Ваш код подтверждения',
//   html: `<h1>Заголовок</h1><p>Параграф, тест Yandex.smtp</p>`,
// }, (err, info) => {
//   if (err) console.error('Ошибка:', err);
//   else console.log('Отправлено:', info.response);
// });