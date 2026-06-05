package com.rybalko.foodpreordermobile.data.api

import retrofit2.Retrofit
import retrofit2.converter.gson.GsonConverterFactory

object RetrofitClient {
    private const val BASE_URL = "http://10.0.2.2:5082/"

    private val retrofit: Retrofit by lazy {
        Retrofit.Builder()
            .baseUrl(BASE_URL)
            .addConverterFactory(GsonConverterFactory.create())
            .build()
    }

    val authService: AuthApiService by lazy {
        retrofit.create(AuthApiService::class.java)
    }

    val restaurantService: RestaurantApiService by lazy {
        retrofit.create(RestaurantApiService::class.java)
    }

    val dishService: DishApiService by lazy {
        retrofit.create(DishApiService::class.java)
    }

    val orderService: OrderApiService by lazy {
        retrofit.create(OrderApiService::class.java)
    }

    val notificationService: NotificationApiService by lazy {
        retrofit.create(NotificationApiService::class.java)
    }
}
