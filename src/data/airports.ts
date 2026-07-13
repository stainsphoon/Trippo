export interface Airport {
  code: string;
  nameKo: string;
  nameEn: string;
  cityKo: string;
  cityEn: string;
  countryKo: string;
  countryEn: string;
}

export const AIRPORTS: Airport[] = [
  // 1. South Korea (한국)
  {
    code: 'ICN',
    nameKo: '인천국제공항',
    nameEn: 'Incheon International Airport',
    cityKo: '서울/인천',
    cityEn: 'Seoul/Incheon',
    countryKo: '한국',
    countryEn: 'South Korea'
  },
  {
    code: 'GMP',
    nameKo: '김포국제공항',
    nameEn: 'Gimpo International Airport',
    cityKo: '서울',
    cityEn: 'Seoul',
    countryKo: '한국',
    countryEn: 'South Korea'
  },
  {
    code: 'PUS',
    nameKo: '김해국제공항',
    nameEn: 'Gimhae International Airport',
    cityKo: '부산',
    cityEn: 'Busan',
    countryKo: '한국',
    countryEn: 'South Korea'
  },
  {
    code: 'CJU',
    nameKo: '제주국제공항',
    nameEn: 'Jeju International Airport',
    cityKo: '제주',
    cityEn: 'Jeju',
    countryKo: '한국',
    countryEn: 'South Korea'
  },

  // 2. Japan (일본)
  {
    code: 'NRT',
    nameKo: '나리타 국제공항',
    nameEn: 'Narita International Airport',
    cityKo: '도쿄',
    cityEn: 'Tokyo',
    countryKo: '일본',
    countryEn: 'Japan'
  },
  {
    code: 'HND',
    nameKo: '하네다 국제공항',
    nameEn: 'Haneda International Airport',
    cityKo: '도쿄',
    cityEn: 'Tokyo',
    countryKo: '일본',
    countryEn: 'Japan'
  },
  {
    code: 'KIX',
    nameKo: '간사이 국제공항',
    nameEn: 'Kansai International Airport',
    cityKo: '오사카',
    cityEn: 'Osaka',
    countryKo: '일본',
    countryEn: 'Japan'
  },
  {
    code: 'FUK',
    nameKo: '후쿠오카 공항',
    nameEn: 'Fukuoka Airport',
    cityKo: '후쿠오카',
    cityEn: 'Fukuoka',
    countryKo: '일본',
    countryEn: 'Japan'
  },
  {
    code: 'CTS',
    nameKo: '신치토세 공항',
    nameEn: 'New Chitose Airport',
    cityKo: '삿포로/홋카이도',
    cityEn: 'Sapporo/Hokkaido',
    countryKo: '일본',
    countryEn: 'Japan'
  },
  {
    code: 'NGO',
    nameKo: '주부 센트레아 국제공항',
    nameEn: 'Chubu Centrair International Airport',
    cityKo: '나고야',
    cityEn: 'Nagoya',
    countryKo: '일본',
    countryEn: 'Japan'
  },
  {
    code: 'OKA',
    nameKo: '나하 공항',
    nameEn: 'Naha Airport',
    cityKo: '오키나와',
    cityEn: 'Okinawa',
    countryKo: '일본',
    countryEn: 'Japan'
  },

  // 3. France (프랑스)
  {
    code: 'CDG',
    nameKo: '파리 샤를 드 골 공항',
    nameEn: 'Paris Charles de Gaulle Airport',
    cityKo: '파리',
    cityEn: 'Paris',
    countryKo: '프랑스',
    countryEn: 'France'
  },
  {
    code: 'ORY',
    nameKo: '파리 오를리 공항',
    nameEn: 'Paris Orly Airport',
    cityKo: '파리',
    cityEn: 'Paris',
    countryKo: '프랑스',
    countryEn: 'France'
  },
  {
    code: 'NCE',
    nameKo: '니스 코트다쥐르 공항',
    nameEn: 'Nice Côte d\'Azur Airport',
    cityKo: '니스',
    cityEn: 'Nice',
    countryKo: '프랑스',
    countryEn: 'France'
  },

  // 4. United States (미국)
  {
    code: 'LAX',
    nameKo: '로스앤젤레스 국제공항',
    nameEn: 'Los Angeles International Airport',
    cityKo: '로스앤젤레스',
    cityEn: 'Los Angeles',
    countryKo: '미국',
    countryEn: 'United States'
  },
  {
    code: 'JFK',
    nameKo: '존 F. 케네디 국제공항',
    nameEn: 'John F. Kennedy International Airport',
    cityKo: '뉴욕',
    cityEn: 'New York',
    countryKo: '미국',
    countryEn: 'United States'
  },
  {
    code: 'SFO',
    nameKo: '샌프란시스코 국제공항',
    nameEn: 'San Francisco International Airport',
    cityKo: '샌프란시스코',
    cityEn: 'San Francisco',
    countryKo: '미국',
    countryEn: 'United States'
  },
  {
    code: 'HNL',
    nameKo: '호놀룰루 대니얼 K. 이노우에 국제공항',
    nameEn: 'Daniel K. Inouye International Airport',
    cityKo: '호놀룰루/하와이',
    cityEn: 'Honolulu/Hawaii',
    countryKo: '미국',
    countryEn: 'United States'
  },
  {
    code: 'LAS',
    nameKo: '해리 리드 국제공항',
    nameEn: 'Harry Reid International Airport',
    cityKo: '라스베이거스',
    cityEn: 'Las Vegas',
    countryKo: '미국',
    countryEn: 'United States'
  },
  {
    code: 'ORD',
    nameKo: '시카고 오헤어 국제공항',
    nameEn: 'O\'Hare International Airport',
    cityKo: '시카고',
    cityEn: 'Chicago',
    countryKo: '미국',
    countryEn: 'United States'
  },

  // 5. Philippines (필리핀)
  {
    code: 'MNL',
    nameKo: '마닐라 니노이 아키노 국제공항',
    nameEn: 'Ninoy Aquino International Airport',
    cityKo: '마닐라',
    cityEn: 'Manila',
    countryKo: '필리핀',
    countryEn: 'Philippines'
  },
  {
    code: 'CEB',
    nameKo: '막탄 세부 국제공항',
    nameEn: 'Mactan-Cebu International Airport',
    cityKo: '세부',
    cityEn: 'Cebu',
    countryKo: '필리핀',
    countryEn: 'Philippines'
  },
  {
    code: 'MPH',
    nameKo: '까띡끌란 공항 (보라카이)',
    nameEn: 'Caticlan Airport (Boracay)',
    cityKo: '보라카이',
    cityEn: 'Boracay',
    countryKo: '필리핀',
    countryEn: 'Philippines'
  },
  {
    code: 'KLO',
    nameKo: '칼리보 국제공항 (보라카이)',
    nameEn: 'Kalibo International Airport (Boracay)',
    cityKo: '보라카이/칼리보',
    cityEn: 'Boracay/Kalibo',
    countryKo: '필리핀',
    countryEn: 'Philippines'
  },

  // 6. Thailand (태국)
  {
    code: 'BKK',
    nameKo: '방콕 수완나품 국제공항',
    nameEn: 'Suvarnabhumi Airport',
    cityKo: '방콕',
    cityEn: 'Bangkok',
    countryKo: '태국',
    countryEn: 'Thailand'
  },
  {
    code: 'DMK',
    nameKo: '돈므앙 국제공항',
    nameEn: 'Don Mueang International Airport',
    cityKo: '방콕',
    cityEn: 'Bangkok',
    countryKo: '태국',
    countryEn: 'Thailand'
  },
  {
    code: 'HKT',
    nameKo: '푸켓 국제공항',
    nameEn: 'Phuket International Airport',
    cityKo: '푸켓',
    cityEn: 'Phuket',
    countryKo: '태국',
    countryEn: 'Thailand'
  },
  {
    code: 'CNX',
    nameKo: '치앙마이 국제공항',
    nameEn: 'Chiang Mai International Airport',
    cityKo: '치앙마이',
    cityEn: 'Chiang Mai',
    countryKo: '태국',
    countryEn: 'Thailand'
  },

  // 7. Vietnam (베트남)
  {
    code: 'SGN',
    nameKo: '호치민 떤선녓 국제공항',
    nameEn: 'Tan Son Nhat International Airport',
    cityKo: '호치민',
    cityEn: 'Ho Chi Minh City',
    countryKo: '베트남',
    countryEn: 'Vietnam'
  },
  {
    code: 'HAN',
    nameKo: '하노이 노이바이 국제공항',
    nameEn: 'Noi Bai International Airport',
    cityKo: '하노이',
    cityEn: 'Hanoi',
    countryKo: '베트남',
    countryEn: 'Vietnam'
  },
  {
    code: 'DAD',
    nameKo: '다낭 국제공항',
    nameEn: 'Da Nang International Airport',
    cityKo: '다낭',
    cityEn: 'Da Nang',
    countryKo: '베트남',
    countryEn: 'Vietnam'
  },
  {
    code: 'CXR',
    nameKo: '나트랑 깜라인 국제공항',
    nameEn: 'Cam Ranh International Airport',
    cityKo: '나트랑/깜라인',
    cityEn: 'Nha Trang/Cam Ranh',
    countryKo: '베트남',
    countryEn: 'Vietnam'
  },
  {
    code: 'PQC',
    nameKo: '푸꾸옥 국제공항',
    nameEn: 'Phu Quoc International Airport',
    cityKo: '푸꾸옥',
    cityEn: 'Phu Quoc',
    countryKo: '베트남',
    countryEn: 'Vietnam'
  },

  // 8. Italy (이탈리아)
  {
    code: 'FCO',
    nameKo: '로마 피우미치노 공항',
    nameEn: 'Rome Fiumicino Airport',
    cityKo: '로마',
    cityEn: 'Rome',
    countryKo: '이탈리아',
    countryEn: 'Italy'
  },
  {
    code: 'MXP',
    nameKo: '밀라노 말펜사 공항',
    nameEn: 'Milan Malpensa Airport',
    cityKo: '밀라노',
    cityEn: 'Milan',
    countryKo: '이탈리아',
    countryEn: 'Italy'
  },
  {
    code: 'VCE',
    nameKo: '베네치아 마르코 폴로 공항',
    nameEn: 'Venice Marco Polo Airport',
    cityKo: '베네치아',
    cityEn: 'Venice',
    countryKo: '이탈리아',
    countryEn: 'Italy'
  },

  // 9. United Kingdom (영국)
  {
    code: 'LHR',
    nameKo: '런던 히드로 공항',
    nameEn: 'London Heathrow Airport',
    cityKo: '런던',
    cityEn: 'London',
    countryKo: '영국',
    countryEn: 'United Kingdom'
  },
  {
    code: 'LGW',
    nameKo: '런던 개트윅 공항',
    nameEn: 'London Gatwick Airport',
    cityKo: '런던',
    cityEn: 'London',
    countryKo: '영국',
    countryEn: 'United Kingdom'
  },

  // 10. Singapore (싱가포르)
  {
    code: 'SIN',
    nameKo: '싱가포르 창이 국제공항',
    nameEn: 'Singapore Changi Airport',
    cityKo: '싱가포르',
    cityEn: 'Singapore',
    countryKo: '싱가포르',
    countryEn: 'Singapore'
  },

  // 11. Taiwan (대만)
  {
    code: 'TPE',
    nameKo: '타이베이 타오위안 국제공항',
    nameEn: 'Taoyuan International Airport',
    cityKo: '타이베이',
    cityEn: 'Taipei',
    countryKo: '대만',
    countryEn: 'Taiwan'
  },
  {
    code: 'TSA',
    nameKo: '타이베이 송산 공항',
    nameEn: 'Songshan Airport',
    cityKo: '타이베이',
    cityEn: 'Taipei',
    countryKo: '대만',
    countryEn: 'Taiwan'
  },
  {
    code: 'KHH',
    nameKo: '가오슝 국제공항',
    nameEn: 'Kaohsiung International Airport',
    cityKo: '가오슝',
    cityEn: 'Kaohsiung',
    countryKo: '대만',
    countryEn: 'Taiwan'
  },

  // 12. Spain (스페인)
  {
    code: 'MAD',
    nameKo: '마드리드 바라하스 공항',
    nameEn: 'Madrid-Barajas Airport',
    cityKo: '마드리드',
    cityEn: 'Madrid',
    countryKo: '스페인',
    countryEn: 'Spain'
  },
  {
    code: 'BCN',
    nameKo: '바르셀로나 엘프라트 공항',
    nameEn: 'Barcelona-El Prat Airport',
    cityKo: '바르셀로나',
    cityEn: 'Barcelona',
    countryKo: '스페인',
    countryEn: 'Spain'
  },

  // 13. Australia (호주)
  {
    code: 'SYD',
    nameKo: '시드니 공항',
    nameEn: 'Sydney Airport',
    cityKo: '시드니',
    cityEn: 'Sydney',
    countryKo: '호주',
    countryEn: 'Australia'
  },
  {
    code: 'MEL',
    nameKo: '멜버른 공항',
    nameEn: 'Melbourne Airport',
    cityKo: '멜버른',
    cityEn: 'Melbourne',
    countryKo: '호주',
    countryEn: 'Australia'
  },

  // 14. Germany (독일)
  {
    code: 'FRA',
    nameKo: '프랑크푸르트 공항',
    nameEn: 'Frankfurt Airport',
    cityKo: '프랑크푸르트',
    cityEn: 'Frankfurt',
    countryKo: '독일',
    countryEn: 'Germany'
  },
  {
    code: 'MUC',
    nameKo: '뮌헨 공항',
    nameEn: 'Munich Airport',
    cityKo: '뮌헨',
    cityEn: 'Munich',
    countryKo: '독일',
    countryEn: 'Germany'
  },

  // 15. Switzerland (스위스)
  {
    code: 'ZRH',
    nameKo: '취리히 공항',
    nameEn: 'Zurich Airport',
    cityKo: '취리히',
    cityEn: 'Zurich',
    countryKo: '스위스',
    countryEn: 'Switzerland'
  },
  {
    code: 'GVA',
    nameKo: '제네바 공항',
    nameEn: 'Geneva Airport',
    cityKo: '제네바',
    cityEn: 'Geneva',
    countryKo: '스위스',
    countryEn: 'Switzerland'
  },

  // 16. Indonesia (인도네시아)
  {
    code: 'DPS',
    nameKo: '발리 응우라라이 국제공항',
    nameEn: 'Ngurah Rai International Airport',
    cityKo: '발리',
    cityEn: 'Bali',
    countryKo: '인도네시아',
    countryEn: 'Indonesia'
  },
  {
    code: 'CGK',
    nameKo: '자카르타 수카르노 하타 국제공항',
    nameEn: 'Soekarno-Hatta International Airport',
    cityKo: '자카르타',
    cityEn: 'Jakarta',
    countryKo: '인도네시아',
    countryEn: 'Indonesia'
  },

  // 17. Hong Kong (홍콩)
  {
    code: 'HKG',
    nameKo: '홍콩 국제공항',
    nameEn: 'Hong Kong International Airport',
    cityKo: '홍콩',
    cityEn: 'Hong Kong',
    countryKo: '홍콩',
    countryEn: 'Hong Kong'
  },

  // 18. Malaysia (말레이시아)
  {
    code: 'KUL',
    nameKo: '쿠알라룸푸르 국제공항',
    nameEn: 'Kuala Lumpur International Airport',
    cityKo: '쿠알라룸푸르',
    cityEn: 'Kuala Lumpur',
    countryKo: '말레이시아',
    countryEn: 'Malaysia'
  },
  {
    code: 'BKI',
    nameKo: '코타키나발루 국제공항',
    nameEn: 'Kota Kinabalu International Airport',
    cityKo: '코타키나발루',
    cityEn: 'Kota Kinabalu',
    countryKo: '말레이시아',
    countryEn: 'Malaysia'
  },

  // 19. Guam (괌)
  {
    code: 'GUM',
    nameKo: '앤토니오 B. 원 팻 국제공항 (괌)',
    nameEn: 'Antonio B. Won Pat International Airport (Guam)',
    cityKo: '괌',
    cityEn: 'Guam',
    countryKo: '괌',
    countryEn: 'Guam'
  },

  // 20. Saipan (사이판)
  {
    code: 'SPN',
    nameKo: '사이판 국제공항',
    nameEn: 'Saipan International Airport',
    cityKo: '사이판',
    cityEn: 'Saipan',
    countryKo: '사이판',
    countryEn: 'Saipan'
  },

  // 21. Canada (캐나다)
  {
    code: 'YVR',
    nameKo: '밴쿠버 국제공항',
    nameEn: 'Vancouver International Airport',
    cityKo: '밴쿠버',
    cityEn: 'Vancouver',
    countryKo: '캐나다',
    countryEn: 'Canada'
  },
  {
    code: 'YYZ',
    nameKo: '토론토 피어슨 국제공항',
    nameEn: 'Toronto Pearson International Airport',
    cityKo: '토론토',
    cityEn: 'Toronto',
    countryKo: '캐나다',
    countryEn: 'Canada'
  },

  // 22. Austria (오스트리아)
  {
    code: 'VIE',
    nameKo: '빈 국제공항',
    nameEn: 'Vienna International Airport',
    cityKo: '빈',
    cityEn: 'Vienna',
    countryKo: '오스트리아',
    countryEn: 'Austria'
  },

  // 23. Turkey (튀르키예)
  {
    code: 'IST',
    nameKo: '이스탄불 공항',
    nameEn: 'Istanbul Airport',
    cityKo: '이스탄불',
    cityEn: 'Istanbul',
    countryKo: '튀르키예',
    countryEn: 'Turkey'
  }
];

export function filterAirports(query: string, limit: number = 8): Airport[] {
  const cleanQuery = query.trim().toLowerCase();
  if (!cleanQuery) return [];

  return AIRPORTS.filter(airport => {
    return (
      airport.code.toLowerCase().includes(cleanQuery) ||
      airport.nameKo.toLowerCase().includes(cleanQuery) ||
      airport.nameEn.toLowerCase().includes(cleanQuery) ||
      airport.cityKo.toLowerCase().includes(cleanQuery) ||
      airport.cityEn.toLowerCase().includes(cleanQuery) ||
      airport.countryKo.toLowerCase().includes(cleanQuery) ||
      airport.countryEn.toLowerCase().includes(cleanQuery)
    );
  }).slice(0, limit);
}
