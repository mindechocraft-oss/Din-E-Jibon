export interface DistrictInfo {
  id: string;
  nameEn: string;
  nameBn: string;
  divisionBn: string;
  lat: number;
  lng: number;
}

export const BANGLADESH_DISTRICTS: DistrictInfo[] = [
  // ঢাকা বিভাগ
  { id: 'Dhaka', nameEn: 'Dhaka', nameBn: 'ঢাকা', divisionBn: 'ঢাকা বিভাগ', lat: 23.8103, lng: 90.4125 },
  { id: 'Gazipur', nameEn: 'Gazipur', nameBn: 'গাজীপুর', divisionBn: 'ঢাকা বিভাগ', lat: 24.0023, lng: 90.4264 },
  { id: 'Narayanganj', nameEn: 'Narayanganj', nameBn: 'নারায়ণগঞ্জ', divisionBn: 'ঢাকা বিভাগ', lat: 23.6238, lng: 90.5000 },
  { id: 'Narsingdi', nameEn: 'Narsingdi', nameBn: 'নরসিংদী', divisionBn: 'ঢাকা বিভাগ', lat: 23.9229, lng: 90.7177 },
  { id: 'Tangail', nameEn: 'Tangail', nameBn: 'টাঙ্গাইল', divisionBn: 'ঢাকা বিভাগ', lat: 24.2513, lng: 89.9167 },
  { id: 'Manikganj', nameEn: 'Manikganj', nameBn: 'মানিকগঞ্জ', divisionBn: 'ঢাকা বিভাগ', lat: 23.8617, lng: 90.0003 },
  { id: 'Munshiganj', nameEn: 'Munshiganj', nameBn: 'মুন্সীগঞ্জ', divisionBn: 'ঢাকা বিভাগ', lat: 23.5422, lng: 90.5305 },
  { id: 'Kishoreganj', nameEn: 'Kishoreganj', nameBn: 'কিশোরগঞ্জ', divisionBn: 'ঢাকা বিভাগ', lat: 24.4449, lng: 90.7766 },
  { id: 'Faridpur', nameEn: 'Faridpur', nameBn: 'ফরিদপুর', divisionBn: 'ঢাকা বিভাগ', lat: 23.6071, lng: 89.8429 },
  { id: 'Madaripur', nameEn: 'Madaripur', nameBn: 'মাদারীপুর', divisionBn: 'ঢাকা বিভাগ', lat: 23.1641, lng: 90.1897 },
  { id: 'Gopalganj', nameEn: 'Gopalganj', nameBn: 'গোপালগঞ্জ', divisionBn: 'ঢাকা বিভাগ', lat: 23.0051, lng: 89.8266 },
  { id: 'Rajbari', nameEn: 'Rajbari', nameBn: 'রাজবাড়ী', divisionBn: 'ঢাকা বিভাগ', lat: 23.7574, lng: 89.6445 },
  { id: 'Shariatpur', nameEn: 'Shariatpur', nameBn: 'শরীয়তপুর', divisionBn: 'ঢাকা বিভাগ', lat: 23.2423, lng: 90.4348 },

  // চট্টগ্রাম বিভাগ
  { id: 'Chattogram', nameEn: 'Chattogram', nameBn: 'চট্টগ্রাম', divisionBn: 'চট্টগ্রাম বিভাগ', lat: 22.3569, lng: 91.7832 },
  { id: 'CoxsBazar', nameEn: "Cox's Bazar", nameBn: 'কক্সবাজার', divisionBn: 'চট্টগ্রাম বিভাগ', lat: 21.4272, lng: 92.0058 },
  { id: 'Cumilla', nameEn: 'Cumilla', nameBn: 'কুমিল্লা', divisionBn: 'চট্টগ্রাম বিভাগ', lat: 23.4607, lng: 91.1809 },
  { id: 'Brahmanbaria', nameEn: 'Brahmanbaria', nameBn: 'ব্রাহ্মণবাড়িয়া', divisionBn: 'চট্টগ্রাম বিভাগ', lat: 23.9571, lng: 91.1119 },
  { id: 'Chandpur', nameEn: 'Chandpur', nameBn: 'চাঁদপুর', divisionBn: 'চট্টগ্রাম বিভাগ', lat: 23.2333, lng: 90.6713 },
  { id: 'Noakhali', nameEn: 'Noakhali', nameBn: 'নোয়াখালী', divisionBn: 'চট্টগ্রাম বিভাগ', lat: 22.8696, lng: 91.0994 },
  { id: 'Feni', nameEn: 'Feni', nameBn: 'ফেনী', divisionBn: 'চট্টগ্রাম বিভাগ', lat: 23.0159, lng: 91.3976 },
  { id: 'Lakshmipur', nameEn: 'Lakshmipur', nameBn: 'লক্ষ্মীপুর', divisionBn: 'চট্টগ্রাম বিভাগ', lat: 22.9425, lng: 90.8412 },
  { id: 'Rangamati', nameEn: 'Rangamati', nameBn: 'রাঙ্গামাটি', divisionBn: 'চট্টগ্রাম বিভাগ', lat: 22.7324, lng: 92.2985 },
  { id: 'Khagrachari', nameEn: 'Khagrachari', nameBn: 'খাগড়াছড়ি', divisionBn: 'চট্টগ্রাম বিভাগ', lat: 23.1193, lng: 91.9847 },
  { id: 'Bandarban', nameEn: 'Bandarban', nameBn: 'বান্দরবান', divisionBn: 'চট্টগ্রাম বিভাগ', lat: 22.1953, lng: 92.2184 },

  // সিলেট বিভাগ
  { id: 'Sylhet', nameEn: 'Sylhet', nameBn: 'সিলেট', divisionBn: 'সিলেট বিভাগ', lat: 24.8949, lng: 91.8687 },
  { id: 'Moulvibazar', nameEn: 'Moulvibazar', nameBn: 'মৌলভীবাজার', divisionBn: 'সিলেট বিভাগ', lat: 24.4829, lng: 91.7774 },
  { id: 'Habiganj', nameEn: 'Habiganj', nameBn: 'হবিগঞ্জ', divisionBn: 'সিলেট বিভাগ', lat: 24.3749, lng: 91.4155 },
  { id: 'Sunamganj', nameEn: 'Sunamganj', nameBn: 'সুনামগঞ্জ', divisionBn: 'সিলেট বিভাগ', lat: 25.0658, lng: 91.3950 },

  // রাজশাহী বিভাগ
  { id: 'Rajshahi', nameEn: 'Rajshahi', nameBn: 'রাজশাহী', divisionBn: 'রাজশাহী বিভাগ', lat: 24.3745, lng: 88.6042 },
  { id: 'Bogura', nameEn: 'Bogura', nameBn: 'বগুড়া', divisionBn: 'রাজশাহী বিভাগ', lat: 24.8481, lng: 89.3730 },
  { id: 'Pabna', nameEn: 'Pabna', nameBn: 'পাবনা', divisionBn: 'রাজশাহী বিভাগ', lat: 24.0064, lng: 89.2372 },
  { id: 'Sirajganj', nameEn: 'Sirajganj', nameBn: 'সিরাজগঞ্জ', divisionBn: 'রাজশাহী বিভাগ', lat: 24.4534, lng: 89.7007 },
  { id: 'Natore', nameEn: 'Natore', nameBn: 'নাটোর', divisionBn: 'রাজশাহী বিভাগ', lat: 24.4206, lng: 89.0003 },
  { id: 'Naogaon', nameEn: 'Naogaon', nameBn: 'নওগাঁ', divisionBn: 'রাজশাহী বিভাগ', lat: 24.7936, lng: 88.9318 },
  { id: 'Chapainawabganj', nameEn: 'Chapainawabganj', nameBn: 'চাঁপাইনবাবগঞ্জ', divisionBn: 'রাজশাহী বিভাগ', lat: 24.5965, lng: 88.2775 },
  { id: 'Joypurhat', nameEn: 'Joypurhat', nameBn: 'জয়পুরহাট', divisionBn: 'রাজশাহী বিভাগ', lat: 25.0968, lng: 89.0227 },

  // খুলনা বিভাগ
  { id: 'Khulna', nameEn: 'Khulna', nameBn: 'খুলনা', divisionBn: 'খুলনা বিভাগ', lat: 22.8456, lng: 89.5403 },
  { id: 'Jashore', nameEn: 'Jashore', nameBn: 'যশোর', divisionBn: 'খুলনা বিভাগ', lat: 23.1664, lng: 89.2081 },
  { id: 'Satkhira', nameEn: 'Satkhira', nameBn: 'সাতক্ষীরা', divisionBn: 'খুলনা বিভাগ', lat: 22.7185, lng: 89.0705 },
  { id: 'Bagerhat', nameEn: 'Bagerhat', nameBn: 'বাগেরহাট', divisionBn: 'খুলনা বিভাগ', lat: 22.6516, lng: 89.7859 },
  { id: 'Kushtia', nameEn: 'Kushtia', nameBn: 'কুষ্টিয়া', divisionBn: 'খুলনা বিভাগ', lat: 23.9013, lng: 89.1205 },
  { id: 'Jhenaidah', nameEn: 'Jhenaidah', nameBn: 'ঝিনাইদহ', divisionBn: 'খুলনা বিভাগ', lat: 23.5448, lng: 89.1539 },
  { id: 'Chuadanga', nameEn: 'Chuadanga', nameBn: 'চুয়াডাঙ্গা', divisionBn: 'খুলনা বিভাগ', lat: 23.6402, lng: 88.8418 },
  { id: 'Meherpur', nameEn: 'Meherpur', nameBn: 'মেহেরপুর', divisionBn: 'খুলনা বিভাগ', lat: 23.7622, lng: 88.6318 },
  { id: 'Magura', nameEn: 'Magura', nameBn: 'মাগুরা', divisionBn: 'খুলনা বিভাগ', lat: 23.4873, lng: 89.4199 },
  { id: 'Narail', nameEn: 'Narail', nameBn: 'নড়াইল', divisionBn: 'খুলনা বিভাগ', lat: 23.1725, lng: 89.5127 },

  // বরিশাল বিভাগ
  { id: 'Barishal', nameEn: 'Barishal', nameBn: 'বরিশাল', divisionBn: 'বরিশাল বিভাগ', lat: 22.7010, lng: 90.3535 },
  { id: 'Bhola', nameEn: 'Bhola', nameBn: 'ভোলা', divisionBn: 'বরিশাল বিভাগ', lat: 22.6859, lng: 90.6482 },
  { id: 'Patuakhali', nameEn: 'Patuakhali', nameBn: 'পটুয়াখালী', divisionBn: 'বরিশাল বিভাগ', lat: 22.3596, lng: 90.3299 },
  { id: 'Pirojpur', nameEn: 'Pirojpur', nameBn: 'পিরোজপুর', divisionBn: 'বরিশাল বিভাগ', lat: 22.5841, lng: 89.9720 },
  { id: 'Jhalokati', nameEn: 'Jhalokati', nameBn: 'ঝালকাঠি', divisionBn: 'বরিশাল বিভাগ', lat: 22.6406, lng: 90.1987 },
  { id: 'Barguna', nameEn: 'Barguna', nameBn: 'বরগুনা', divisionBn: 'বরিশাল বিভাগ', lat: 22.1592, lng: 90.1255 },

  // রংপুর বিভাগ
  { id: 'Rangpur', nameEn: 'Rangpur', nameBn: 'রংপুর', divisionBn: 'রংপুর বিভাগ', lat: 25.7439, lng: 89.2752 },
  { id: 'Dinajpur', nameEn: 'Dinajpur', nameBn: 'দিনাজপুর', divisionBn: 'রংপুর বিভাগ', lat: 25.6217, lng: 88.6355 },
  { id: 'Thakurgaon', nameEn: 'Thakurgaon', nameBn: 'ঠাকুরগাঁও', divisionBn: 'রংপুর বিভাগ', lat: 26.0337, lng: 88.4617 },
  { id: 'Panchagarh', nameEn: 'Panchagarh', nameBn: 'পঞ্চগড়', divisionBn: 'রংপুর বিভাগ', lat: 26.3411, lng: 88.5542 },
  { id: 'Nilphamari', nameEn: 'Nilphamari', nameBn: 'নীলফামারী', divisionBn: 'রংপুর বিভাগ', lat: 25.9318, lng: 88.8560 },
  { id: 'Lalmonirhat', nameEn: 'Lalmonirhat', nameBn: 'লালমনিরহাট', divisionBn: 'রংপুর বিভাগ', lat: 25.9923, lng: 89.2847 },
  { id: 'Kurigram', nameEn: 'Kurigram', nameBn: 'কুড়িগ্রাম', divisionBn: 'রংপুর বিভাগ', lat: 25.8054, lng: 89.6362 },
  { id: 'Gaibandha', nameEn: 'Gaibandha', nameBn: 'গাইবান্ধা', divisionBn: 'রংপুর বিভাগ', lat: 25.3288, lng: 89.5281 },

  // ময়মনসিংহ বিভাগ
  { id: 'Mymensingh', nameEn: 'Mymensingh', nameBn: 'ময়মনসিংহ', divisionBn: 'ময়মনসিংহ বিভাগ', lat: 24.7471, lng: 90.4203 },
  { id: 'Jamalpur', nameEn: 'Jamalpur', nameBn: 'জামালপুর', divisionBn: 'ময়মনসিংহ বিভাগ', lat: 24.9375, lng: 89.9378 },
  { id: 'Sherpur', nameEn: 'Sherpur', nameBn: 'শেরপুর', divisionBn: 'ময়মনসিংহ বিভাগ', lat: 25.0205, lng: 90.0153 },
  { id: 'Netrokona', nameEn: 'Netrokona', nameBn: 'নেত্রকোণা', divisionBn: 'ময়মনসিংহ বিভাগ', lat: 24.8709, lng: 90.7279 },
];

export function getDistrictById(id: string): DistrictInfo {
  return BANGLADESH_DISTRICTS.find((d) => d.id === id) || BANGLADESH_DISTRICTS[0];
}

const KAABA_LAT = 21.422487;
const KAABA_LNG = 39.826206;

export function calculateQiblaBearing(lat: number, lng: number): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const toDeg = (rad: number) => (rad * 180) / Math.PI;
  const phi1 = toRad(lat);
  const phi2 = toRad(KAABA_LAT);
  const dLambda = toRad(KAABA_LNG - lng);

  const y = Math.sin(dLambda) * Math.cos(phi2);
  const x =
    Math.cos(phi1) * Math.sin(phi2) -
    Math.sin(phi1) * Math.cos(phi2) * Math.cos(dLambda);
  const bearing = (toDeg(Math.atan2(y, x)) + 360) % 360;
  return Math.round(bearing * 10) / 10;
}

export function calculateDistanceToMakkahKm(lat: number, lng: number): number {
  const R = 6371;
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(KAABA_LAT - lat);
  const dLng = toRad(KAABA_LNG - lng);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat)) * Math.cos(toRad(KAABA_LAT)) * Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}
