package com.rybalko.foodpreordermobile.data.repository

import com.rybalko.foodpreordermobile.data.api.RetrofitClient
import com.rybalko.foodpreordermobile.data.model.RestaurantDto
import retrofit2.Response

class RestaurantRepository {
    private val restaurantService = RetrofitClient.restaurantService

    suspend fun getRestaurants(lat: Double? = null, lon: Double? = null): Response<List<RestaurantDto>> {
        return restaurantService.getRestaurants(lat, lon)
    }

    suspend fun getRestaurant(id: Int): Response<RestaurantDto> {
        return restaurantService.getRestaurant(id)
    }
}
