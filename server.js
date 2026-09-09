// server.js — chạy riêng bằng: node server.js
// Yêu cầu: npm install express cors puppeteer
// Puppeteer >= v22: headless: true đã LÀ chế độ headless mới (không cần "new").
// API cũ đã bị xoá trong v22+: waitForTimeout, $x, createIncognitoBrowserContext -> KHÔNG dùng ở đây.

import express from "express";
import cors from "cors";
import puppeteer from "puppeteer";

const app = express();
app.use(cors()); // cần thiết vì HTML mở bằng file:// hoặc origin khác localhost:3000
app.use(express.json());

app.post("/search", async (req, res) => {
  const query = (req.body?.query || "").trim();
  if (!query) {
    return res.status(400).json({ error: "Thiếu nội dung tìm kiếm" });
  }

  let browser;
  try {
    browser = await puppeteer.launch({
      headless: true, // v22+: đây đã là "new" headless mode mặc định
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage", // container Render thường /dev/shm nhỏ, dễ crash nếu thiếu dòng này
      ],
    });

    const page = await browser.newPage();
    await page.setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
        "(KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36"
    );
    await page.setViewport({ width: 1280, height: 900 });

    const url = `https://www.google.com/search?q=${encodeURIComponent(query)}`;
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 20000 });

    // Thay cho waitForTimeout (đã bị xoá): chờ có thẻ h3 xuất hiện, không quăng lỗi nếu quá giờ
    await page.waitForSelector("h3", { timeout: 8000 }).catch(() => null);

    const results = await page.evaluate(() => {
      const items = [];
      // Google hay đổi class layout theo thời gian/khu vực -> gom nhiều selector khả dĩ
      const blocks = document.querySelectorAll("div.g, div.MjjYud, div.tF2Cxc");
      blocks.forEach((block) => {
        const titleEl = block.querySelector("h3");
        const linkEl = block.querySelector("a[href]");
        if (titleEl && linkEl) {
          items.push({ title: titleEl.innerText, link: linkEl.href });
        }
      });
      return items.slice(0, 10);
    });

    await browser.close();

    if (results.length === 0) {
      return res.json({
        query,
        results: [],
        note: "Không lấy được kết quả — có thể Google chặn bot/hiện captcha, hoặc đổi layout DOM.",
      });
    }

    res.json({ query, results });
  } catch (err) {
    if (browser) await browser.close();
    console.error("Lỗi Puppeteer:", err);
    res.status(500).json({ error: "Lỗi khi tìm kiếm", detail: err.message });
  }
});

// Render tự gán PORT qua biến môi trường — không được hardcode 3000 khi deploy thật
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server đang chạy ở cổng ${PORT}`);
});
