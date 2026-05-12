package com.rybalko.foodpreordermobile.data.api

import com.rybalko.foodpreordermobile.data.model.DishDto
import retrofit2.Response
import retrofit2.http.GET
import retrofit2.http.Header
import retrofit2.http.Path
import retrofit2.http.Query

interface DishApiService {
    @GET("api/Dishes")
    suspend fun getDishes(
        @Header("Authorization") token: String,
        @Query("categoryId") categoryId: Int? = null
    ): Response<List<DishDto>>

    @GET("api/Dishes/{id}")
    suspend fun getDish(
        @Header("Authorization") token: String,
        @Path("id") id: Int
    ): Response<DishDto>

    @GET("api/Categories")
    suspend fun getCategories(
        @Header("Authorization") token: String,
        @Query("restaurantId") restaurantId: Int? = null
    ): Response<List<com.rybalko.foodpreordermobile.data.model.CategoryDto>>
}
