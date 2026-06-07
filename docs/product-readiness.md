# Product Readiness

## Trang Thai Hien Tai

RouteLab Group 1 da co the demo nhu mot product mon hoc:

- Frontend production: https://maps.hailamdev.space
- Backend production: https://routelab-backend.onrender.com
- Dataset production: `hcm-7` tu PostgreSQL/Render backend
- Algorithms backend: Dijkstra, A* va Floyd-Warshall tra ve `PathSolveResult`; Bellman-Ford da duoc chot trong scope va can issue rieng de implement
- Visualization: map, graph, road geometry, algorithm replay, state table, priority queue
- Docs: API contract, algorithm notes, test cases, demo script, PDF report va PDF guide

## Nhung Phan Da Hoan Thanh

| Hang muc | Trang thai | Ghi chu |
| --- | --- | --- |
| Scope shortest path | Done | Da chuyen tu de bai cu sang shortest path 4 thuat toan |
| Backend API | Done | `/api/datasets`, `/api/solve/dijkstra`, `/api/solve/a-star`, `/api/solve/floyd-warshall` |
| Backend algorithms | Done | Dijkstra, A* va Floyd-Warshall co tests, trace-friendly result |
| Algorithm extension backlog | Planned | Bellman-Ford can implement endpoints, tests, docs chi tiet |
| PostgreSQL dataset | Done | Co schema, seed, repository va fallback JSON |
| Frontend API integration | Done | Goi Render backend truoc, mock fallback khi API loi/cham |
| Route visualization | Done | Road geometry, map/graph, path highlight |
| Algorithm replay | Done | Current node, relaxed edge, state table, priority queue |
| CI backend | Done | Typecheck/test/build va AI review workflow |
| Deployment | Done | FE tren Vercel, BE tren Render |
| Documentation | Done | README, API, algorithms, test cases, demo script, report PDFs |

## Nhung Phan Con Lai Neu Muon Nang Diem

| Uu tien | Hang muc | Ly do |
| --- | --- | --- |
| High | Chup screenshot production moi dua vao slide | De slide khop voi giao dien hien tai sau migration |
| High | Luyen demo 3-5 phut theo `docs/demo-script.md` | Dam bao khi thuyet trinh noi dung gon va dung scope |
| Medium | Them toggle traffic/blocked road | Lam demo giong maps hon, path thay doi truc quan |
| Medium | Luu lich su solve run vao database | Co bang thuc nghiem runtime/visited nodes cho bao cao |
| Medium | Implement Bellman-Ford | Them thuat toan thu 3, co negative-cycle detection de tang diem ly thuyet |
| Low | Them dataset lon hon 10-20 node | Cho thay A* duyet it node hon Dijkstra ro hon |
| Low | Them anh production vao report PDF | Bao cao sinh dong hon, nhung khong bat buoc neu da co slide |

## Checklist Truoc Khi Nop

1. Mo https://maps.hailamdev.space va xac nhan status `Da tai graph tu backend`.
2. Chay `Dijkstra`, `A*`, roi `Chay ca hai`.
3. Xac nhan path demo mac dinh la `1 -> 2 -> 3 -> 6`, total cost `7.5`.
4. Bat playback va chi ra current node, relaxed edge, priority queue, state table.
5. Mo tab `Bao cao` va `Huong dan` de chung minh UI co phan giai thich.
6. Lay PDF trong `docs/report/` de nop kem source code.
7. Kiem tra GitHub Actions khong do truoc khi gui repo cho thay.

## Luu Y Khi Trinh Bay

- Khong noi la dang phan tich Google Maps that.
- Noi ro day la mo phong shortest path tren graph ban do.
- Dijkstra la baseline dam bao dung voi trong so khong am.
- A* them heuristic `h(n)` de uu tien huong ve dich, thuong duyet it node hon khi heuristic tot.
- Bellman-Ford va Floyd-Warshall la scope bo sung de nhom co du 4 thuat toan so sanh.
- Replay la diem an diem nhat vi the hien qua trinh thuat toan, khong chi ve duong cuoi.
