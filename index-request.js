const { google } = require('googleapis');
const key = require('./service-account.json');

const jwtClient = new google.auth.JWT(
  key.client_email,
  null,
  key.private_key,
  ['https://www.googleapis.com/auth/indexing'],
  null
);

jwtClient.authorize((err) => {
  if (err) {
    console.error('حدث خطأ في الاتصال:', err);
    return;
  }

  const indexing = google.indexing({ version: 'v3', auth: jwtClient });

  indexing.urlNotifications.publish({
    requestBody: {
      url: 'https://kisaa-project.vercel.app',
      type: 'URL_UPDATED'
    }
  }, (err, res) => {
    if (err) {
      console.error('فشل إرسال الطلب:', err.message);
    } else {
      console.log(' تم إرسال طلب التحديث بنجاح إلى جوجل!', res.data);
    }
  });
});