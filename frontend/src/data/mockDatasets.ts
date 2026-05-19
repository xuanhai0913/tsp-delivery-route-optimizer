import type { Dataset } from "../types/tsp";

export const mockDatasets: Dataset[] = [
  {
    id: "hcm-city-demo",
    name: "HCM City Demo - 7 điểm",
    description: "Các địa điểm quen thuộc tại trung tâm TP.HCM cho demo lớp học.",
    locations: [
      { id: 0, name: "Kho trung tâm", lat: 10.7769, lng: 106.7009 },
      { id: 1, name: "Đại học Bách Khoa", lat: 10.772, lng: 106.6578 },
      { id: 2, name: "Chợ Bến Thành", lat: 10.772, lng: 106.6983 },
      { id: 3, name: "Landmark 81", lat: 10.794, lng: 106.7218 },
      { id: 4, name: "Sân bay TSN", lat: 10.8188, lng: 106.6519 },
      { id: 5, name: "Bưu điện TP", lat: 10.7798, lng: 106.699 },
      { id: 6, name: "Nhà thờ Đức Bà", lat: 10.7797, lng: 106.6992 },
    ],
    costMatrix: [
      [0, 4.2, 7.8, 12.1, 8.5, 9.3, 6.4],
      [4.2, 0, 3.5, 9.8, 5.2, 6.1, 4.9],
      [7.8, 3.5, 0, 6.7, 7.4, 1.2, 2.8],
      [12.1, 9.8, 6.7, 0, 11.3, 5.9, 7.2],
      [8.5, 5.2, 7.4, 11.3, 0, 8.8, 6.5],
      [9.3, 6.1, 1.2, 5.9, 8.8, 0, 1.5],
      [6.4, 4.9, 2.8, 7.2, 6.5, 1.5, 0],
    ],
  },
  {
    id: "warehouse-demo",
    name: "Warehouse Demo - 5 điểm",
    description: "Bộ dữ liệu nhỏ để kiểm tra route nhanh trước khi thuyết trình.",
    locations: [
      { id: 0, name: "Depot A", lat: 10.786, lng: 106.689 },
      { id: 1, name: "Station B", lat: 10.792, lng: 106.704 },
      { id: 2, name: "Store C", lat: 10.763, lng: 106.682 },
      { id: 3, name: "Hub D", lat: 10.807, lng: 106.672 },
      { id: 4, name: "Locker E", lat: 10.771, lng: 106.719 },
    ],
    costMatrix: [
      [0, 6, 8, 7, 9],
      [6, 0, 5, 4, 6],
      [8, 5, 0, 7, 3],
      [7, 4, 7, 0, 5],
      [9, 6, 3, 5, 0],
    ],
  },
];

export const defaultDataset = mockDatasets[0];
