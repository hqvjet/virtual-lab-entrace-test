# Challenge 1: CTDL & GT
kính gửi GS. Phạm Đình Lâm,

Dưới đây là tổng quan cách mà em giải challenge 1. Trong đó em đóng vai trò xây dựng codebase, thuật toán và các điều kiện ràng buộc 100% không sử dụng AI nào theo tinh thần engineer. Sau đó em mô tả thuật toán và ý tưởng để vibe code bằng AI.

## Ý tưởng
Đây là một bài toán khá phức tạp nếu sử dụng giải thuật quy hoạch động và em cũng chưa chắc trong thời gian cho phép có hoàn thành được challenge này với giải thuật phức tạp như vậy không. Do đó em sẽ sử dụng giải thuật đơn giản hơn đó là vét cạn toàn bộ trạng thái có thể có và sử dụng cắt tỉa cây để giảm số lượng trạng thái. Sau khi đã xây dựng xong cây trạng thái thì em sẽ dùng DFS để tìm path có quãng đường di chuyển ít nhất (hay nói cách khác là số **lượng xăng tiêu thụ** ít nhất)

## Phát biểu bài toán
Gọi Node `N(position, type, f, w)`, trong đó:
- position: là vị trí của node đó.
- type: bao gồm có 4 loại đó là start, order_start, order_end và station.
- f: lượng xăng hiện tại nếu robot di chuyển tới node đó
- w: khối lượng trên robot nếu di chuyển tới node đó

Ở đây em định nghĩa các tập hợp trạng thái chỉ bao gồm các order start và end, không bao gồm station. Vì station có thể ghé thăm lặp lại và điều đó sẽ tạo nên 1 cái cây trạng thái dài vô tận. Do đó tập hợp các trạng thái thuộc `{order_start_0, order_end_0, order_start_1, order_end_1, ...., order_start_n, order_end_n}`

### 1. Điều kiện để có thể cắt nhánh
Ở đây em sẽ có 2 loại điều kiện, đó là điều kiện ràng buộc của xăng và của khối lượng.

Gọi `c = cf - H(a,b) / 20` là số lượng xăng còn lại sau khi di chuyển từ node a -> node b, trong đó:
- cf: current f
- H(a,b) = `|a_x - b_x| + |a_y - b_y|`: là tổng ô di chuyển ngắn nhất từ a đến b

Gọi `H(a,b) = w - (cw + w_b)` là khối lượng còn trống sau khi di chuyển tới node b, trong đó:
- cw: current w
- w_b: khối lượng của đơn hàng tại b
- w: khối lượng cho phép của robot

#### 1.1 Đối với điều kiện về xăng
Hiển nhiên nếu xe chạy từ node a -> node b mà `c <= 0` thì sẽ cắt ở nhánh đó bởi vì hết xăng để di chuyển. Còn nếu `c > 0` thì vẫn còn xăng để di chuyển. Điểm đặc biệt ở đây là chúng ta có thể bơm xăng khi hết xăng nên là nếu từ node a -> node b không khả thi thì ta có thể tạm thời thêm các station vào chuỗi trạng thái của chúng ta để xe có thể có 1 tương lai là nó có thể tới một hoặc nhiều trạm xăng để đổ xăng rồi đi tiếp qua node b *(em tự đánh giá thuật toán này ở dạng greedy và có thể sẽ không thể cover được một số trường hợp khi mà ta cần nạp xăng từ sớm)*.

#### 1.2. Đối với khối lượng chứa hiện tại trên xe
Nếu từ node a -> node b mà `H(a,b) > 0` thì nhánh đó khả thi, ngược lại nếu `H(a,b) <= 0` thì nhánh đó không khả thi và bị cắt.

#### 1.3. Lược bỏ các trạng thái vô nghĩa
Ở bài toán này em nhận thấy rằng việc ghé thăm các order_end_i khi mà cái order_start_i chưa được ghé thăm là 1 chuyện vô nghĩa:
- B1: chỉ add toàn bộ trạng thái `order_start_i`
- B2: khi pickup order_start_i nào thì sẽ thêm order_end_i tương ứng vào thanh trạng thái để tránh có những path vô nghĩa.
- B3: nếu order_end_i nào đã được giao thì xóa luôn cả order_start_i và order_end_i đó bởi vì hàng đã giao rồi nên không có nghĩa vụ quay lại vô nghĩa.

Bằng cách trên em có thể lược bỏ tầm 50% các trạng thái được cho là vô nghĩa.

### 2. Tìm path tối ưu nhất trên cây trạng thái
Bằng điều kiện cắt nhánh và ý tưởng heuristic các trạm xăng ở trên, em có thể xây dựng được một cây trạng thái và thuật toán này **không đảm bảo 100%** kết quả rơi vào global min do có heuristic các trạm xăng nhưng nó cũng đảm bảo một phần về tối ưu phía số lượng ghé trạm xăng, em lựa chọn tradeoff giữa cân bằng 2 yếu tố trong challenge 1.

Sau khi chúng ta có cây trạng thái, ta sẽ tiến hành DFS cây bằng stack để tìm số lượng ô di chuyển ít nhất mà thỏa mãn điểm root và leaf đều là điểm start của robot (trên thanh trạng thái chỉ xuất hiện điểm start khi và chỉ khi toàn bộ đơn hàng đều nhận và giao hết toàn bộ) và lưu path tối ưu đó

### 3. Cách sử dụng code
Ở đây em đã chuẩn bị sẵn [1 video trên youtube](https://www.youtube.com/watch?v=QdtvLQ12ceE) để thầy có thể xem nhanh ạ. Hoặc nếu thầy muốn thầy có thể follow instruction ở dưới của em để chạy thử code ạ.
- `pip install -r requirements.txt`
- `python game_visualizer.py`

*Note: Thầy có thể chỉnh test sample hoặc thêm mới ở trong samples folder ạ*

### Em xin trân trọng gửi lời cảm ơn sâu sắc đến thầy, em kính chúc thầy một ngày vui vẻ và tràn đầy năng lượng !