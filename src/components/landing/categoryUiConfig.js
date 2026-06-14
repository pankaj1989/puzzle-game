/** Visual + copy for known category names (aligned with CategorySelection). */
export const CATEGORY_UI = {
  music: {
    catname: 'Music',
    description: 'Artists, albums & lyrics',
    image: '/music.png',
    bgColor: 'radial-gradient(52.35% 52.35% at 47.26% 47.65%, #2366AD 0%, #12151C 100%)',
    watermarkColor: '#007AFF24',
    watermarkText: 'MUSIC',
  },
  movies: {
    catname: 'Movies & TV',
    description: 'Films, shows & directors',
    image: '/movies.png',
    bgColor: 'radial-gradient(52.35% 52.35% at 47.26% 47.65%, #6B8659 0%, #243731 100%)',
    watermarkColor: '#00FF001A',
  },
  food: {
    catname: 'Food & Drink',
    description: 'Cuisine, flavors & chefs',
    image: '/food.png',
    bgColor: 'radial-gradient(52.35% 52.35% at 47.26% 47.65%, #BF4EB8 0%, #2A263D 100%)',
    watermarkColor: '#F100FF24',
  },
  technology: {
    catname: 'Technology',
    description: 'Gadgets & breakthroughs',
    image: '/technology.png',
    bgColor: 'radial-gradient(49.2% 52.35% at 47.26% 47.65%, #D93470 0%, #612239 100%)',
    watermarkColor: '#a02454',
  },
  animals: {
    catname: 'Animals',
    description: 'Wildlife, pets & species',
    image: '/animal.png',
    bgColor: 'radial-gradient(49.2% 52.35% at 47.26% 47.65%, #065EAC 0%, #0C3257 100%)',
    watermarkColor: '#0085FF24',
  },
  random: {
    catname: 'Random',
    description: 'Surprise mix—puzzles drawn at random from across all categories.',
    image: null,
    bgColor: 'linear-gradient(145deg, #312e81 0%, #5b21b6 40%, #1d4ed8 100%)',
    watermarkColor: '#FFFFFF18',
    watermarkText: 'RANDOM',
    isRandom: true,
  },
};

export function normalizeCategoryName(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-');
}

export function getCategoryUi(apiCat) {
  return CATEGORY_UI[normalizeCategoryName(apiCat?.name)] || {};
}
