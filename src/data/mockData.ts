import { TravelLog, TravelPlan, Destination } from '../types';

export const INITIAL_LOGS: TravelLog[] = [
  {
    id: 'log-1',
    title: '로맨틱 파리에서의 일주일',
    content: '센 강변을 따라 걷던 저녁 산책과 길거리 카페에서 마신 에스프레소 한 잔. 모든 순간이 영화 같았던 완벽한 가을 여행이었습니다. 매일 밤 에펠탑의 불빛을 보며 잠들 수 있어서 행복했어요.',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAo8E1CUWLqh5h5-RW4LTMTds36iv9SrH3YENHdWfPSNORN_A7R_yJUpRmIGUREKwiVl8t109wGxIkYhYWQgfzdkS5fbsjpwV1P7wqLDD0Ghre_vdVFttq7qcqHJSM3hN2I3QS92bosNC-Ei1LBps8FrOi2Cp4N3agWPKQgkDVi_kcTgj_JSZyClXvxGnvkfzeqZ6W5gCl_QITMOcnXfBs67y-pOdybURI5P4hQQWVzny6F8HK-jgsiEYcQc8yBUgOL0kGw36aMr6_g',
    location: 'Paris',
    date: '2023.10.12'
  },
  {
    id: 'log-2',
    title: '도쿄 골목길 탐방',
    content: '조용한 아침의 시부야 뒷골목, 우연히 발견한 작은 빵집의 멜론빵 맛을 잊을 수 없다. 화려한 네온사인 이면의 소박한 일본을 느낀 여행.',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCfPr6McA7a_VtAfeJrSYg93U6LtIj6szwoP3rf9CBwdRpFvcrFBSroQs-1metghR4G_dYx7YAeV2JFvArJRBE4z7Wz0rF0mSfFS36WYrQtxodwYw1Mn0XMR0ueTIeK82ReHHKadoA3Wrl5PnYOGVX0f8e1gZF_QLDX8FRF6Ba-KxIgyiepnwzDExk-pNggaSdho7UuY3YyMUUnYkIX2AqBGmWidLw2MJBijLwjZa6sZbjecOXUOVAWYabS12AppTibmwkMzYsGAuAo',
    date: '2023.08.05'
  },
  {
    id: 'log-3',
    title: '보라카이의 투명한 바다',
    content: '파도 소리만 들리는 조용한 해변에서의 완벽한 휴식.',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAWGj2W8QQZEcJENttTEWnT6iqUvk2UMneKIDrzr7-ohw7agq9tBG4ZZRGxYpO7w3smi9mpEF0vx563iKLpliig1l19w2a85l_cv_GWTdRUYqjI29fJzkYWBoycogSOGk8k1LKAbUuogwhVrcgazEZoVpZ1JzpSjwS8VwqQQAmjadT3B-T-3OeLQnLRmUrbzIvGbDLvC6UsEJmaD3LtVadjzFPlJMY2GOdm50_OMaOppvlGpxvn9dGs-UWbXclJDqUiMUJQpME2yhri',
    tag: 'Nature',
    date: '2023.05.20'
  }
];

export const INITIAL_PLAN: TravelPlan = {
  id: 'plan-1',
  title: '도쿄 여행 계획',
  startDate: '2024. 10. 15',
  endDate: '2024. 10. 20',
  durationText: '5박 6일',
  days: [
    {
      dayNumber: 1,
      date: '2024. 10. 15',
      dayOfWeek: '화',
      items: [
        {
          id: 'item-1-1',
          title: '나리타 국제공항 도착',
          time: '10:30 AM',
          cost: '¥2,570',
          content: '스카이라이너 티켓 수령 및 탑승 (우에노행)',
          duration: '45분',
          transportation: 'bus', // 실제로 열차지만 이미지 상 bus 처럼 생김/아이콘 대응
          transportationLine: '스카이라이너 특급 열차',
          checklist: [
            { id: 'chk-1-1-1', text: '티켓 바우처 확인', checked: true },
            { id: 'chk-1-1-2', text: '입국 신고서 작성', checked: false }
          ],
          images: [
            'https://lh3.googleusercontent.com/aida-public/AB6AXuDWDhG9fmczTvzS3iU6S-HtXOsixJBGqzktg0aaQ44y0iDBfeg6SKHDBeI_0c1tCx1I4BYdo-LL9d6YBlDmSLzSWrG-DqISbOMf31OhaOWrynXwW97Tu6PkbPle2FQCxWn9B5HI7Wio-OC9EacngjWehBUMk2COI0Qj628lj2dKeGN9GSpUhlJ8SkdOVFBMsV6ZbcvofqW8gXqannIj5g8rneeBmFyHcyXYfX0WvryT1kzqbQHdlukRJA_tXnX4r5afYogwhs5TJD4z'
          ]
        },
        {
          id: 'item-1-2',
          title: '아사쿠사 센소지',
          time: '14:00 PM',
          content: '나카미세도리 길거리 음식 즐기기',
          images: [
            'https://lh3.googleusercontent.com/aida-public/AB6AXuCunSARS6lJPHGy-yiWsqeOKCWeJA3zjBpNbS3MUt3QALmR3C-Fp2Q74qFhk-9xw1OAsQZdFxevsZX9Oltbn3WTocawUgwuIuI-z3c7SCKuPu412pILcKZXFXyi5A5-ky-UCRHP-vThiyZsceEU4CiLsYftHl_8H8TsatPG7n31dcNvol7BfshiVQe25TsF3y1lU3Ar-WQ_3L3IK0rQ6hCo9smb07GnrENXx9KfmKGBu2f2rruns3mGXFPEazSxHggiuK9q_sn3Skox'
          ]
        },
        {
          id: 'item-1-3',
          title: '우에노 공원 산책',
          time: '16:30 PM',
          content: '오후의 평화로운 연못과 미술관 외관 감상'
        }
      ]
    },
    {
      dayNumber: 2,
      date: '2024. 10. 16',
      dayOfWeek: '수',
      items: [
        {
          id: 'item-2-1',
          title: '교토 아라시야마 대나무 숲',
          time: '09:00 AM',
          content: '자연 속의 힐링 산책로',
          images: [
            'https://lh3.googleusercontent.com/aida-public/AB6AXuCRdniA_MUyOdl1J55PTZY6lJFQmjuYU1zh1Vsm6KsQipHL-r47pc6BbZNLzm1sj0arNZRgZucnlWGQNhfOwqng1Jbn_3K07y9UEq8-JBjhPrJRu_1MPbCJyXf3tR5vuYeCUa1CmuL9_-0fliD7epGRU0jJrS9Nb6d4cOFwH_G3S1DNoRDCUFxX7sCnxiOqlp2PAQqZEXVAs5sEf7Uy34LpR3h_sElhkFK6IC1ZIgZMUmmZ-QA78Bx4mnMjZJCzchf4S0eJwb7Oac2T'
          ]
        },
        {
          id: 'item-2-2',
          title: '현지인 추천 소바 맛집',
          time: '12:30 PM',
          content: '미슐랭 가이드에 소개된 정통 소바',
          images: [
            'https://lh3.googleusercontent.com/aida-public/AB6AXuB7AJHLDQFnP_2OA41J1yjxLMI2Dt4zJazLGhlOJ7YXEvuaIhutnEDvVfmjspQCgjEL-RtXAHfp-NiVEZuQsvDQdBrTbgZ-pnaGnoLNPuMITxk_YGIys3WYnIyzSNGMJw0qP73oXPjNA9Ra76F90o0FNKIz7eN8v2SFse2qsCwdUTgiHO52aC5DEwAT87N0uMXDmfjurugVN4HA-IJxCAWOdNvf1snooNP4VDjs7JLe6QZ9kw3dVTLm3VkhiR6R9z3PdQ0UkQuzlUsE'
          ]
        },
        {
          id: 'item-2-3',
          title: '지중 미술관 (Chichu Art Museum)',
          time: '15:00 PM',
          content: '빛과 자연이 어우러진 예술 공간',
          images: [
            'https://lh3.googleusercontent.com/aida-public/AB6AXuDkJ1wR0xEvkbLtHo7MhUjer0dUW--7UbJ93lRR-VU8T3eVvvlrCcqsawTpVl2B49ie_a2xZCxSbU0DL4-vChzDWT0I3yVecF29rpueaPM-w7O4_AetanVj7_yH-YcgKaj8KiCSnrB_mqhCx3PEbi0knFGNjYMTz-W3azmw16Ue_-aHC9qWl-XKzSsbCB8sd6MB5T72vAL_Y0lF37sTeYz8GOyyb6-yXlOGRGi13t7NvTaRTDod34at6zzkytmejywJXRMxZArzqtgF'
          ]
        }
      ]
    },
    {
      dayNumber: 3,
      date: '2024. 10. 17',
      dayOfWeek: '목',
      items: [
        {
          id: 'item-3-1',
          title: '도쿄 디즈니씨',
          time: '08:30 AM',
          cost: '¥10,900',
          content: '하루 종일 테마파크 어트랙션과 야간 퍼레이드 즐기기',
          checklist: [
            { id: 'chk-3-1-1', text: '패스트패스 예약 체크', checked: true },
            { id: 'chk-3-1-2', text: '보조배터리 준비', checked: true }
          ]
        }
      ]
    },
    {
      dayNumber: 4,
      date: '2024. 10. 18',
      dayOfWeek: '금',
      items: [
        {
          id: 'item-4-1',
          title: '시부야 스카이 전망대',
          time: '17:30 PM',
          cost: '¥2,200',
          content: '도쿄 타워와 일몰, 아름다운 도시 야경 한눈에 담기'
        }
      ]
    }
  ]
};

export const RECOMMENDED_DESTINATIONS: Destination[] = [
  {
    id: 'dest-1',
    name: '파리, 프랑스',
    country: '프랑스',
    description: '낭만의 도시',
    rating: 4.8,
    temperature: '22°C',
    weatherType: 'sunny',
    priceText: '₩850,000~',
    recommendationLevel: '매우 높음',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBoPD3oLekMRvHTLxaiBwjovHVxZqTvIXNI9Aj9CgolyQP-T6zy4Aep0Xk2eqRSyWawYefxLSdm9ee5vRuPt4nOH4NzcROhqLe0DloK0EMOZsgE8rBc-ZbMs2Jtdm72bs7gorgOT6EmSlrP_6pyYdTOTUgHz_J-CrA1R0pge4RKSt_mE4FfvQIXdVicIKMBQqt5D64cOnO42cd-biRrBevM79s0c1FzwXPxmGsq8kHB4JYnx9rYGUqXw1l4Z9OzhvBlg4RSJMJQYGKQ',
    tags: ['Nature', 'Urban', 'Relaxation']
  },
  {
    id: 'dest-2',
    name: '도쿄, 일본',
    country: '일본',
    description: '전통과 현대의 조화',
    rating: 4.5,
    temperature: '18°C',
    weatherType: 'cloudy',
    priceText: '₩320,000~',
    recommendationLevel: '높음',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBPvjAPDIu2JDAr2mxhHHXSLkOb32qmx-kkj0jJufcj5gPfLjO30N66XFh_kw5amPuJhsmDOGN9DC_32CUHqxbSGpZdDuPHJkCOQKbz1bPA_rgYH5ac9ziQk6QI352oaJy0EqTSHjtsASzdU04E2ft852_BDnUaw0aeLIt8CTDTit9LIVocV7vv6sS18FShtiYPKpL0pZesnGlJ8h6lTreq3zn_kCP-DtS5p8lZJ1_c1dzjHrdkasQUDgj_mmUx4mcCiKsYIUbVhBx2',
    tags: ['Urban', 'Adventure']
  },
  {
    id: 'dest-3',
    name: '보라카이, 필리핀',
    country: '필리핀',
    description: '에메랄드빛 천국',
    rating: 4.9,
    temperature: '31°C',
    weatherType: 'sunny',
    priceText: '₩480,000~',
    recommendationLevel: '매우 높음',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAWGj2W8QQZEcJENttTEWnT6iqUvk2UMneKIDrzr7-ohw7agq9tBG4ZZRGxYpO7w3smi9mpEF0vx563iKLpliig1l19w2a85l_cv_GWTdRUYqjI29fJzkYWBoycogSOGk8k1LKAbUuogwhVrcgazEZoVpZ1JzpSjwS8VwqQQAmjadT3B-T-3OeLQnLRmUrbzIvGbDLvC6UsEJmaD3LtVadjzFPlJMY2GOdm50_OMaOppvlGpxvn9dGs-UWbXclJDqUiMUJQpME2yhri',
    tags: ['Nature', 'Relaxation']
  }
];
