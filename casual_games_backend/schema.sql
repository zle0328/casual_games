-- 用户表
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  nickname TEXT NOT NULL,
  avatar TEXT,
  total_games INTEGER DEFAULT 0,
  dice_games INTEGER DEFAULT 0,
  spy_games INTEGER DEFAULT 0,
  spy_wins INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 游戏房间表
CREATE TABLE IF NOT EXISTS rooms (
  room_code TEXT PRIMARY KEY,
  game_type TEXT NOT NULL CHECK(game_type IN ('dice', 'spy')),
  creator_id TEXT NOT NULL,
  status TEXT DEFAULT 'waiting' CHECK(status IN ('waiting', 'playing', 'finished')),
  settings TEXT, -- JSON: {players_count, spy_count, etc.}
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  started_at DATETIME,
  finished_at DATETIME,
  FOREIGN KEY (creator_id) REFERENCES users(id)
);

-- 房间玩家表
CREATE TABLE IF NOT EXISTS room_players (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  room_code TEXT NOT NULL,
  user_id TEXT NOT NULL,
  role TEXT, -- dice: null, spy: 'civilian'/'spy'/'blank'
  is_alive INTEGER DEFAULT 1,
  joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (room_code) REFERENCES rooms(room_code),
  FOREIGN KEY (user_id) REFERENCES users(id),
  UNIQUE(room_code, user_id)
);

-- 游戏记录表
CREATE TABLE IF NOT EXISTS game_records (
  id TEXT PRIMARY KEY,
  room_code TEXT NOT NULL,
  user_id TEXT NOT NULL,
  game_type TEXT NOT NULL,
  result TEXT CHECK(result IN ('win', 'lose', 'draw')),
  details TEXT, -- JSON: {dice_result, punishment, spy_role, etc.}
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (room_code) REFERENCES rooms(room_code),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- 索引优化
CREATE INDEX IF NOT EXISTS idx_rooms_creator ON rooms(creator_id);
CREATE INDEX IF NOT EXISTS idx_rooms_status ON rooms(status);
CREATE INDEX IF NOT EXISTS idx_room_players_room ON room_players(room_code);
CREATE INDEX IF NOT EXISTS idx_game_records_user ON game_records(user_id);
CREATE INDEX IF NOT EXISTS idx_game_records_created ON game_records(created_at);
