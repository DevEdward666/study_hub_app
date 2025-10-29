import { apiClient } from "./api.client";
import { ApiResponseSchema } from "../schema/api.schema";
import {
  Rate,
  CreateRateRequest,
  UpdateRateRequest,
  RateSchema,
} from "../schema/rate.schema";
import { z } from "zod";

const RateListResponseSchema = ApiResponseSchema(z.array(RateSchema));
const RateResponseSchema = ApiResponseSchema(RateSchema);
const BooleanResponseSchema = ApiResponseSchema(z.boolean());

class RateService {
  /**
   * Get all rates (admin only)
   */
  async getAllRates(): Promise<Rate[]> {
    return apiClient.get("/rates", RateListResponseSchema);
  }

  /**
   * Get active rates (public)
   */
  async getActiveRates(): Promise<Rate[]> {
    return apiClient.get("/rates/active", RateListResponseSchema);
  }

  /**
   * Get rate by ID
   */
  async getRateById(id: string): Promise<Rate> {
    return apiClient.get(`/rates/${id}`, RateResponseSchema);
  }

  /**
   * Get rate by hours
   */
  async getRateByHours(hours: number): Promise<Rate> {
    return apiClient.get(`/rates/hours/${hours}`, RateResponseSchema);
  }

  /**
   * Create a new rate (admin only)
   */
  async createRate(request: CreateRateRequest): Promise<Rate> {
    return apiClient.post("/rates", RateResponseSchema, request);
  }

  /**
   * Update an existing rate (admin only)
   */
  async updateRate(request: UpdateRateRequest): Promise<Rate> {
    return apiClient.put("/rates", RateResponseSchema, request);
  }

  /**
   * Delete a rate (admin only)
   */
  async deleteRate(id: string): Promise<boolean> {
    return apiClient.delete(`/rates/${id}`, BooleanResponseSchema);
  }
}

export const rateService = new RateService();
export default rateService;

