// Photos, in time-of-day order. Files live in public/assets/img/photos/ (600px tall, metadata stripped).
// caption = place name only.
// Captions to confirm (best guesses): dsc_0295 Coorg, img_8405 Ohiopyle, img_1003 Delaware State Forest, nyc-wtc New York City, img_6490 Death Valley, img_7666 Philadelphia, img_7728 Philadelphia, img_6826 Ann Arbor, img_6260 Jaipur.
export type Photo = { file: string; width: number; height: number; caption: string; alt: string; camera?: string; settings?: string };

export const photos: Photo[] = [
  {
    "file": "img_8046.jpg",
    "width": 450,
    "height": 600,
    "caption": "Above the clouds",
    "alt": "The horizon glowing over a sea of clouds, from a plane window."
  },
  {
    "file": "img_0510.jpg",
    "width": 900,
    "height": 600,
    "caption": "Los Angeles",
    "alt": "The Hollywood sign on a dry hillside under a clear blue sky."
  },
  {
    "file": "img_0883.jpg",
    "width": 682,
    "height": 600,
    "caption": "Lake Louise",
    "alt": "Still turquoise water at Lake Louise reflecting forested slopes and a snow-covered glacier under a clear blue sky."
  },
  {
    "file": "dsc_0295.jpg",
    "width": 903,
    "height": 600,
    "caption": "Coorg",
    "alt": "Clouds settling into a valley between green hills."
  },
  {
    "file": "img_3058.jpg",
    "width": 450,
    "height": 600,
    "caption": "Furlong",
    "alt": "A suburban street lined with blazing orange maple trees and fallen leaves, with parked cars and houses in the distance."
  },
  {
    "file": "img_7541.jpg",
    "width": 450,
    "height": 600,
    "caption": "Chicago",
    "alt": "A city skyline across a lake under a rippled, cloudy sky."
  },
  {
    "file": "img_4849.jpg",
    "width": 450,
    "height": 600,
    "caption": "Los Angeles",
    "alt": "An airplane wing over a blue sea and scattered clouds."
  },
  {
    "file": "img_5439.jpg",
    "width": 450,
    "height": 600,
    "caption": "Death Valley",
    "alt": "A lone Joshua tree in a sagebrush desert under a deep blue sky with scattered clouds."
  },
  {
    "file": "img_5651.jpg",
    "width": 450,
    "height": 600,
    "caption": "Death Valley",
    "alt": "A gravel road crossing open, dry hills under a hazy sky."
  },
  {
    "file": "img_1914.jpg",
    "width": 450,
    "height": 600,
    "caption": "Chicago",
    "alt": "A visitor looking at a painting of classical ruins in a museum."
  },
  {
    "file": "img_4723.jpg",
    "width": 450,
    "height": 600,
    "caption": "Santa Monica",
    "alt": "A wide sandy beach with small figures at the water's edge, waves rolling in, and the Santa Monica Mountains under a blue sky."
  },
  {
    "file": "img_5495.jpg",
    "width": 450,
    "height": 600,
    "caption": "Death Valley",
    "alt": "A silver car on a desert road behind a bank of yellow wildflowers, with brown hills and white clouds in a deep blue sky."
  },
  {
    "file": "img_8405.jpg",
    "width": 450,
    "height": 600,
    "caption": "Ohiopyle",
    "alt": "A forested valley under puffy clouds, framed by trees."
  },
  {
    "file": "img_4323.jpg",
    "width": 450,
    "height": 600,
    "caption": "New York City",
    "alt": "The Statue of Liberty seen from below against a sky of broken white clouds."
  },
  {
    "file": "img_6490.jpg",
    "width": 400,
    "height": 600,
    "caption": "Death Valley",
    "alt": "A white salt flat below a steep, striped brown mountainside under a pale blue sky."
  },
  {
    "file": "img_7521.jpg",
    "width": 450,
    "height": 600,
    "caption": "Chicago",
    "alt": "A baseball game seen from the stands of a ballpark."
  },
  {
    "file": "img_3440.jpg",
    "width": 452,
    "height": 600,
    "caption": "Ann Arbor",
    "alt": "A wet two-lane road with yellow lines running to the horizon."
  },
  {
    "file": "img_9993.jpg",
    "width": 450,
    "height": 600,
    "caption": "Mackinac Island",
    "alt": "A red and white lighthouse on a small rocky island under a heavy grey sky."
  },
  {
    "file": "img_2263.jpg",
    "width": 450,
    "height": 600,
    "caption": "Ann Arbor",
    "alt": "A person in a winter jacket standing in snow beneath a large bare tree, in front of Pierpont Commons."
  },
  {
    "file": "img_7535.jpg",
    "width": 450,
    "height": 600,
    "caption": "Poconos",
    "alt": "Big white clouds over a green valley, seen from a hilltop."
  },
  {
    "file": "img_4466.jpg",
    "width": 450,
    "height": 600,
    "caption": "Ann Arbor",
    "alt": "A packed basketball arena in maize and blue, seen from the upper seats."
  },
  {
    "file": "img_1059.jpg",
    "width": 450,
    "height": 600,
    "caption": "Banff",
    "alt": "A forested ridge with a boardwalk leading to a small stone lookout on Sanson Peak, with Rocky Mountain peaks and big white clouds behind."
  },
  {
    "file": "img_7742.jpg",
    "width": 450,
    "height": 600,
    "caption": "New York City",
    "alt": "A city street with a tall glass tower rising behind older buildings."
  },
  {
    "file": "img_8025.jpg",
    "width": 800,
    "height": 600,
    "caption": "Las Vegas",
    "alt": "A plane passing a gold hotel tower under a blue sky."
  },
  {
    "file": "img_4316.jpg",
    "width": 800,
    "height": 600,
    "caption": "Ann Arbor",
    "alt": "Red and green autumn trees on a lawn at sunset."
  },
  {
    "file": "img_3280.jpg",
    "width": 450,
    "height": 600,
    "caption": "Furlong",
    "alt": "A rainbow arcing down behind a red-brick house on a wet suburban street, framed by bare trees."
  },
  {
    "file": "img_4967.jpg",
    "width": 450,
    "height": 600,
    "caption": "Los Angeles",
    "alt": "City lights at night, seen from an observatory terrace."
  },
  {
    "file": "img_2076.jpg",
    "width": 450,
    "height": 600,
    "caption": "Ann Arbor",
    "alt": "Three people, one in a graduation gown, standing in front of a large yellow block M on a blue wall."
  },
  {
    "file": "img_5342.jpg",
    "width": 450,
    "height": 600,
    "caption": "Eastern Sierra",
    "alt": "A starry night sky over a mountain ridge."
  },
  {
    "file": "img_7666.jpg",
    "width": 400,
    "height": 600,
    "caption": "Philadelphia",
    "alt": "Glass skyscrapers reflecting the sky, with a faint rainbow-coloured sun halo in the clouds above them."
  },
  {
    "file": "img_1200.jpg",
    "width": 450,
    "height": 600,
    "caption": "Banff",
    "alt": "A timber-framed corner building lit up at dusk under heavy storm clouds, with a mountain behind it."
  },
  {
    "file": "img_0954.jpg",
    "width": 338,
    "height": 600,
    "caption": "Mumbai",
    "alt": "An orange sun setting beside a tall building under construction topped with a crane, with the sea and a long bridge in the haze below."
  },
  {
    "file": "img_1003.jpg",
    "width": 450,
    "height": 600,
    "caption": "Delaware State Forest",
    "alt": "A red Jeep parked at a wooded campsite under a pink evening sky, with a rainbow arcing over the pines."
  },
  {
    "file": "img_7344.jpg",
    "width": 450,
    "height": 600,
    "caption": "Furlong",
    "alt": "A fiery orange sunset over rooftops and trees in silhouette."
  },
  {
    "file": "img_7728.jpg",
    "width": 400,
    "height": 600,
    "caption": "Philadelphia",
    "alt": "A yellow suspension bridge tower lit by low sun, framed by dark trees against a stormy sky."
  },
  {
    "file": "img_6826.jpg",
    "width": 1058,
    "height": 600,
    "caption": "Ann Arbor",
    "alt": "Rows of graduates in caps and gowns with colourful hoods, watching a commencement ceremony."
  },
  {
    "file": "img_5345.jpg",
    "width": 450,
    "height": 600,
    "caption": "Lone Pine",
    "alt": "A car and a tent at a campsite under a starry night sky, with snow-capped mountains behind."
  },
  {
    "file": "img_7526.jpg",
    "width": 450,
    "height": 600,
    "caption": "Chicago",
    "alt": "Skyscrapers lit at night from high above, with a dark lake beyond."
  },
  {
    "file": "nyc-wtc.jpg",
    "width": 338,
    "height": 600,
    "caption": "New York City",
    "alt": "A split view of One World Trade Center and neighbouring Lower Manhattan towers, lit up against a deep blue night sky on one side and a pale sunset sky on the other."
  },
  {
    "file": "img_1364.jpg",
    "width": 450,
    "height": 600,
    "caption": "Detroit",
    "alt": "A city skyline at dusk under a pale violet sky."
  },
  {
    "file": "img_6438.jpg",
    "width": 1067,
    "height": 600,
    "caption": "Ann Arbor",
    "alt": "Rows of tall arched windows glowing at night."
  },
  {
    "file": "img_9630.jpg",
    "width": 450,
    "height": 600,
    "caption": "Hyderabad",
    "alt": "The Charminar lit up at night, its four minarets rising over a crowd and a balloon seller."
  },
  {
    "file": "img_6260.jpg",
    "width": 902,
    "height": 600,
    "caption": "Jaipur",
    "alt": "Two people at night beside a bilingual sign reading Varun Hostel on a college campus."
  },
  {
    "file": "img_5509.jpg",
    "width": 450,
    "height": 600,
    "caption": "Ann Arbor",
    "alt": "The neon State Theatre marquee glowing red and green at night above a city sidewalk."
  },
  {
    "file": "img_3677.jpg",
    "width": 450,
    "height": 600,
    "caption": "New York City",
    "alt": "A city skyline lit up at night across dark water."
  },
  {
    "file": "img_3684.jpg",
    "width": 800,
    "height": 600,
    "caption": "New York City",
    "alt": "A suspension bridge lit at night, with city towers behind it."
  },
  {
    "file": "img_1128.jpg",
    "width": 800,
    "height": 600,
    "caption": "Ann Arbor",
    "alt": "Someone on a porch watching the northern lights over a dark treeline."
  }
];
