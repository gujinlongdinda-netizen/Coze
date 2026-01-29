import { eq, desc } from "drizzle-orm";
import { getDb } from "coze-coding-dev-sdk";
import {
  textProcessingRecords,
  insertTextProcessingRecordSchema,
} from "./shared/schema";
import type { TextProcessingRecord, InsertTextProcessingRecord } from "./shared/schema";

export class TextProcessingManager {
  async createTextProcessingRecord(
    data: InsertTextProcessingRecord
  ): Promise<TextProcessingRecord> {
    const db = await getDb();
    const validated = insertTextProcessingRecordSchema.parse(data);
    const [record] = await db
      .insert(textProcessingRecords)
      .values(validated)
      .returning();
    return record;
  }

  async updateTextProcessingRecord(
    id: string,
    processedText: string
  ): Promise<TextProcessingRecord | null> {
    const db = await getDb();
    const [record] = await db
      .update(textProcessingRecords)
      .set({ processedText })
      .where(eq(textProcessingRecords.id, id))
      .returning();
    return record || null;
  }

  async getTextProcessingRecordsByUserId(
    userId: string
  ): Promise<TextProcessingRecord[]> {
    const db = await getDb();
    return db
      .select()
      .from(textProcessingRecords)
      .where(eq(textProcessingRecords.userId, userId))
      .orderBy(desc(textProcessingRecords.createdAt));
  }

  async getTextProcessingRecordById(
    id: string
  ): Promise<TextProcessingRecord | null> {
    const db = await getDb();
    const [record] = await db
      .select()
      .from(textProcessingRecords)
      .where(eq(textProcessingRecords.id, id));
    return record || null;
  }
}

export const textProcessingManager = new TextProcessingManager();
