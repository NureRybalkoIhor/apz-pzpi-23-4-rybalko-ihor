package com.rybalko.foodpreordermobile.data.repository

import com.rybalko.foodpreordermobile.data.api.RetrofitClient
import com.rybalko.foodpreordermobile.data.model.DishDto
import retrofit2.Response

class DishRepository {
    private val dishService = RetrofitClient.dishService

    suspend fun getDishes(token: String, categoryId: Int? = null): Response<List<DishDto>> {
        return dishService.getDishes("Bearer $token", categoryId)
    }

    suspend fun getDish(token: String, id: Int): Response<DishDto> {
        return dishService.getDish("Bearer $token", id)
    }

    suspend fun getCategories(token: String, restaurantId: Int? = null): Response<List<com.rybalko.foodpreordermobile.data.model.CategoryDto>> {
        return dishService.getCategories("Bearer $token", restaurantId)
    }
}
