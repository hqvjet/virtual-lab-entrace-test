# Challenge 3 - Trực quan hóa dữ liệu Covid19 Vietnam
Kính gửi GS. Phạm Đình Lâm,

Challenge này là một challenge về hiểu dữ liệu và biểu diễn, em thực hiện nghiên cứu dữ liệu khá kĩ vì các column biểu diễn rất mơ hồ (như i1, i2, ...). Em đọc hiểu dữ liệu ở [Questionaire sheet](https://github.com/YouGov-Data/covid-19-tracker/blob/master/22%200401%20English%20questionnaire%20full%20v1.0.pdf) và bảng [Codebook sheet](https://github.com/YouGov-Data/covid-19-tracker/blob/master/codebook.xlsx). Theo tổng quan hiểu của em là đây là 1 dữ liệu 360 độ về vấn đề đảm bảo an toàn mùa covid với profile sâu sắc về background của người được khảo sát cũng như sức khỏe tinh thần, tình hình bệnh và cả ý thức phòng tránh bệnh của họ. Sau khi phân tích, em nhận thấy dữ liệu gồm có 12074 records và 330 column thông tin. Tỉ lệ null ở dataset này là cực kì cao, có những column có lượng null lên đến ~ 95% của số lượng record như là các câu hỏi v2, v3, v4, m1, ... m8, .... Vì do vấn đề biểu diễn dạng category cho các option trong question nên ta có thể hiểu chuyện missing value này là hợp lý. Một vấn đề khó khăn trong dữ liệu là có những chỗ lại phân theo category (ví dụ câu hỏi `v2` có 2 options thì ta có 4 feature `v2_1`, `v2_2`), còn những chỗ thì phân theo không phải category (ví dụ ở trong dữ liệu cột `v1`). Điều này gây khó khăn không hề nhẹ cho phân tích vì xung đột tính nhất quán. Bằng chứng của em là trong dữ liệu này, cột `v1` và các cột `v2_i`, đáng lẽ cột `v1` này cũng được chia thành các `v1_i`.

## Tiếp cận vấn đề
Đây là một dataset chứa ~12k records trong vòng 12 tuần trải dài từ ngày 9/4/2020 tới 24/9/2020 (khảo sát không liên tục nên tổng cộng hết được 12 tuần). Do đó em phải xác định câu hỏi liệu có bao nhiêu khía cạnh nên quan tâm của dữ liệu này.

### 1. Các khía cạnh của dữ liệu 
Dựa trên hiểu biết của em sau khi nghiên cứu dữ liệu này, Dữ liệu này chứa đựng 1 lượng thông tin cực kỳ lớn, do đó để phù hợp với thời gian giới hạn của bài test, em xin bo gọn phạm vi dữ liệu lại thành các đại ý sau:
- Sức khỏe tinh thần và phản ứng của chính phủ
- Mức độ tuân thủ và kiến thức phòng ngừa Covid

### 2. Các feature quan trọng đối với mỗi khía cạnh
Ở section này, em sẽ trình bày với mỗi khía cạnh em định nghĩa ở trên, ta cần dùng những feature nào trong 330 features của data gốc để giải quyết hình thái khía cạnh đó.

#### 2.1. Sức khỏe tinh thần và phản ứng của chính phủ
Với khía cạnh này, em tập trung vào 2 vấn đề chính đó là sức khỏe tinh thần của người dân và phản ứng của chính phủ, bởi vì 2 vấn đề này có quan hệ mật thiết với nhau. 
- Đối với sức khỏe tinh thần của người dân, em khai thác `cantril_ladder` (range 0 -> 10) để nắm được tổng quan mức độ hài lòng với cuộc sống hiện tại của người dân. Sau đó để khai thác sâu hơn về tinh thần, em sẽ nắm bắt `PHQ4_1, PHQ4_2, PHQ4_3, PHQ4_4` để biết hiểu sâu hơn về tâm trạng của người dân.  
- Đối với đánh giá về chính phủ của người dân, em khai thác `WCRex1` (đánh giá cách chính phủ xử lý đại dịch), `WCRex2` (Mức độ tin tưởng vào hệ thống y tế VN), `WCV_4` (mức độ sợ bị nhiễm covid).

### 2.2. Mức độ tuân thủ và kiến thức phòng ngừa covid
Ở đây, em trực tiếp khai thác `i12_health_i` với `i` thuộc `[1;20]`, các features này trực tiếp hỏi về các vấn đề hành vi tuân thủ phòng tránh dịch bệnh. Tiếp theo để khai thác mức độ nhận thức về dịch bệnh đối với người dân, em khai thác `r1_1` đến `r1_7`.

### 3. Công nghệ sử dụng
Ở problem này, em vẫn sử dụng mô hình frontend - backend để xử lý
- Frontend:
    - NextJS
    - Shadcn
    - Tailwind
    - Recharts
- Backend:
    - NextJS
    - Polars (Lựa chọn thay thế pandas vì tốc độ đa luồng và filter logic ngay trong query)

Frontend đóng vai trò làm giao diện, nhận dữ liệu và visualize cho người dùng xem, bên cạnh đó nó còn request phía backend với các điều kiện lọc mà người dùng muốn để fetch dữ liệu. Ở mặt khác, backend đóng vai trò người cung cấp dữ liệu, nó sẽ tiếp nhận request cùng các bộ lọc của frontend hỏi rồi sau đó ném ngược lại cho frontend dữ liệu đã qua sàng lọc. Backend cũng là nơi tương tác trực tiếp với dữ liệu `vietnam.csv`.

### 4. Ý tưởng tương lai
Nếu trong hệ thống, việc xây dựng 1 dashboard mà thể hiện được toàn bộ sự tương quan của từng feature hay 1 cụm feature thì mất rất nhiều thời gian và độ khó tăng lên nếu feature quá nhiều. Giả sử có một ông manager ông hỏi rằng việc người dân không tiêm vaccine có phải do họ không tin vào chính phủ hay do họ không sợ covid ? Thế là dev team phải hùng hục ngồi đọc dữ liệu rồi nấu nướng visualize đưa lên cho sếp. Thay vào đó ta sẽ sử dụng agent workflow trong đó LLM đóng vai trò core brain để infer các câu SQL truy vấn vào RDBMS, và RDBMS sẽ chứa dữ liệu vietnam.csv này. Lúc này sếp chỉ cần đặt câu hỏi rõ ràng cho agent và nó sẽ tự làm việc với database kết hợp visualize tool để trả về kết quả cho sếp.

### 5. Cách sử dụng sourcecode
Ở đây em đã chuẩn bị sẵn file `run.sh` này và thầy có thể chạy file này để sử dụng ạ. Bên cạnh đó em còn chuẩn bị [video](https://youtu.be/vaixiaWGBZw) trên Youtube sẵn để thầy có thể xem nhanh ạ.