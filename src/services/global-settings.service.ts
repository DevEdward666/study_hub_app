import { z } from "zod";
import { apiClient } from "./api.client";
import { ApiResponseSchema } from "../schema/api.schema";

// ============= Schemas =============

export const GlobalSettingSchema = z.object({
  id: z.string().uuid(),
  key: z.string(),
  value: z.string(),
  description: z.string().nullable(),
  dataType: z.string(),
  category: z.string(),
  isPublic: z.boolean(),
  isEncrypted: z.boolean(),
  validationRegex: z.string().nullable(),
  defaultValue: z.string().nullable(),
  minValue: z.number().nullable(),
  maxValue: z.number().nullable(),
  allowedValues: z.string().nullable(),
  updatedBy: z.string().uuid().nullable(),
  updatedByEmail: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const GlobalSettingHistorySchema = z.object({
  id: z.string().uuid(),
  settingId: z.string().uuid(),
  key: z.string(),
  oldValue: z.string().nullable(),
  newValue: z.string(),
  changedBy: z.string().uuid(),
  changedByEmail: z.string(),
  changedAt: z.string(),
  changeReason: z.string().nullable(),
});

export const ValidateSettingResponseSchema = z.object({
  isValid: z.boolean(),
  errorMessage: z.string().nullable(),
  suggestedValue: z.string().nullable(),
});

// ============= Types =============

export type GlobalSetting = z.infer<typeof GlobalSettingSchema>;
export type GlobalSettingHistory = z.infer<typeof GlobalSettingHistorySchema>;
export type ValidateSettingResponse = z.infer<typeof ValidateSettingResponseSchema>;

export interface CreateGlobalSettingRequest {
  key: string;
  value: string;
  description?: string;
  dataType?: string;
  category?: string;
  isPublic?: boolean;
  isEncrypted?: boolean;
  validationRegex?: string;
  defaultValue?: string;
  minValue?: number;
  maxValue?: number;
  allowedValues?: string;
}

export interface UpdateGlobalSettingRequest {
  id: string;
  value: string;
  changeReason?: string;
}

export interface BulkUpdateSettingsRequest {
  settings: Record<string, string>;
  changeReason?: string;
}

export interface ValidateSettingRequest {
  key: string;
  value: string;
}

// ============= API Response Schemas =============
// Using standard ApiResponseSchema from api.schema.ts

// ============= Service Class =============

class GlobalSettingsService {
  private baseUrl = "admin/settings";

  /**
   * Get all global settings
   */
  async getAllSettings(): Promise<GlobalSetting[]> {
    return apiClient.get(this.baseUrl, ApiResponseSchema(z.array(GlobalSettingSchema)));
  }

  /**
   * Get setting by ID
   */
  async getSettingById(settingId: string): Promise<GlobalSetting> {
    return apiClient.get(
      `${this.baseUrl}/${settingId}`,
      ApiResponseSchema(GlobalSettingSchema)
    );
  }

  /**
   * Get setting by key
   */
  async getSettingByKey(key: string): Promise<GlobalSetting> {
    return apiClient.get(
      `${this.baseUrl}/key/${encodeURIComponent(key)}`,
      ApiResponseSchema(GlobalSettingSchema)
    );
  }

  /**
   * Get settings by category
   */
  async getSettingsByCategory(category: string): Promise<GlobalSetting[]> {
    return apiClient.get(
      `${this.baseUrl}/category/${encodeURIComponent(category)}`,
      ApiResponseSchema(z.array(GlobalSettingSchema))
    );
  }

  /**
   * Create a new setting
   */
  async createSetting(
    request: CreateGlobalSettingRequest
  ): Promise<GlobalSetting> {
    return apiClient.post(
      `${this.baseUrl}/create`,
      ApiResponseSchema(GlobalSettingSchema),
      request
    );
  }

  /**
   * Update a setting value
   */
  async updateSetting(
    request: UpdateGlobalSettingRequest
  ): Promise<GlobalSetting> {
    return apiClient.put(
      `${this.baseUrl}/update`,
      ApiResponseSchema(GlobalSettingSchema),
      request
    );
  }

  /**
   * Validate a setting value before saving
   */
  async validateSetting(
    request: ValidateSettingRequest
  ): Promise<ValidateSettingResponse> {
    return apiClient.post(
      `${this.baseUrl}/validate`,
      ApiResponseSchema(ValidateSettingResponseSchema),
      request
    );
  }

  /**
   * Get setting change history
   */
  async getSettingHistory(settingId: string): Promise<GlobalSettingHistory[]> {
    return apiClient.get(
      `${this.baseUrl}/${settingId}/history`,
      ApiResponseSchema(z.array(GlobalSettingHistorySchema))
    );
  }

  /**
   * Get recent setting changes
   */
  async getRecentChanges(count: number = 50): Promise<GlobalSettingHistory[]> {
    return apiClient.get(
      `${this.baseUrl}/changes/recent?count=${count}`,
      ApiResponseSchema(z.array(GlobalSettingHistorySchema))
    );
  }

  /**
   * Helper: Get setting value by key
   */
  async getSettingValue(key: string): Promise<string> {
    const setting = await this.getSettingByKey(key);
    return setting.value;
  }

  /**
   * Helper: Update setting by key
   */
  async updateSettingByKey(
    key: string,
    value: string,
    changeReason?: string
  ): Promise<GlobalSetting> {
    const setting = await this.getSettingByKey(key);
    return this.updateSetting({
      id: setting.id,
      value,
      changeReason,
    });
  }
}

export const globalSettingsService = new GlobalSettingsService();
export default globalSettingsService;

