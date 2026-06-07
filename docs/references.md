# Academic References

Nguồn dưới đây là các paper/journal/technical report gốc hoặc nguồn học thuật
chính thống để đưa vào báo cáo và slide. Nên ưu tiên các nguồn này thay vì blog
hoặc Wikipedia khi giải thích thuật toán.

## Dijkstra

1. E. W. Dijkstra, "A note on two problems in connexion with graphs",
   *Numerische Mathematik*, vol. 1, pp. 269-271, 1959.
   DOI: [10.1007/BF01386390](https://doi.org/10.1007/BF01386390).
   Đây là paper gốc giới thiệu thuật toán tìm đường ngắn nhất của Dijkstra.

## A*

1. P. E. Hart, N. J. Nilsson, and B. Raphael, "A Formal Basis for the
   Heuristic Determination of Minimum Cost Paths",
   *IEEE Transactions on Systems Science and Cybernetics*, vol. 4, no. 2,
   pp. 100-107, 1968.
   DOI: [10.1109/TSSC.1968.300136](https://doi.org/10.1109/TSSC.1968.300136).
   Đây là paper nền tảng cho A* và cách dùng heuristic trong tìm đường chi phí nhỏ nhất.

## Bellman-Ford

1. R. Bellman, "On a routing problem",
   *Quarterly of Applied Mathematics*, vol. 16, no. 1, pp. 87-90, 1958.
   DOI: [10.1090/qam/102435](https://doi.org/10.1090/qam/102435).
   Paper này trình bày bài toán routing và tư duy dynamic programming cho đường đi ngắn nhất.

2. L. R. Ford Jr., *Network Flow Theory*, RAND Corporation Paper P-923, 1956.
   Catalog reference: [Google Books](https://books.google.com/books/about/Network_Flow_Theory.html?id=aO8vNAEACAAJ).
   Đây là technical report sớm về network flow/shortest route, thường được trích cùng Bellman
   trong lịch sử Bellman-Ford.

## Floyd-Warshall

1. R. W. Floyd, "Algorithm 97: Shortest Path",
   *Communications of the ACM*, vol. 5, no. 6, p. 345, 1962.
   DOI: [10.1145/367766.368168](https://doi.org/10.1145/367766.368168).
   Đây là nguồn gốc trực tiếp cho phần Floyd trong Floyd-Warshall.

2. S. Warshall, "A Theorem on Boolean Matrices",
   *Journal of the ACM*, vol. 9, no. 1, pp. 11-12, 1962.
   DOI: [10.1145/321105.321107](https://doi.org/10.1145/321105.321107).
   Paper này là nền tảng cho cách cập nhật ma trận theo node trung gian,
   liên quan trực tiếp tới ý tưởng Floyd-Warshall.

## Cách Trích Trong Báo Cáo

Gợi ý dùng citation ngắn:

- Dijkstra: "Theo Dijkstra (1959), shortest path có thể giải bằng cách mở rộng node có nhãn tạm thời nhỏ nhất."
- A*: "Hart, Nilsson và Raphael (1968) formalize heuristic search với hàm đánh giá chi phí."
- Bellman-Ford: "Bellman (1958) và Ford (1956) là các nguồn nền tảng cho repeated relaxation trong routing."
- Floyd-Warshall: "Floyd (1962) và Warshall (1962) là nguồn gốc cho phương pháp all-pairs shortest path bằng ma trận."
