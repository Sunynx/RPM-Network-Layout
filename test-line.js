require('dotenv').config({ path: '.env.local' });

const LINE_CHANNEL_ACCESS_TOKEN = process.env.LINE_CHANNEL_ACCESS_TOKEN;
const LINE_TARGET_ID = process.env.LINE_TARGET_ID;

async function testLine() {
  console.log("⏳ กำลังทดสอบส่งข้อความ LINE OA...");
  if (!LINE_CHANNEL_ACCESS_TOKEN || !LINE_TARGET_ID) {
    console.error("❌ ขาด Token หรือ Target ID ใน .env.local");
    return;
  }

  const payload = {
    to: LINE_TARGET_ID,
    messages: [
      {
        type: "flex",
        altText: `🚨 ALERT: ระบบทดสอบการแจ้งเตือน`,
        contents: {
          type: "bubble",
          size: "kilo",
          header: {
            type: "box",
            layout: "vertical",
            backgroundColor: "#ef4444",
            contents: [
              { type: "text", text: "🔴 NETWORK DOWN", weight: "bold", color: "#ffffff", size: "sm" }
            ]
          },
          body: {
            type: "box",
            layout: "vertical",
            spacing: "md",
            contents: [
              {
                type: "box",
                layout: "baseline",
                spacing: "sm",
                contents: [
                  { type: "text", text: "อุปกรณ์", color: "#aaaaaa", size: "xs", flex: 2 },
                  { type: "text", text: "TEST-SWITCH-01", wrap: true, color: "#333333", size: "sm", flex: 5, weight: "bold" }
                ]
              },
              {
                type: "box",
                layout: "baseline",
                spacing: "sm",
                contents: [
                  { type: "text", text: "ประเภท", color: "#aaaaaa", size: "xs", flex: 2 },
                  { type: "text", text: "SWITCH", wrap: true, color: "#666666", size: "sm", flex: 5 }
                ]
              },
              {
                type: "box",
                layout: "baseline",
                spacing: "sm",
                contents: [
                  { type: "text", text: "ระยะเวลา", color: "#aaaaaa", size: "xs", flex: 2 },
                  { type: "text", text: `12 นาที (TEST)`, wrap: true, color: "#ef4444", size: "sm", flex: 5, weight: "bold" }
                ]
              },
              {
                type: "box",
                layout: "baseline",
                spacing: "sm",
                contents: [
                  { type: "text", text: "ตรวจพบ", color: "#aaaaaa", size: "xs", flex: 2 },
                  { type: "text", text: new Date().toLocaleString('th-TH', { timeZone: 'Asia/Bangkok', dateStyle: 'short', timeStyle: 'short' }), wrap: true, color: "#666666", size: "xs", flex: 5 }
                ]
              }
            ]
          }
        }
      }
    ]
  };

  try {
    const res = await fetch('https://api.line.me/v2/bot/message/push', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${LINE_CHANNEL_ACCESS_TOKEN}`,
      },
      body: JSON.stringify(payload)
    });
    
    if (!res.ok) {
      const errData = await res.text();
      console.error(`❌ ส่งไม่สำเร็จ: ${res.status} - ${errData}`);
    } else {
      console.log(`✅ ส่งข้อความทดสอบสำเร็จ! โปรดเช็คในแอป LINE ของคุณ`);
    }
  } catch (err) {
    console.error("❌ เกิดข้อผิดพลาด:", err.message);
  }
}

testLine();
