import { getDb } from "../server/db";
import { exercises } from "../drizzle/schema";

const presetExercises = [
  // 胸 (Chest)
  { name: "ベンチプレス", part: "chest", equipmentType: "barbell", isPreset: true, description: "胸の基本種目" },
  { name: "インクラインベンチプレス", part: "chest", equipmentType: "barbell", isPreset: true, description: "上部胸を鍛える" },
  { name: "ダンベルプレス", part: "chest", equipmentType: "dumbbell", isPreset: true, description: "可動域が広い胸トレ" },
  { name: "ダンベルフライ", part: "chest", equipmentType: "dumbbell", isPreset: true, description: "胸のストレッチ種目" },
  { name: "チェストプレスマシン", part: "chest", equipmentType: "machine", isPreset: true, description: "安全に胸を鍛える" },
  { name: "プッシュアップ", part: "chest", equipmentType: "bodyweight", isPreset: true, description: "自重での胸トレ" },

  // 背中 (Back)
  { name: "デッドリフト", part: "back", equipmentType: "barbell", isPreset: true, description: "背中全体を鍛える" },
  { name: "ベントオーバーロウ", part: "back", equipmentType: "barbell", isPreset: true, description: "背中の厚みを作る" },
  { name: "ダンベルロウ", part: "back", equipmentType: "dumbbell", isPreset: true, description: "片側ずつ背中を鍛える" },
  { name: "ラットプルダウン", part: "back", equipmentType: "machine", isPreset: true, description: "背中の広がりを作る" },
  { name: "シーテッドロウ", part: "back", equipmentType: "machine", isPreset: true, description: "背中の中部を鍛える" },
  { name: "チンニング(懸垂)", part: "back", equipmentType: "bodyweight", isPreset: true, description: "自重での背中トレ" },

  // 脚 (Legs)
  { name: "スクワット", part: "legs", equipmentType: "barbell", isPreset: true, description: "脚全体を鍛える王道種目" },
  { name: "レッグプレス", part: "legs", equipmentType: "machine", isPreset: true, description: "安全に脚を鍛える" },
  { name: "レッグエクステンション", part: "legs", equipmentType: "machine", isPreset: true, description: "大腿四頭筋を集中的に" },
  { name: "レッグカール", part: "legs", equipmentType: "machine", isPreset: true, description: "ハムストリングスを鍛える" },
  { name: "ブルガリアンスクワット", part: "legs", equipmentType: "dumbbell", isPreset: true, description: "片脚ずつ鍛える" },
  { name: "ランジ", part: "legs", equipmentType: "bodyweight", isPreset: true, description: "自重での脚トレ" },

  // 肩 (Shoulders)
  { name: "ショルダープレス", part: "shoulders", equipmentType: "barbell", isPreset: true, description: "肩全体を鍛える" },
  { name: "ダンベルショルダープレス", part: "shoulders", equipmentType: "dumbbell", isPreset: true, description: "可動域が広い肩トレ" },
  { name: "サイドレイズ", part: "shoulders", equipmentType: "dumbbell", isPreset: true, description: "肩の横を鍛える" },
  { name: "フロントレイズ", part: "shoulders", equipmentType: "dumbbell", isPreset: true, description: "肩の前を鍛える" },
  { name: "リアレイズ", part: "shoulders", equipmentType: "dumbbell", isPreset: true, description: "肩の後ろを鍛える" },

  // 腕 (Arms)
  { name: "バーベルカール", part: "arms", equipmentType: "barbell", isPreset: true, description: "上腕二頭筋を鍛える" },
  { name: "ダンベルカール", part: "arms", equipmentType: "dumbbell", isPreset: true, description: "片腕ずつ二頭筋を鍛える" },
  { name: "ハンマーカール", part: "arms", equipmentType: "dumbbell", isPreset: true, description: "前腕も鍛えるカール" },
  { name: "トライセプスエクステンション", part: "arms", equipmentType: "dumbbell", isPreset: true, description: "上腕三頭筋を鍛える" },
  { name: "ディップス", part: "arms", equipmentType: "bodyweight", isPreset: true, description: "自重での三頭筋トレ" },

  // 腹 (Abs)
  { name: "クランチ", part: "abs", equipmentType: "bodyweight", isPreset: true, description: "腹筋の基本種目" },
  { name: "レッグレイズ", part: "abs", equipmentType: "bodyweight", isPreset: true, description: "下腹部を鍛える" },
  { name: "プランク", part: "abs", equipmentType: "bodyweight", isPreset: true, description: "体幹を鍛える" },
  { name: "アブローラー", part: "abs", equipmentType: "machine", isPreset: true, description: "腹筋全体を鍛える" },

  // 有酸素 (Cardio)
  { name: "トレッドミル", part: "cardio", equipmentType: "machine", isPreset: true, description: "ランニングマシン" },
  { name: "エアロバイク", part: "cardio", equipmentType: "machine", isPreset: true, description: "自転車マシン" },
  { name: "クロストレーナー", part: "cardio", equipmentType: "machine", isPreset: true, description: "全身有酸素運動" },
  { name: "ランニング", part: "cardio", equipmentType: "bodyweight", isPreset: true, description: "屋外ランニング" },
];

async function seedExercises() {
  console.log("Starting to seed preset exercises...");
  
  const db = await getDb();
  if (!db) {
    console.error("Database not available");
    process.exit(1);
  }

  try {
    // Insert all preset exercises
    for (const exercise of presetExercises) {
      await db.insert(exercises).values(exercise as any);
      console.log(`✓ Inserted: ${exercise.name}`);
    }

    console.log(`\n✅ Successfully seeded ${presetExercises.length} preset exercises!`);
    process.exit(0);
  } catch (error) {
    console.error("Error seeding exercises:", error);
    process.exit(1);
  }
}

seedExercises();
