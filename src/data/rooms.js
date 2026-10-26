const photo = (id) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=1200&q=82`;

export const rooms = [
  {
    id: 1,
    name: 'Deluxe Room',
    type: 'Deluxe',
    price: 3999,
    size: 28,
    guests: 2,
    rating: 4.7,
    bed: '1 Plush King Bed',
    description: 'A calm, beautifully appointed retreat for a restful city stay.',
    longDescription:
      'A calm, beautifully appointed retreat designed for unhurried comfort and restful nights in the heart of Ahmedabad. The Deluxe Room features bespoke warm-oak furnishings, hand-tufted wool carpets, and floor-to-ceiling soundproof windows framing gentle city panoramas. Sink into our signature king-size mattress layered with 400-thread-count Egyptian cotton linens, or recharge in the Italian marble en-suite bathroom equipped with an indulgent rainfall shower and botanical bath amenities.',
    image: photo('photo-1611892440504-42a792e24d32'),
    gallery: [
      photo('photo-1611892440504-42a792e24d32'),
      photo('photo-1582719478250-c89cae4dc85b'),
      photo('photo-1584622650111-993a426fbf0a'),
      photo('photo-1590490360182-c33d57733427')
    ],
    amenities: [
      'King-size luxury mattress',
      'En-suite Italian marble bathroom',
      'Rainfall shower & organic toiletries',
      '55" 4K Smart TV with OTT streaming',
      'High-speed Wi-Fi 6',
      'Nespresso coffee maker & tea bar',
      'Electronic digital in-room safe',
      'Plush cotton bathrobes & slippers',
      'Complimentary gourmet breakfast',
      'Soundproof panoramic windows'
    ]
  },
  {
    id: 2,
    name: 'Executive Room',
    type: 'Deluxe',
    price: 4999,
    size: 34,
    guests: 2,
    rating: 4.8,
    bed: '1 California King Bed',
    description: 'Extra room to unwind, with thoughtful details and a work nook.',
    longDescription:
      'Tailored for both discerning business travellers and leisure guests seeking extra breathing space, the Executive Room seamlessly blends productivity with refined relaxation. A spacious solid wood workstation and ergonomic Herman Miller chair offer a peaceful setting for work, while the sunlit lounge corner invites you to unwind with an artisanal espresso. Enjoy bespoke hospitality, evening turn-down service, and effortless city connectivity.',
    image: photo('photo-1590490360182-c33d57733427'),
    gallery: [
      photo('photo-1590490360182-c33d57733427'),
      photo('photo-1566195992011-5f6b21e539aa'),
      photo('photo-1584622650111-993a426fbf0a'),
      photo('photo-1618773928121-c32242e63f39')
    ],
    amenities: [
      'California King bed',
      'Dedicated ergonomic workstation',
      'Lounge reading armchair & footrest',
      'Gourmet minibar & local treats',
      '55" 4K Smart TV with OTT',
      'Ultra-fast Wi-Fi 6',
      'Marble bathroom with rain shower',
      'Complimentary evening tea service',
      'Individual climate control',
      'Iron & garment steamer'
    ]
  },
  {
    id: 3,
    name: 'Premium Suite',
    type: 'Suite',
    price: 7499,
    size: 52,
    guests: 3,
    rating: 4.8,
    bed: '1 Super King Bed + Daybed',
    description: 'A generous suite with a separate lounge and a view worth lingering over.',
    longDescription:
      'A generous sanctuary pairing understated opulence with home-like intimacy. The Premium Suite features a private salon separated from the master bedroom by sliding teak doors, ideal for hosting guests or enjoying quiet moments. Floor-to-ceiling glass reveals sunset vistas over the city, while the master bathroom showcases an oversized freestanding soaking tub, rain shower, and double stone vanities.',
    image: photo('photo-1591088398332-8a7791972843'),
    gallery: [
      photo('photo-1591088398332-8a7791972843'),
      photo('photo-1578683010236-d716f9a3f461'),
      photo('photo-1507652313519-d4e9174996dd'),
      photo('photo-1616486338812-3dadae4b4ace')
    ],
    amenities: [
      'Separate living salon & bedroom',
      'Super King bed & velvet daybed',
      'Deep freestanding soaking tub',
      'Panoramic skyline terrace view',
      'Complimentary royal breakfast',
      'Double stone vanity & rain shower',
      '65" OLED Smart TV',
      'Welcome fruit hamper & artisanal sweets',
      'Curated pillow menu with 5 choices',
      'Espresso bar & premium teas'
    ]
  },
  {
    id: 4,
    name: 'Family Room',
    type: 'Family',
    price: 5499,
    size: 48,
    guests: 4,
    rating: 4.6,
    bed: '1 King Bed + 2 Twin Beds',
    description: 'Room for everyone, with flexible sleeping and easy family comforts.',
    longDescription:
      'Thoughtfully crafted for families and small groups, this sprawling room provides room for everyone without sacrificing privacy or style. Featuring a master king bedroom connected to a charming twin-bed alcove and a cheerful family seating area, it ensures parents and children have their own comfortable corners. Special kid-friendly amenities and curated family experiences make every stay feel warm, joyful, and effortless.',
    image: photo('photo-1566665797739-1674de7a421a'),
    gallery: [
      photo('photo-1566665797739-1674de7a421a'),
      photo('photo-1595526114035-0d45ed16cfbf'),
      photo('photo-1582719478250-c89cae4dc85b'),
      photo('photo-1584622650111-993a426fbf0a')
    ],
    amenities: [
      '1 King bed + 2 Twin beds',
      'Spacious family lounge zone',
      'Kids welcome pack & board games',
      'Dual walk-in wardrobes',
      'Complimentary family buffet breakfast',
      'Smart TV with Disney+ & Netflix',
      'Mini-fridge with milk & snacks',
      '24/7 dedicated family concierge',
      'Baby crib available on request',
      'Dual-sink family bathroom'
    ]
  },
  {
    id: 5,
    name: 'Royal Suite',
    type: 'Suite',
    price: 12999,
    size: 80,
    guests: 4,
    rating: 4.9,
    bed: 'Royal Four-Poster King Bed',
    description: 'A statement stay pairing gracious space with a little royal flourish.',
    longDescription:
      'An homage to royal Gujarati heritage, the Royal Suite represents the crowning jewel of hotel living. Handcrafted brass lanterns, warm gold accents, and rich silk drapery complement modern conveniences. Entertain in the grand dining room served by your private butler, or retreat to the lavish bedroom featuring a hand-carved four-poster king bed and an en-suite whirlpool spa bath.',
    image: photo('photo-1616486338812-3dadae4b4ace'),
    gallery: [
      photo('photo-1616486338812-3dadae4b4ace'),
      photo('photo-1578683010236-d716f9a3f461'),
      photo('photo-1507652313519-d4e9174996dd'),
      photo('photo-1591088398332-8a7791972843')
    ],
    amenities: [
      'Dedicated 24/7 private butler',
      'Grand dining table for 6 guests',
      'Deep marble whirlpool spa tub',
      'Walk-in dressing parlour',
      'Complimentary airport limousine pick-up',
      'Evening artisanal Gujarati thali',
      'Exclusive club lounge access',
      'Sonos premium ambient audio',
      'Bvlgari luxury bath collection',
      'Priority table reservations'
    ]
  },
  {
    id: 6,
    name: 'Presidential Villa',
    type: 'Villa',
    price: 19999,
    size: 140,
    guests: 6,
    rating: 5.0,
    bed: '2 Master King Suites + 2 Queen Suites',
    description: 'Your own private haven, with serene outdoor space and every comfort.',
    longDescription:
      'A private estate within the hotel grounds, the Presidential Villa provides absolute seclusion and unmatched hospitality for dignitaries, celebrities, and families seeking the ultimate retreat. Surrounded by fragrant frangipani trees and private gardens, the villa features an azure plunge pool, outdoor dining pavilion, and four decadent master suites. A dedicated private chef and butler cater to every wish around the clock.',
    image: photo('photo-1613977257363-707ba9348227'),
    gallery: [
      photo('photo-1613977257363-707ba9348227'),
      photo('photo-1600585154340-be6161a56a0c'),
      photo('photo-1600607687939-ce8a6c25118c'),
      photo('photo-1507652313519-d4e9174996dd')
    ],
    amenities: [
      'Private temperature-controlled plunge pool',
      'Private landscaped garden & sun deck',
      'Dedicated private chef & butler team',
      'Private gated entrance & garage',
      'Open-air dining pavilion',
      'In-villa spa treatment room',
      'Full gourmet kitchen & wine cellar',
      'Private VIP in-villa check-in',
      'Unrestricted 24-hour room service',
      'Custom luxury fragrance & pillow menu'
    ]
  }
];
