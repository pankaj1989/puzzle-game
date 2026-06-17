// Helper: most puzzles just want to reveal letters in original order.
// For variety we shuffle the first few indices.
module.exports = {
  categories: [
    { name: 'Movies', image: '/movies.png', isPremium: false },
    { name: 'Music', image: '/music.png', isPremium: false },
    { name: 'Technology', image: '/technology.png', isPremium: false },
    { name: 'Food', image: '/food.png', isPremium: true },
    { name: 'Animals', image: '/animal.png', isPremium: true },
    { name: 'Random', image: null, isPremium: true },
  ],
  puzzles: [
    // movies (free)
    { plate: 'LV2MRO', answer: 'love tomorrow', categoryName: 'Movies', difficulty: 'easy',
      clue: 'A romantic outlook on the next day', isPremium: false },
    { plate: '4GOTN1', answer: 'forgotten one', categoryName: 'Movies', difficulty: 'medium',
      clue: 'A solitary memory lost to time', isPremium: false },
    { plate: 'BTMAN4', answer: 'batman four', categoryName: 'Movies', difficulty: 'easy',
      clue: 'Fourth outing of the caped crusader', isPremium: false },
    { plate: 'STRW4R', answer: 'star wars', categoryName: 'Movies', difficulty: 'easy',
      clue: 'Galactic conflict franchise', isPremium: false },

    // music (free)
    { plate: 'ROCK99', answer: 'rock nine nine', categoryName: 'Music', difficulty: 'easy',
      clue: 'A loud genre and the year it peaked', isPremium: false },
    { plate: 'BLUZ4U', answer: 'blues for you', categoryName: 'Music', difficulty: 'medium',
      clue: 'A sad song dedication', isPremium: false },
    { plate: 'PNKFLD', answer: 'pink floyd', categoryName: 'Music', difficulty: 'medium',
      clue: 'A prismatic progressive band', isPremium: false },
    { plate: 'JZZ4EV', answer: 'jazz forever', categoryName: 'Music', difficulty: 'medium',
      clue: 'Improvisation endures', isPremium: false },

    // technology (free)
    { plate: 'CODR42', answer: 'coder forty two', categoryName: 'Technology', difficulty: 'hard',
      clue: 'A programmer and the answer to everything', isPremium: false },
    { plate: 'AIRULZ', answer: 'ai rules', categoryName: 'Technology', difficulty: 'easy',
      clue: 'Machines triumphant', isPremium: false },
    { plate: 'NET2WK', answer: 'network', categoryName: 'Technology', difficulty: 'easy',
      clue: 'Connected computers', isPremium: false },
    { plate: 'CLD9UP', answer: 'cloud nine', categoryName: 'Technology', difficulty: 'medium',
      clue: 'High spirits in the sky', isPremium: false },

    // food (premium)
    { plate: 'PIZZA1', answer: 'pizza one', categoryName: 'Food', difficulty: 'easy',
      clue: 'Numbered Italian pie', isPremium: true },
    { plate: 'SUSHI4', answer: 'sushi four', categoryName: 'Food', difficulty: 'medium',
      clue: 'Raw fish quartet', isPremium: true },
    { plate: 'TACO2U', answer: 'taco to you', categoryName: 'Food', difficulty: 'medium',
      clue: 'Delivery order', isPremium: true },
    { plate: 'BURGRT', answer: 'burger time', categoryName: 'Food', difficulty: 'easy',
      clue: 'Fast-food hour', isPremium: true },

    // animals (premium)
    { plate: 'LION42', answer: 'lion forty two', categoryName: 'Animals', difficulty: 'hard',
      clue: 'King of beasts plus a famous number', isPremium: true },
    { plate: 'WOLF99', answer: 'wolf nine nine', categoryName: 'Animals', difficulty: 'medium',
      clue: 'Pack leader at the end of the century', isPremium: true },
    { plate: 'TIGR8R', answer: 'tiger eight r', categoryName: 'Animals', difficulty: 'hard',
      clue: 'Striped cat with a number and letter', isPremium: true },

    // random (premium)
    { plate: 'MIXD1T', answer: 'mixed it', categoryName: 'Random', difficulty: 'medium',
      clue: 'Combined them', isPremium: true },
    { plate: 'RND0MZ', answer: 'random z', categoryName: 'Random', difficulty: 'medium',
      clue: 'Unpredictable ending', isPremium: true },
    { plate: 'ODDEND', answer: 'odds and ends', categoryName: 'Random', difficulty: 'hard',
      clue: 'A mixed collection of leftovers', isPremium: true },
  ],
};
