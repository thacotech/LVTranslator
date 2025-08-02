# Requirements Document

## Introduction

Tính năng Lịch sử dịch thuật (Translation History) sẽ cho phép người dùng lưu trữ, xem lại và tái sử dụng các bản dịch đã thực hiện trước đó. Tính năng này sẽ cải thiện trải nghiệm người dùng bằng cách giúp họ dễ dàng truy cập lại các bản dịch quan trọng mà không cần phải dịch lại từ đầu.

## Requirements

### Requirement 1

**User Story:** Là người dùng ứng dụng dịch thuật, tôi muốn các bản dịch của mình được lưu tự động, để tôi có thể xem lại chúng sau này mà không cần dịch lại.

#### Acceptance Criteria

1. WHEN người dùng thực hiện một bản dịch thành công THEN hệ thống SHALL tự động lưu bản dịch vào localStorage
2. WHEN lưu bản dịch THEN hệ thống SHALL lưu trữ văn bản gốc, bản dịch, hướng dịch (Việt→Lào hoặc Lào→Việt), và timestamp
3. WHEN localStorage đầy hoặc đạt giới hạn THEN hệ thống SHALL tự động xóa các bản dịch cũ nhất để tạo chỗ cho bản dịch mới
4. WHEN lưu bản dịch trùng lặp THEN hệ thống SHALL cập nhật timestamp thay vì tạo entry mới

### Requirement 2

**User Story:** Là người dùng, tôi muốn xem danh sách các bản dịch đã thực hiện trước đó, để tôi có thể tham khảo hoặc sử dụng lại chúng.

#### Acceptance Criteria

1. WHEN người dùng nhấp vào nút "History" THEN hệ thống SHALL hiển thị panel lịch sử dịch thuật
2. WHEN hiển thị lịch sử THEN hệ thống SHALL sắp xếp các bản dịch theo thời gian từ mới nhất đến cũ nhất
3. WHEN hiển thị mỗi item lịch sử THEN hệ thống SHALL hiển thị preview văn bản gốc (tối đa 50 ký tự), hướng dịch, và thời gian thực hiện
4. WHEN danh sách lịch sử trống THEN hệ thống SHALL hiển thị thông báo "Chưa có lịch sử dịch thuật"
5. WHEN có quá nhiều items THEN hệ thống SHALL hiển thị tối đa 20 items gần nhất và có pagination hoặc "Load more"

### Requirement 3

**User Story:** Là người dùng, tôi muốn có thể chọn một bản dịch từ lịch sử để sử dụng lại, để tôi không cần gõ lại văn bản đã dịch trước đó.

#### Acceptance Criteria

1. WHEN người dùng nhấp vào một item trong lịch sử THEN hệ thống SHALL tự động điền văn bản gốc vào input field
2. WHEN chọn item từ lịch sử THEN hệ thống SHALL tự động điền bản dịch vào output field
3. WHEN chọn item từ lịch sử THEN hệ thống SHALL tự động chuyển hướng dịch phù hợp (Việt→Lào hoặc Lào→Việt)
4. WHEN chọn item từ lịch sử THEN hệ thống SHALL tự động đóng panel lịch sử
5. WHEN chọn item từ lịch sử THEN hệ thống SHALL cập nhật font hiển thị phù hợp với ngôn ngữ

### Requirement 4

**User Story:** Là người dùng, tôi muốn có thể xóa toàn bộ lịch sử dịch thuật, để tôi có thể làm sạch dữ liệu khi cần thiết.

#### Acceptance Criteria

1. WHEN người dùng nhấp vào nút "Clear History" THEN hệ thống SHALL hiển thị dialog xác nhận
2. WHEN người dùng xác nhận xóa lịch sử THEN hệ thống SHALL xóa toàn bộ dữ liệu lịch sử từ localStorage
3. WHEN xóa lịch sử thành công THEN hệ thống SHALL hiển thị thông báo "Đã xóa lịch sử thành công"
4. WHEN xóa lịch sử thành công THEN hệ thống SHALL cập nhật giao diện hiển thị trạng thái trống
5. WHEN người dùng hủy xóa lịch sử THEN hệ thống SHALL đóng dialog và giữ nguyên dữ liệu

### Requirement 5

**User Story:** Là người dùng, tôi muốn có thể xóa từng bản dịch riêng lẻ trong lịch sử, để tôi có thể quản lý dữ liệu một cách linh hoạt.

#### Acceptance Criteria

1. WHEN hiển thị mỗi item lịch sử THEN hệ thống SHALL hiển thị nút "Delete" (icon thùng rác)
2. WHEN người dùng nhấp vào nút delete của một item THEN hệ thống SHALL xóa item đó khỏi localStorage
3. WHEN xóa item thành công THEN hệ thống SHALL cập nhật giao diện ngay lập tức
4. WHEN xóa item thành công THEN hệ thống SHALL hiển thị thông báo ngắn "Đã xóa"
5. IF chỉ còn một item và bị xóa THEN hệ thống SHALL hiển thị trạng thái trống

### Requirement 6

**User Story:** Là người dùng, tôi muốn giao diện lịch sử dịch thuật tương thích với chế độ tối và các ngôn ngữ giao diện khác nhau, để trải nghiệm nhất quán với phần còn lại của ứng dụng.

#### Acceptance Criteria

1. WHEN chế độ tối được bật THEN panel lịch sử SHALL sử dụng màu sắc phù hợp với dark theme
2. WHEN thay đổi ngôn ngữ giao diện THEN tất cả text trong panel lịch sử SHALL được dịch tương ứng
3. WHEN hiển thị trên mobile THEN panel lịch sử SHALL responsive và dễ sử dụng
4. WHEN hiển thị văn bản tiếng Lào trong lịch sử THEN hệ thống SHALL sử dụng font Phetsarath OT
5. WHEN panel lịch sử mở THEN hệ thống SHALL có animation mượt mà và không làm gián đoạn workflow chính