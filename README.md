# Sách Điện Tử Lật Trang: Muối Của Rừng — Nhóm 3

Website sách điện tử lật trang cong chân thực (tương tự Heyzine Flipbook) phục vụ bài học Ngữ văn 12: **"Muối của rừng"** (Nguyễn Huy Thiệp).

## Điểm nổi bật
- **Lật trang cong chân thực (`StPageFlip`)**: Hỗ trợ kéo góc trang bằng chuột hoặc chạm tay trên điện thoại, bìa cứng gập mở tự nhiên cùng tiếng sột soạt lật giấy nhẹ nhàng.
- **Chạy tốt cả khi mở file trực tiếp (`file://`) lẫn trên GitHub Pages (`https://`)**.
- **Sơ đồ Tóm tắt 5 chặng kèm Giọng đọc (Trang 4–5)**: Trình phát giọng đọc nhúng trực tiếp ngay trên trang sách, tự động tô sáng từng chặng truyện theo tiến độ đọc và có chế độ **Phóng to sơ đồ**.
- **Quá trình đi săn của ông Diểu (Trang 6–9)**: Thiết kế theo phong cách trang sách cổ điển kết hợp dây ảnh Polaroid, phân tích trọn vẹn từ phát súng đầu tiên, cú sốc ở vực Hõm Chết, quá trình tước bỏ lớp vỏ vật chất đến khoảnh khắc phóng sinh gặp hoa tử huyền.

---

## Cách gắn file giọng đọc của Nhóm 3

1. Mở nút **🎙️ Giọng đọc** trên thanh công cụ để xem và sao chép kịch bản 5 chặng.
2. Sau khi thu âm (`.mp3` hoặc `.m4a`), bạn có thể:
   - **Nghe thử ngay trên web:** bấm nút **📎 Chọn file** ngay trên khung phát âm thanh ở Trang 4.
   - **Gắn cố định để đăng GitHub Pages:** đổi tên file thành **`tom-tat.mp3`** và chép vào thư mục `audio/`:
     ```
     audio/tom-tat.mp3
     ```
   *(Có thể tinh chỉnh tỷ lệ thời gian `startRatio` trong `scripts/book-data.js` nếu cần khớp từng chặng chính xác hơn.)*

---

## Cách đăng lên GitHub Pages lấy link gửi nhóm lớp

1. Tạo một repository **Public** trên GitHub (ví dụ `muoi-cua-rung-nhom-3`).
2. Push toàn bộ thư mục này lên nhánh `main` (hoặc chọn **Add file → Upload files** trên web GitHub).
3. Vào **Settings → Pages → Source: Deploy from a branch**, chọn nhánh **`main`** và thư mục **`/(root)`**, bấm **Save**.
4. Sau 1–2 phút, lấy link `https://<ten-tai-khoan>.github.io/muoi-cua-rung-nhom-3/` gửi lên nhóm lớp!
