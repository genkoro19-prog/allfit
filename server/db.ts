import { eq, and, desc, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  InsertUser,
  users,
  userProfiles,
  exercises,
  workoutLogs,
  cardioLogs,
  foodDictionary,
  dietLogs,
  gymLocations,
  gymCheckInLogs,
  personalRecords,
  type InsertUserProfile,
  type InsertExercise,
  type InsertWorkoutLog,
  type InsertCardioLog,
  type InsertFoodDictionary,
  type InsertDietLog,
  type InsertGymLocation,
  type InsertGymCheckInLog,
  type InsertPersonalRecord,
} from "../drizzle/schema";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = "admin";
      updateSet.role = "admin";
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// ============================================
// OmniTrack Fitness Database Functions
// ============================================

// User Profile Functions
export async function getUserProfile(userId: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(userProfiles).where(eq(userProfiles.userId, userId)).limit(1);
  return result[0] || null;
}

export async function createUserProfile(data: InsertUserProfile) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const [result] = await db.insert(userProfiles).values(data);
  return Number(result.insertId);
}

export async function updateUserProfile(userId: number, data: Partial<InsertUserProfile>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(userProfiles).set(data).where(eq(userProfiles.userId, userId));
}

// Exercise Functions
export async function getAllExercises(userId?: number) {
  const db = await getDb();
  if (!db) return [];
  if (userId) {
    return db.select().from(exercises).where(sql`${exercises.isPreset} = true OR ${exercises.createdBy} = ${userId}`).orderBy(exercises.part, exercises.name);
  }
  return db.select().from(exercises).where(eq(exercises.isPreset, true)).orderBy(exercises.part, exercises.name);
}

export async function getExercisesByPart(part: string, userId?: number) {
  const db = await getDb();
  if (!db) return [];
  if (userId) {
    return db.select().from(exercises).where(and(eq(exercises.part, part as any), sql`${exercises.isPreset} = true OR ${exercises.createdBy} = ${userId}`)).orderBy(exercises.name);
  }
  return db.select().from(exercises).where(and(eq(exercises.part, part as any), eq(exercises.isPreset, true))).orderBy(exercises.name);
}

export async function getExerciseById(id: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(exercises).where(eq(exercises.id, id)).limit(1);
  return result[0] || null;
}

export async function createExercise(data: InsertExercise) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const [result] = await db.insert(exercises).values(data);
  return Number(result.insertId);
}

export async function updateExercise(id: number, data: Partial<InsertExercise>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(exercises).set(data).where(eq(exercises.id, id));
}

export async function deleteExercise(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(exercises).where(eq(exercises.id, id));
}

// Workout Log Functions
export async function getWorkoutLogsByDate(userId: number, date: Date) {
  const db = await getDb();
  if (!db) return [];
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);
  return db.select().from(workoutLogs).where(and(eq(workoutLogs.userId, userId), sql`${workoutLogs.date} >= ${startOfDay.toISOString()}`, sql`${workoutLogs.date} <= ${endOfDay.toISOString()}`)).orderBy(workoutLogs.date);
}

export async function getWorkoutLogById(id: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(workoutLogs).where(eq(workoutLogs.id, id)).limit(1);
  return result[0] || null;
}

export async function createWorkoutLog(data: InsertWorkoutLog) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const [result] = await db.insert(workoutLogs).values(data);
  return Number(result.insertId);
}

export async function updateWorkoutLog(id: number, data: Partial<InsertWorkoutLog>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(workoutLogs).set(data).where(eq(workoutLogs.id, id));
}

export async function deleteWorkoutLog(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(workoutLogs).where(eq(workoutLogs.id, id));
}

// Cardio Log Functions
export async function getCardioLogsByDate(userId: number, date: Date) {
  const db = await getDb();
  if (!db) return [];
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);
  return db.select().from(cardioLogs).where(and(eq(cardioLogs.userId, userId), sql`${cardioLogs.date} >= ${startOfDay.toISOString()}`, sql`${cardioLogs.date} <= ${endOfDay.toISOString()}`)).orderBy(cardioLogs.date);
}

export async function createCardioLog(data: InsertCardioLog) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const [result] = await db.insert(cardioLogs).values(data);
  return Number(result.insertId);
}

export async function updateCardioLog(id: number, data: Partial<InsertCardioLog>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(cardioLogs).set(data).where(eq(cardioLogs.id, id));
}

export async function deleteCardioLog(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(cardioLogs).where(eq(cardioLogs.id, id));
}

// Food Dictionary Functions
export async function getFoodDictionaryByUserId(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(foodDictionary).where(eq(foodDictionary.userId, userId)).orderBy(foodDictionary.keyword);
}

export async function getFoodDictionaryByKeyword(userId: number, keyword: string) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(foodDictionary).where(and(eq(foodDictionary.userId, userId), eq(foodDictionary.keyword, keyword))).limit(1);
  return result[0] || null;
}

export async function createFoodDictionary(data: InsertFoodDictionary) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const [result] = await db.insert(foodDictionary).values(data);
  return Number(result.insertId);
}

export async function updateFoodDictionary(id: number, data: Partial<InsertFoodDictionary>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(foodDictionary).set(data).where(eq(foodDictionary.id, id));
}

export async function deleteFoodDictionary(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(foodDictionary).where(eq(foodDictionary.id, id));
}

// Diet Log Functions
export async function getDietLogsByDate(userId: number, date: Date) {
  const db = await getDb();
  if (!db) return [];
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);
  return db.select().from(dietLogs).where(and(eq(dietLogs.userId, userId), sql`${dietLogs.date} >= ${startOfDay.toISOString()}`, sql`${dietLogs.date} <= ${endOfDay.toISOString()}`)).orderBy(dietLogs.date);
}

export async function createDietLog(data: InsertDietLog) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const [result] = await db.insert(dietLogs).values(data);
  return Number(result.insertId);
}

export async function updateDietLog(id: number, data: Partial<InsertDietLog>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(dietLogs).set(data).where(eq(dietLogs.id, id));
}

export async function deleteDietLog(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(dietLogs).where(eq(dietLogs.id, id));
}

// Gym Location Functions
export async function getGymLocationsByUserId(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(gymLocations).where(eq(gymLocations.userId, userId)).orderBy(gymLocations.name);
}

export async function createGymLocation(data: InsertGymLocation) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const [result] = await db.insert(gymLocations).values(data);
  return Number(result.insertId);
}

export async function updateGymLocation(id: number, data: Partial<InsertGymLocation>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(gymLocations).set(data).where(eq(gymLocations.id, id));
}

export async function deleteGymLocation(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(gymLocations).where(eq(gymLocations.id, id));
}

// Gym Check-in Log Functions
export async function getGymCheckInLogsByUserId(userId: number, limit: number = 10) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(gymCheckInLogs).where(eq(gymCheckInLogs.userId, userId)).orderBy(desc(gymCheckInLogs.checkInTime)).limit(limit);
}

export async function createGymCheckInLog(data: InsertGymCheckInLog) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const [result] = await db.insert(gymCheckInLogs).values(data);
  return Number(result.insertId);
}

export async function updateGymCheckInLog(id: number, data: Partial<InsertGymCheckInLog>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(gymCheckInLogs).set(data).where(eq(gymCheckInLogs.id, id));
}

// Personal Record Functions
export async function getPersonalRecordByExercise(userId: number, exerciseId: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(personalRecords).where(and(eq(personalRecords.userId, userId), eq(personalRecords.exerciseId, exerciseId))).orderBy(desc(personalRecords.best1RM)).limit(1);
  return result[0] || null;
}

export async function createPersonalRecord(data: InsertPersonalRecord) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const [result] = await db.insert(personalRecords).values(data);
  return Number(result.insertId);
}

export async function updatePersonalRecord(id: number, data: Partial<InsertPersonalRecord>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(personalRecords).set(data).where(eq(personalRecords.id, id));
}

// Utility Functions
export function calculate1RM(weight: number, reps: number): number {
  if (reps === 1) return weight;
  return weight * (1 + reps / 30);
}

export function calculateTotalVolume(sets: Array<{ weight: number; reps: number; completed: boolean }>): number {
  return sets.reduce((total, set) => {
    if (set.completed) {
      return total + set.weight * set.reps;
    }
    return total;
  }, 0);
}

export function calculateBMR(weight: number, height: number, age: number, gender: "male" | "female" | "other"): number {
  if (gender === "male") {
    return 88.362 + 13.397 * weight + 4.799 * height - 5.677 * age;
  } else if (gender === "female") {
    return 447.593 + 9.247 * weight + 3.098 * height - 4.33 * age;
  } else {
    return 88.362 + 13.397 * weight + 4.799 * height - 5.677 * age;
  }
}
