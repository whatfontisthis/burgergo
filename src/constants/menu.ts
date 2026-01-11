// Menu items data
export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
}

// Helper function to get image path with base URL
const getImagePath = (path: string) => {
  // Vite's import.meta.env.BASE_URL includes trailing slash
  return `${import.meta.env.BASE_URL}${path.startsWith('/') ? path.slice(1) : path}`;
};

export const POPULAR_MENU_ITEMS: MenuItem[] = [
  {
    id: 'burger',
    name: '버거고 버거',
    description: '100%소고기 수제 패티+촉촉한 참깨빵+아메리칸 치즈+구운양파+수제소스',
    price: 6500,
    image: getImagePath('/images/burgergo-burger-6500won.jpg')
  },
  {
    id: 'double',
    name: '버거고 더블',
    description: '100%소고기 수제 패티x2+촉촉한 참깨빵+아메리칸 치즈x2+구운양파x2+수제소스',
    price: 9000,
    image: getImagePath('/images/burgergo-double-9000won.jpg')
  },
  {
    id: 'deluxe',
    name: '버거고 디럭스',
    description: '100%소고기 수제 패티+로메인+토마토+촉촉한 참깨빵+아메리칸 치즈+구운양파+수제소스',
    price: 7700,
    image: getImagePath('/images/burgergo-deluxe-7700won.jpg')
  },
  {
    id: 'squid',
    name: '버거고 스퀴드',
    description: '100%소고기 수제 패티+오징어패티+촉촉한 참깨빵+아메리칸 치즈+구운양파+수제소스',
    price: 7700,
    image: getImagePath('/images/burgergo-squid-7700won.jpg')
  },
  {
    id: 'shrimp',
    name: '버거고 통새우',
    description: '통새우 패티 + 촉촉한 참깨빵 + 로메인 + 토마토 + 수제소스',
    price: 7500,
    image: getImagePath('/images/burgergo-whole-shrimp-7500won.jpg')
  }
];

export const STORE_INFO = {
  name: 'BURGERGO',
  address: '공릉동 585-10',
  fullAddress: '서울시 노원구 공릉동 585-10',
  phone: '070-4680-1668',
  locationDetails: '공릉역 2번 출구, 태릉입구역 4번 출구에서 9분 거리',
  hours: {
    tueSat: '11:00-21:00',
    sun: '13:00-20:00',
    mon: 'Closed',
    lastOrder: {
      tueSat: '20:45',
      sun: '19:45'
    }
  },
  social: {
    naverMap: 'https://naver.me/Fcm9MHbj',
    instagram: 'https://www.instagram.com/burger__go/'
  }
};
