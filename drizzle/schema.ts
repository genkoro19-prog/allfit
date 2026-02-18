import { boolean, decimal, int, json, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// ============================================
// User Profile Table
// ============================================
export const userProfiles = mysqlTable("user_profiles", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique(),
  height: decimal("height", { precision: 5, scale: 2 }), // cm
  weight: decimal("weight", { precision: 5, scale: 2 }), // kg
  age: int("age"),
  gender: mysqlEnum("gender", ["male", "female", "other"]),
  targetWeight: decimal("targetWeight", { precision: 5, scale: 2 }), // kg
  targetBenchPress: decimal("targetBenchPress", { precision: 5, scale: 2 }), // kg
  targetCalories: int("targetCalories"), // kcal
  targetProtein: decimal("targetProtein", { precision: 5, scale: 2 }), // g
  targetFat: decimal("targetFat", { precision: 5, scale: 2 }), // g
  targetCarbs: decimal("targetCarbs", { precision: 5, scale: 2 }), // g
  defaultIntervalSeconds: int("defaultIntervalSeconds").default(90).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

// ============================================
// Exercise Master Table (種目マスタ)
// ============================================
export const exercises = mysqlTable("exercises", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  part: mysqlEnum("part", ["chest", "back", "legs", "shoulders", "arms", "abs", "cardio"]).notNull(),
  equipmentType: mysqlEnum("equipmentType", ["barbell", "dumbbell", "machine", "bodyweight"]).notNull(),
  isPreset: boolean("isPreset").default(false).notNull(), // true: 全ユーザー共通, false: カスタム種目
  createdBy: int("createdBy"), // カスタム種目を追加したユーザーID (プリセットの場合はnull)
  description: text("description"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

// ============================================
// Workout Logs Table (筋トレ記録)
// ============================================
export const workoutLogs = mysqlTable("workout_logs", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  exerciseId: int("exerciseId").notNull(),
  date: timestamp("date").notNull(),
  // sets: JSON配列 [{weight: 120.0, reps: 8, completed: true}, ...]
  sets: json("sets").$type<Array<{ weight: number; reps: number; completed: boolean }>>().notNull(),
  totalVolume: decimal("totalVolume", { precision: 10, scale: 2 }), // 総負荷量 (kg)
  estimated1RM: decimal("estimated1RM", { precision: 10, scale: 2 }), // 推定1RM (kg)
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

// ============================================
// Cardio Logs Table (有酸素運動記録)
// ============================================
export const cardioLogs = mysqlTable("cardio_logs", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  exerciseId: int("exerciseId").notNull(), // exercises テーブルの cardio 種目を参照
  date: timestamp("date").notNull(),
  durationMinutes: int("durationMinutes"), // 時間 (分)
  distanceKm: decimal("distanceKm", { precision: 10, scale: 2 }), // 距離 (km)
  caloriesBurned: int("caloriesBurned"), // 消費カロリー (kcal)
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

// ============================================
// Food Dictionary Table (食事カスタム辞書)
// ============================================
export const foodDictionary = mysqlTable("food_dictionary", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  keyword: varchar("keyword", { length: 100 }).notNull(), // 例: "特", "べーす", "べべき", "さわおに"
  calories: int("calories").notNull(), // kcal
  protein: decimal("protein", { precision: 5, scale: 2 }).notNull(), // g
  fat: decimal("fat", { precision: 5, scale: 2 }).notNull(), // g
  carbs: decimal("carbs", { precision: 5, scale: 2 }).notNull(), // g
  description: text("description"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

// ============================================
// Diet Logs Table (食事記録)
// ============================================
export const dietLogs = mysqlTable("diet_logs", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  date: timestamp("date").notNull(),
  mealType: mysqlEnum("mealType", ["breakfast", "lunch", "dinner", "snack"]).notNull(),
  // items: JSON配列 [{name: "鶏胸肉", calories: 200, protein: 40, fat: 5, carbs: 0}, ...]
  items: json("items").$type<Array<{ name: string; calories: number; protein: number; fat: number; carbs: number }>>().notNull(),
  totalCalories: int("totalCalories").notNull(),
  totalProtein: decimal("totalProtein", { precision: 5, scale: 2 }).notNull(),
  totalFat: decimal("totalFat", { precision: 5, scale: 2 }).notNull(),
  totalCarbs: decimal("totalCarbs", { precision: 5, scale: 2 }).notNull(),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

// ============================================
// Gym Locations Table (ジム位置情報 - フェーズ3)
// ============================================
export const gymLocations = mysqlTable("gym_locations", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  latitude: decimal("latitude", { precision: 10, scale: 8 }).notNull(),
  longitude: decimal("longitude", { precision: 11, scale: 8 }).notNull(),
  radiusMeters: int("radiusMeters").default(100).notNull(), // ジオフェンスの半径 (m)
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

// ============================================
// Gym Check-in Logs Table (ジムチェックイン記録 - フェーズ3)
// ============================================
export const gymCheckInLogs = mysqlTable("gym_check_in_logs", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  gymLocationId: int("gymLocationId").notNull(),
  checkInTime: timestamp("checkInTime").notNull(),
  checkOutTime: timestamp("checkOutTime"),
  durationMinutes: int("durationMinutes"), // 滞在時間 (分)
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

// ============================================
// Personal Records Table (自己ベスト記録)
// ============================================
export const personalRecords = mysqlTable("personal_records", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  exerciseId: int("exerciseId").notNull(),
  best1RM: decimal("best1RM", { precision: 10, scale: 2 }).notNull(), // 最高1RM (kg)
  achievedDate: timestamp("achievedDate").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

// ============================================
// Type Exports
// ============================================
export type UserProfile = typeof userProfiles.$inferSelect;
export type InsertUserProfile = typeof userProfiles.$inferInsert;

export type Exercise = typeof exercises.$inferSelect;
export type InsertExercise = typeof exercises.$inferInsert;

// export type WorkoutLog = typeof workoutLogs.$inferSelect; // Commented out to avoid conflict with lib/storage.ts
export type InsertWorkoutLog = typeof workoutLogs.$inferInsert;

export type CardioLog = typeof cardioLogs.$inferSelect;
export type InsertCardioLog = typeof cardioLogs.$inferInsert;

export type FoodDictionary = typeof foodDictionary.$inferSelect;
export type InsertFoodDictionary = typeof foodDictionary.$inferInsert;

export type DietLog = typeof dietLogs.$inferSelect;
export type InsertDietLog = typeof dietLogs.$inferInsert;

export type GymLocation = typeof gymLocations.$inferSelect;
export type InsertGymLocation = typeof gymLocations.$inferInsert;

export type GymCheckInLog = typeof gymCheckInLogs.$inferSelect;
export type InsertGymCheckInLog = typeof gymCheckInLogs.$inferInsert;

export type PersonalRecord = typeof personalRecords.$inferSelect;
export type InsertPersonalRecord = typeof personalRecords.$inferInsert;
