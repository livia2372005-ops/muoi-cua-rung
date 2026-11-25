# Sách Điện Tử: Muối Của Rừng — Nguyễn Huy Thiệp (Nhóm 3)

Website sách điện tử lật trang 3D tương tác phục vụ bài học Ngữ văn 12: **"Muối của rừng"** (Nguyễn Huy Thiệp).

## Điểm nổi bật theo yêu cầu bài giao
1. **Sách điện tử lật trang 3D (Flipbook) & Chế độ xem rộng/di động**: Trải nghiệm lật trang sách 3D trên máy tính và tự chuyển sang dạng thẻ đọc cuộn dọc trên điện thoại.
2. **Tóm tắt truyện bằng sơ đồ có giọng đọc (tự đọc)**: Sơ đồ 5 mắt xích cốt truyện kết nối trực tiếp với trình phát giọng đọc, tự động đánh dấu từng chặng khi âm thanh chạy.
3. **Quá trình đi săn của ông Diểu**: Đối chiếu trực quan 5 chặng biến chuyển giữa **Hành động & Sự tước bỏ lớp vỏ vật chất** và **Diễn biến tâm lý & Sự thức tỉnh nhân tính**, kèm biểu đồ hai đường tâm lý.
4. **Sẵn sàng xuất link gửi lên nhóm lớp**: Mọi đường dẫn đều tương đối (`./...`), có file `.nojekyll` và nút sao chép link nộp bài ngay trên trang web.

---

## Hướng dẫn gắn file giọng đọc của Nhóm 3

1. Mở sách đến trang **Sơ đồ & Giọng đọc**, bấm nút **🎙️ Kịch bản đọc** ở thanh trên cùng để xem và sao chép kịch bản 5 đoạn (khoảng 60–80 giây đọc vừa phải).
2. Thu âm bằng điện thoại hoặc máy tính, xuất file âm thanh (ưu tiên `.mp3`, hoặc `.m4a`, `.wav`, `.ogg`).
3. Để kiểm tra ngay trên trình duyệt: bấm nút **📎 Gắn thử file ghi âm** ngay trên thanh phát âm thanh.
4. Để gắn cố định trước khi đăng lên GitHub Pages: đổi tên file thành **`tom-tat.mp3`** và chép vào thư mục `audio/`:
   ```
   audio/tom-tat.mp3
   ```
   *(Nếu nhịp đọc ở từng chặng dài/ngắn khác nhau, có thể chỉnh lại tỷ lệ `startRatio` và `endRatio` trong file `scripts/data.js`.)*

---

## Hướng dẫn đăng lên GitHub Pages lấy link gửi nhóm lớp

1. Tạo một repository mới trên GitHub (ví dụ `muoi-cua-rung-nhom-3`) ở chế độ **Public**.
2. Đưa toàn bộ thư mục dự án lên GitHub bằng Git:
   ```bash
   git add .
   git commit -m "Hoàn thiện sách điện tử Muối của rừng - Nhóm 3"
   git branch -M main
   git remote add origin https://github.com/<ten-tai-khoan>/muoi-cua-rung-nhom-3.git
   git push -u origin main
   ```
   *(Hoặc vào trực tiếp repository trên web GitHub → **Add file → Upload files** và kéo toàn bộ các file/thư mục trong `PJLC` vào).*
3. Trên GitHub, vào **Settings → Pages**:
   - Mục **Source**: chọn **Deploy from a branch**.
   - Mục **Branch**: chọn **`main`** và thư mục **`/(root)`**, bấm **Save**.
4. Chờ khoảng 1–2 phút, GitHub sẽ cung cấp link công khai dạng:
   `https://<ten-tai-khoan>.github.io/muoi-cua-rung-nhom-3/`
   Sao chép link đó gửi lên nhóm lớp!
