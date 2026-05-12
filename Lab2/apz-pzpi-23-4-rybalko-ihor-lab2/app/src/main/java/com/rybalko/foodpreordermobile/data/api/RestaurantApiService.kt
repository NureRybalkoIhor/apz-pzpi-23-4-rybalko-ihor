package com.rybalko.foodpreordermobile.data.api

import com.rybalko.foodpreordermobile.data.model.RestaurantDto
import retrofit2.Response
import retrofit2.http.GET
import retrofit2.http.Path
import retrofit2.http.Query

interface RestaurantApiService {
    @GET("api/Restaurants")
    suspend fun getRestaurants(
        @Query("userLat") lat: Double? = null,
        @Query("userLon") lon: Double? = null
    ): Response<List<RestaurantDto>>

    @GET("api/Restaurants/{id}")
    suspend fun getRestaurant(@Path("id") id: Int): Response<RestaurantDto>
}
