const express = require('express');
const cors = require('cors');
const path = require('path');
const crypto = require('crypto');

const app = express();
const DEFAULT_PORT = parseInt(process.env.PORT) || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// In-memory session store
const sessions = new Map();
const gameHistory = [];

// Hilarious Target Pool (ITEMS THAT WILL NEVER EXIST IN ROOM)
const IMPOSSIBLE_TARGETS = [
  { id: 'red_mug', name: 'RED MUG', icon: '☕', hint: 'It has a handle and is bright red.' },
  { id: 'banana_phone', name: 'BANANA PHONE', icon: '🍌', hint: 'Looks like fruit, rings like a telephone.' },
  { id: 'golden_spoon', name: 'GOLDEN SPOON', icon: '🥄', hint: 'Shiny, metallic, perfect for soup.' },
  { id: 'purple_pillow', name: 'PURPLE PILLOW', icon: '🛋️', hint: 'Soft, fluffy, uniquely purple.' },
  { id: 'left_shoe', name: 'NEON GREEN LEFT SHOE', icon: '👟', hint: 'Specifically the left shoe in bright neon green.' },
  { id: 'invisible_toaster', name: 'INVISIBLE TOASTER', icon: '🍞', hint: 'Makes toast, completely see-through.' },
  { id: 'pink_headphones', name: 'PINK HEADPHONES', icon: '🎧', hint: 'Wireless studio headphones in bright pink.' },
  { id: 'blue_umbrella', name: 'SKY BLUE UMBRELLA', icon: '☂️', hint: 'Compact folding umbrella in sky blue.' },
  { id: 'vintage_radio', name: 'VINTAGE WOOD RADIO', icon: '📻', hint: 'Antique wood casing with brass knobs.' },
  { id: 'cheese_wheel', name: 'SWISS CHEESE WHEEL', icon: '🧀', hint: 'A huge round wheel of Swiss cheese.' },
  { id: 'flying_teapot', name: 'MAGIC FLYING TEAPOT', icon: '🫖', hint: 'Steaming porcelain teapot with golden trim.' },
  { id: 'disco_ball', name: 'GLITTER DISCO BALL', icon: '🪩', hint: 'Glittery mirror ball reflecting neon light.' },
  { id: 'talking_duck', name: 'RUBBER DUCK WITH GLASSES', icon: '🦆', hint: 'Yellow duck wearing tiny sunglasses.' }
];

// Room Objects Master List (58 DETAILED INTERACTIVE OBJECTS ACROSS LIVING ROOM, KITCHEN & OTHER ZONES)
// Guaranteed: NONE OF THESE MATCH ANY ITEM IN IMPOSSIBLE_TARGETS!
const LARGE_HOUSE_OBJECTS = [
  // --- LIVING ROOM ZONE ---
  { id: 'sofa', name: 'Comfy Sofa', icon: '🛋️', x: 2, y: 48, w: 22, h: 22, zone: 'living', color: '#3b82f6' },
  { id: 'armchair', name: 'Plush Armchair', icon: '🪑', x: 25, y: 52, w: 10, h: 18, zone: 'living', color: '#6366f1' },
  { id: 'coffee_table', name: 'Coffee Table', icon: '🪵', x: 12, y: 72, w: 18, h: 14, zone: 'living', color: '#78350f' },
  { id: 'tv', name: 'Smart TV', icon: '📺', x: 10, y: 16, w: 16, h: 18, zone: 'living', color: '#0f172a', animated: 'flicker' },
  { id: 'tv_remote', name: 'TV Remote Control', icon: '📱', x: 14, y: 70, w: 4, h: 4, zone: 'living', color: '#334155' },
  { id: 'speaker', name: 'Bluetooth Speaker', icon: '🔊', x: 8, y: 18, w: 4, h: 6, zone: 'living', color: '#475569' },
  { id: 'books', name: 'Stack of Novels', icon: '📚', x: 24, y: 72, w: 5, h: 6, zone: 'living', color: '#8b5cf6' },
  { id: 'magazine', name: 'Glossy Magazine', icon: '📰', x: 18, y: 74, w: 4, h: 3, zone: 'living', color: '#f43f5e' },
  { id: 'wall_clock', name: 'Tick-Tock Wall Clock', icon: '🕒', x: 16, y: 4, w: 6, h: 8, zone: 'living', color: '#dc2626', animated: 'clock_tick' },
  { id: 'floor_lamp', name: 'Tall Floor Lamp', icon: '💡', x: 1, y: 22, w: 5, h: 32, zone: 'living', color: '#f59e0b', animated: 'lamp_glow' },
  { id: 'table_lamp', name: 'Warm Table Lamp', icon: '🪔', x: 27, y: 44, w: 5, h: 8, zone: 'living', color: '#eab308' },
  { id: 'house_plant', name: 'Potted Monstera', icon: '🪴', x: 30, y: 22, w: 7, h: 22, zone: 'living', color: '#10b981', animated: 'plant_sway' },
  { id: 'flower_vase', name: 'Glass Flower Vase', icon: '🏺', x: 13, y: 68, w: 4, h: 5, zone: 'living', color: '#38bdf8' },
  { id: 'picture_frame', name: 'Family Photo Frame', icon: '🖼️', x: 2, y: 8, w: 6, h: 8, zone: 'living', color: '#b45309' },
  { id: 'cushions', name: 'Velvet Throw Pillows', icon: '🛋️', x: 6, y: 50, w: 6, h: 6, zone: 'living', color: '#ec4899' },
  { id: 'carpet', name: 'Patterned Rug', icon: '🧶', x: 5, y: 86, w: 26, h: 10, zone: 'living', color: '#94a3b8' },
  { id: 'shoes', name: 'White Sneakers', icon: '👟', x: 2, y: 80, w: 5, h: 5, zone: 'living', color: '#e2e8f0' },
  { id: 'backpack', name: 'Travel Backpack', icon: '🎒', x: 27, y: 76, w: 6, h: 10, zone: 'living', color: '#0ea5e9' },
  { id: 'smartphone', name: 'Vibrating Phone', icon: '📱', x: 16, y: 72, w: 3, h: 4, zone: 'living', color: '#6366f1', animated: 'vibrate' },
  { id: 'controller', name: 'Game Controller', icon: '🎮', x: 20, y: 71, w: 4, h: 3, zone: 'living', color: '#a855f7' },
  { id: 'headphones', name: 'Black Headphones', icon: '🎧', x: 11, y: 50, w: 4, h: 4, zone: 'living', color: '#0f172a' },

  // --- KITCHEN ZONE ---
  { id: 'fridge', name: 'Stainless Refrigerator', icon: '🧊', x: 38, y: 15, w: 11, h: 46, zone: 'kitchen', color: '#94a3b8' },
  { id: 'microwave', name: 'Digital Microwave', icon: '📻', x: 50, y: 18, w: 8, h: 10, zone: 'kitchen', color: '#334155', animated: 'flicker' },
  { id: 'oven', name: 'Baking Oven', icon: '🍳', x: 50, y: 38, w: 9, h: 22, zone: 'kitchen', color: '#1e293b' },
  { id: 'toaster', name: 'Chrome Toaster', icon: '🍞', x: 59, y: 20, w: 5, h: 6, zone: 'kitchen', color: '#cbd5e1' },
  { id: 'kettle', name: 'Electric Water Kettle', icon: '🫖', x: 65, y: 18, w: 5, h: 7, zone: 'kitchen', color: '#ef4444' },
  { id: 'coffee_machine', name: 'Espresso Machine', icon: '☕', x: 71, y: 16, w: 7, h: 10, zone: 'kitchen', color: '#0f172a' },
  { id: 'plates', name: 'Stack of Ceramic Plates', icon: '🍽️', x: 52, y: 64, w: 5, h: 5, zone: 'kitchen', color: '#f8fafc' },
  { id: 'white_cup', name: 'Porcelain Teacup', icon: '🍵', x: 58, y: 65, w: 3, h: 4, zone: 'kitchen', color: '#f1f5f9', animated: 'wobble' },
  { id: 'blue_mug', name: 'Navy Blue Mug', icon: '☕', x: 62, y: 64, w: 3, h: 4, zone: 'kitchen', color: '#1e3a8a' },
  { id: 'bowls', name: 'Soup Bowls', icon: '🥣', x: 66, y: 65, w: 4, h: 4, zone: 'kitchen', color: '#38bdf8' },
  { id: 'spoons', name: 'Silver Spoons', icon: '🥄', x: 71, y: 65, w: 3, h: 3, zone: 'kitchen', color: '#94a3b8' },
  { id: 'forks', name: 'Dinner Forks', icon: '🍴', x: 74, y: 65, w: 3, h: 3, zone: 'kitchen', color: '#94a3b8' },
  { id: 'knife_block', name: 'Wooden Knife Block', icon: '🔪', x: 78, y: 18, w: 4, h: 7, zone: 'kitchen', color: '#78350f' },
  { id: 'water_bottle', name: 'Reusable Water Bottle', icon: '🍾', x: 50, y: 62, w: 3, h: 6, zone: 'kitchen', color: '#06b6d4' },
  { id: 'cooking_pan', name: 'Non-Stick Frying Pan', icon: '🍳', x: 59, y: 34, w: 6, h: 4, zone: 'kitchen', color: '#334155' },
  { id: 'cutting_board', name: 'Wooden Cutting Board', icon: '🪵', x: 66, y: 22, w: 5, h: 4, zone: 'kitchen', color: '#b45309' },
  { id: 'food_containers', name: 'Tupperware Boxes', icon: '🍱', x: 40, y: 63, w: 5, h: 5, zone: 'kitchen', color: '#a7f3d0' },
  { id: 'fruit_basket', name: 'Woven Fruit Basket', icon: '🧺', x: 56, y: 63, w: 6, h: 6, zone: 'kitchen', color: '#f97316' },
  { id: 'banana', name: 'Ripe Yellow Banana', icon: '🍌', x: 57, y: 62, w: 3, h: 3, zone: 'kitchen', color: '#eab308' },
  { id: 'apple', name: 'Crisp Red Apple', icon: '🍎', x: 60, y: 63, w: 2, h: 2, zone: 'kitchen', color: '#dc2626' },
  { id: 'orange', name: 'Juicy Orange', icon: '🍊', x: 58, y: 64, w: 2, h: 2, zone: 'kitchen', color: '#f97316' },
  { id: 'dining_table', name: 'Kitchen Dining Counter', icon: '🪵', x: 48, y: 68, w: 34, h: 18, zone: 'kitchen', color: '#854d0e' },

  // --- OTHER OBJECTS & DECOR ZONE ---
  { id: 'wall_calendar', name: '2026 Wall Calendar', icon: '📅', x: 38, y: 4, w: 5, h: 7, zone: 'other', color: '#ef4444' },
  { id: 'bookshelf', name: 'Tall Bookshelf', icon: '🪵', x: 84, y: 12, w: 14, h: 65, zone: 'other', color: '#713f12' },
  { id: 'umbrella', name: 'Black Umbrella', icon: '☂️', x: 84, y: 78, w: 4, h: 16, zone: 'other', color: '#1e293b' },
  { id: 'toy_car', name: 'Squeaky Toy Car', icon: '🚗', x: 34, y: 84, w: 4, h: 4, zone: 'other', color: '#e11d48', animated: 'wobble' },
  { id: 'small_plant_pot', name: 'Succulent Pot', icon: '🌵', x: 86, y: 15, w: 3, h: 4, zone: 'other', color: '#059669' },
  { id: 'waste_bin', name: 'Step Trash Can', icon: '🗑️', x: 92, y: 78, w: 6, h: 14, zone: 'other', color: '#64748b' },
  { id: 'slippers', name: 'Fluffy Slippers', icon: '🥿', x: 42, y: 88, w: 5, h: 4, zone: 'other', color: '#f472b6' },
  { id: 'keys', name: 'Keychain & Keys', icon: '🔑', x: 88, y: 32, w: 3, h: 3, zone: 'other', color: '#f59e0b' },
  { id: 'wrist_watch', name: 'Leather Wristwatch', icon: '⌚', x: 86, y: 48, w: 3, h: 3, zone: 'other', color: '#d97706' },
  { id: 'pillow', name: 'Soft Pillow', icon: '☁️', x: 31, y: 55, w: 4, h: 4, zone: 'other', color: '#f8fafc' },
  { id: 'blanket', name: 'Cozy Blanket', icon: '🛋️', x: 4, y: 62, w: 6, h: 6, zone: 'other', color: '#38bdf8' },
  { id: 'small_box', name: 'Storage Box', icon: '📦', x: 88, y: 64, w: 6, h: 6, zone: 'other', color: '#d97706' },
  { id: 'decorative_statue', name: 'Mini Bronze Statue', icon: '🗿', x: 88, y: 22, w: 4, h: 6, zone: 'other', color: '#78350f' },
  { id: 'sleepy_cat', name: 'Whiskers the Cat', icon: '🐱', x: 20, y: 58, w: 5, h: 5, zone: 'other', color: '#f97316', animated: 'cat_idle' },
  { id: 'ceiling_fan', name: 'Ceiling Fan', icon: '🌀', x: 46, y: 2, w: 10, h: 8, zone: 'other', color: '#64748b', animated: 'fan_spin' },
  { id: 'room_door', name: 'Wooden Door', icon: '🚪', x: 94, y: 12, w: 5, h: 50, zone: 'other', color: '#57534e', animated: 'door_creak' }
];

// Funny Wrong Click Responses (Escalating Humor)
const WRONG_CLICK_MESSAGES = [
  "❌ Nope.",
  "❌ That's a chair.",
  "🤨 That's definitely not what you were told to find.",
  "😐 Keep searching...",
  "😂 Are you sure you know what you're looking for?",
  "💀 You've checked half the house.",
  "👀 Maybe check behind the sofa.",
  "🔥 Have you tried turning the power back on?",
  "🔍 OBJECT DETECTION ACCURACY: 0.0%",
  "🤡 Fun fact: Clicking faster won't make the object appear!",
  "⚡ Electricity status: Still 100% OFF.",
  "👻 Paranormal Update: The ghosts in the house also can't find it.",
  "🚪 Have you tried looking outside the front door?",
  "🏆 Achievement Unlocked: Successfully Clicked Another Irrelevant Object!"
];

function getRandomItem(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

// REST API Endpoints

// 1. Start Game Session
app.post('/api/game/start', (req, res) => {
  const level = parseInt(req.body.level) || 1;
  
  // Pick an impossible target (NEVER present in LARGE_HOUSE_OBJECTS)
  const target = getRandomItem(IMPOSSIBLE_TARGETS);
  
  const sessionId = crypto.randomBytes(8).toString('hex');
  const sessionData = {
    id: sessionId,
    level,
    levelName: 'Cluttered House',
    target,
    roomObjects: LARGE_HOUSE_OBJECTS,
    memorizationTime: 3,
    searchTime: 120, // 2 MINUTES (120 SECONDS)
    startTime: Date.now(),
    clicksCount: 0,
    wrongClicks: 0,
    flashlightUses: 0,
    cursorVisibilityEvents: 4,
    objectsClicked: [],
    completed: false
  };

  sessions.set(sessionId, sessionData);

  res.json({
    success: true,
    sessionId,
    level,
    levelName: sessionData.levelName,
    target: {
      id: target.id,
      name: target.name,
      icon: target.icon,
      hint: target.hint
    },
    roomObjects: LARGE_HOUSE_OBJECTS.map(obj => ({
      id: obj.id,
      name: obj.name,
      icon: obj.icon,
      x: obj.x,
      y: obj.y,
      w: obj.w,
      h: obj.h,
      zone: obj.zone,
      color: obj.color,
      animated: obj.animated || null
    })),
    memorizationTime: sessionData.memorizationTime,
    searchTime: sessionData.searchTime
  });
});

// 2. Fetch Session Status
app.get('/api/game/:id', (req, res) => {
  const session = sessions.get(req.params.id);
  if (!session) {
    return res.status(404).json({ success: false, error: 'Session not found' });
  }
  res.json({ success: true, session });
});

// 3. Track Click on Object
app.post('/api/game/:id/click', (req, res) => {
  const session = sessions.get(req.params.id);
  if (!session) {
    return res.status(404).json({ success: false, error: 'Session not found' });
  }

  const { objectId, objectName } = req.body;
  session.clicksCount += 1;
  session.wrongClicks += 1;
  if (objectName && !session.objectsClicked.includes(objectName)) {
    session.objectsClicked.push(objectName);
  }

  const msgIndex = Math.min(session.wrongClicks - 1, WRONG_CLICK_MESSAGES.length - 1);
  const funnyMessage = WRONG_CLICK_MESSAGES[msgIndex] || getRandomItem(WRONG_CLICK_MESSAGES);

  res.json({
    success: true,
    isTarget: false, // ALWAYS FALSE! The target NEVER exists!
    wrongClicks: session.wrongClicks,
    message: funnyMessage
  });
});

// 4. Track Flashlight Usage
app.post('/api/game/:id/flashlight', (req, res) => {
  const session = sessions.get(req.params.id);
  if (!session) {
    return res.status(404).json({ success: false, error: 'Session not found' });
  }

  session.flashlightUses += 1;
  res.json({
    success: true,
    flashlightUses: session.flashlightUses
  });
});

// 5. Finish Round & Calculate Uselessness Score
app.post('/api/game/:id/finish', (req, res) => {
  const session = sessions.get(req.params.id);
  if (!session) {
    return res.status(404).json({ success: false, error: 'Session not found' });
  }

  const searchDuration = (req.body.searchDuration || session.searchTime);
  session.completed = true;
  session.finalSearchDuration = searchDuration;

  const results = {
    sessionId: session.id,
    targetName: session.target.name,
    targetIcon: session.target.icon,
    objectsChecked: session.objectsClicked.length,
    wrongClicks: session.wrongClicks,
    flashlightUses: session.flashlightUses,
    cursorVisibilityEvents: 4,
    searchTime: 120,
    objectsFound: 0,
    usefulnessScore: '0%',
    uselessnessScore: '100%',
    ratingStars: 5,
    verdict: 'You have successfully accomplished absolutely nothing.',
    funnyAnalysis: [
      'Scanning sofa and under cushions...',
      'Scanning kitchen refrigerator, microwave and fruit basket...',
      'Scanning bookshelf and storage boxes...',
      'Scanning dark corners and invisible air molecules...',
      'CRITICAL DISCOVERY: Target object was NEVER present in the room!'
    ]
  };

  gameHistory.unshift({
    timestamp: new Date().toISOString(),
    targetName: session.target.name,
    wrongClicks: session.wrongClicks,
    timeWasted: 120
  });

  if (gameHistory.length > 20) gameHistory.pop();

  res.json({
    success: true,
    results
  });
});

// Port fallback helper
function startServer(port) {
  const server = app.listen(port, () => {
    console.log(`⚡ POWER CUT server running at http://localhost:${port}`);
  }).on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.log(`Port ${port} in use, trying port ${port + 1}...`);
      startServer(port + 1);
    } else {
      console.error(err);
    }
  });
}

startServer(DEFAULT_PORT);
