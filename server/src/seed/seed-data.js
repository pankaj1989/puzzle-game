// Helper: most puzzles just want to reveal letters in original order.
// For variety we shuffle the first few indices.
module.exports = {
  categories: [
    { slug: 'movies', name: 'Movies', icon: '/movies.png', isPremium: false },
    { slug: 'music', name: 'Music', icon: '/music.png', isPremium: false },
    { slug: 'technology', name: 'Technology', icon: '/technology.png', isPremium: false },
    { slug: 'food', name: 'Food', icon: '/food.png', isPremium: true },
    { slug: 'animals', name: 'Animals', icon: '/animal.png', isPremium: true },
    { slug: 'random', name: 'Random', icon: '/random.png', isPremium: true },
  ],
  puzzles: [
    // movies (free) - "love tomorrow" = 13 chars (indices 0-12)
    { plate: 'LV2MRO', answer: 'love tomorrow', categorySlug: 'movies', difficulty: 'easy',
      clue: 'A romantic outlook on the next day',
      revealSequence: [0, 2, 4, 5, 8, 1, 3, 6, 7, 9, 10, 11, 12], isPremium: false },
    // "forgotten one" = 13 chars (0-12)
    { plate: '4GOTN1', answer: 'forgotten one', categorySlug: 'movies', difficulty: 'medium',
      clue: 'A solitary memory lost to time',
      revealSequence: [0, 3, 6, 9, 1, 2, 4, 5, 7, 8, 10, 11, 12], isPremium: false },
    // "batman four" = 11 chars (0-10)
    { plate: 'BTMAN4', answer: 'batman four', categorySlug: 'movies', difficulty: 'easy',
      clue: 'Fourth outing of the caped crusader',
      revealSequence: [0, 2, 4, 6, 8, 1, 3, 5, 7, 9, 10], isPremium: false },
    // "star wars" = 9 chars (0-8)
    { plate: 'STRW4R', answer: 'star wars', categorySlug: 'movies', difficulty: 'easy',
      clue: 'Galactic conflict franchise',
      revealSequence: [0, 4, 5, 8, 1, 2, 3, 6, 7], isPremium: false },

    // music (free) - "rock nine nine" = 14 chars (0-13)
    { plate: 'ROCK99', answer: 'rock nine nine', categorySlug: 'music', difficulty: 'easy',
      clue: 'A loud genre and the year it peaked',
      revealSequence: [0, 4, 5, 9, 10, 1, 2, 3, 6, 7, 8, 11, 12, 13], isPremium: false },
    // "blues for you" = 13 chars (0-12)
    { plate: 'BLUZ4U', answer: 'blues for you', categorySlug: 'music', difficulty: 'medium',
      clue: 'A sad song dedication',
      revealSequence: [0, 2, 5, 6, 9, 10, 1, 3, 4, 7, 8, 11, 12], isPremium: false },
    // "pink floyd" = 10 chars (0-9)
    { plate: 'PNKFLD', answer: 'pink floyd', categorySlug: 'music', difficulty: 'medium',
      clue: 'A prismatic progressive band',
      revealSequence: [0, 4, 5, 9, 1, 2, 3, 6, 7, 8], isPremium: false },
    // "jazz forever" = 12 chars (0-11)
    { plate: 'JZZ4EV', answer: 'jazz forever', categorySlug: 'music', difficulty: 'medium',
      clue: 'Improvisation endures',
      revealSequence: [0, 4, 7, 11, 1, 2, 3, 5, 6, 8, 9, 10], isPremium: false },

    // technology (free) - "coder forty two" = 15 chars (0-14)
    { plate: 'CODR42', answer: 'coder forty two', categorySlug: 'technology', difficulty: 'hard',
      clue: 'A programmer and the answer to everything',
      revealSequence: [0, 5, 9, 13, 1, 2, 3, 4, 6, 7, 8, 10, 11, 12, 14], isPremium: false },
    // "ai rules" = 8 chars (0-7)
    { plate: 'AIRULZ', answer: 'ai rules', categorySlug: 'technology', difficulty: 'easy',
      clue: 'Machines triumphant',
      revealSequence: [0, 2, 3, 7, 1, 4, 5, 6], isPremium: false },
    // "network" = 7 chars (0-6)
    { plate: 'NET2WK', answer: 'network', categorySlug: 'technology', difficulty: 'easy',
      clue: 'Connected computers',
      revealSequence: [0, 3, 6, 1, 2, 4, 5], isPremium: false },

    // food (premium) - "pizza one" = 9 chars (0-8)
    { plate: 'PIZZA1', answer: 'pizza one', categorySlug: 'food', difficulty: 'easy',
      clue: 'Numbered Italian pie',
      revealSequence: [0, 5, 6, 8, 1, 2, 3, 4, 7], isPremium: true },
    // "sushi four" = 10 chars (0-9)
    { plate: 'SUSHI4', answer: 'sushi four', categorySlug: 'food', difficulty: 'medium',
      clue: 'Raw fish quartet',
      revealSequence: [0, 5, 6, 9, 1, 2, 3, 4, 7, 8], isPremium: true },
    // "taco to you" = 11 chars (0-10)
    { plate: 'TACO2U', answer: 'taco to you', categorySlug: 'food', difficulty: 'medium',
      clue: 'Delivery order',
      revealSequence: [0, 4, 5, 7, 8, 1, 2, 3, 6, 9, 10], isPremium: true },

    // animals (premium) - "lion forty two" = 14 chars (0-13)
    { plate: 'LION42', answer: 'lion forty two', categorySlug: 'animals', difficulty: 'hard',
      clue: 'King of beasts plus a famous number',
      revealSequence: [0, 4, 5, 10, 13, 1, 2, 3, 6, 7, 8, 9, 11, 12], isPremium: true },
    // "wolf nine nine" = 14 chars (0-13)
    { plate: 'WOLF99', answer: 'wolf nine nine', categorySlug: 'animals', difficulty: 'medium',
      clue: 'Pack leader at the end of the century',
      revealSequence: [0, 4, 5, 9, 10, 1, 2, 3, 6, 7, 8, 11, 12, 13], isPremium: true },
    // "tiger eight r" = 13 chars (0-12)
    { plate: 'TIGR8R', answer: 'tiger eight r', categorySlug: 'animals', difficulty: 'hard',
      clue: 'Striped cat with a number and letter',
      revealSequence: [0, 5, 6, 10, 11, 1, 2, 3, 4, 7, 8, 9, 12], isPremium: true },

    // random (premium) - "mixed it" = 8 chars (0-7)
    { plate: 'MIXD1T', answer: 'mixed it', categorySlug: 'random', difficulty: 'medium',
      clue: 'Combined them',
      revealSequence: [0, 5, 6, 7, 1, 2, 3, 4], isPremium: true },
    // "random z" = 8 chars (0-7)
    { plate: 'RND0MZ', answer: 'random z', categorySlug: 'random', difficulty: 'medium',
      clue: 'Unpredictable ending',
      revealSequence: [0, 6, 7, 1, 2, 3, 4, 5], isPremium: true },
  ],
};
