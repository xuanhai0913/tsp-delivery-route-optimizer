// hàm phụ giúp chuyển từ độ sang radian
const toRadians = (degrees: number): number => {
  return degrees * (Math.PI / 180);
};

// Hàm tính khoảng cách chiêm bay giữa 2 tọa độ

export const haversineDistance = (
  lat1: number, // vĩ độ của điểm 1
  lon1: number, // kinh độ của điểm 1
  lat2: number, // vĩ độ của điểm 2
  lon2: number, // kinh độ của điểm 2
): number => {
  const R = 6371; // Bán kính Trái Đất tính bằng km
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Trả về khoảng cách tính bằng km
};
