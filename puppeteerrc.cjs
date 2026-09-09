// .puppeteerrc.cjs — file cấu hình chính thức của Puppeteer (đọc dù package.json để "type": "module")
// Mục đích: ép Chromium tải về NẰM TRONG thư mục project thay vì $HOME/.cache,
// vì Render không giữ $HOME/.cache giữa lúc build và lúc chạy thật -> đây là nguyên nhân
// phổ biến nhất gây lỗi "Could not find Chromium" khi deploy Puppeteer lên Render.
const { join } = require("path");

module.exports = {
  cacheDirectory: join(__dirname, ".cache", "puppeteer"),
};
