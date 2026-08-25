const { google } = require('googleapis');
const path = require('path');

async function sendIndexRequest() {
  try {
    const auth = new google.auth.GoogleAuth({
      keyFile: path.join(__dirname, 'service-account.json'),
      scopes: ['https://www.googleapis.com/auth/indexing'],
    });

    const indexing = google.indexing({ version: 'v3', auth });

    const res = await indexing.urlNotifications.publish({
      requestBody: {
        url: 'https://kisaa-project.vercel.app',
        type: 'URL_UPDATED',
      },
    });

    console.log('✅ تم إرسال طلب الأرشفة بنجاح!');
    console.log(res.data);
  } catch (error) {
    console.error('❌ حدث خطأ أثناء الإرسال:');
    console.error(error.message);
  }
}

sendIndexRequest();
