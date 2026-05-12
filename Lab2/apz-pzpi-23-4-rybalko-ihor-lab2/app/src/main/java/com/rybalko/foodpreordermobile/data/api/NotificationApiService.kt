package com.rybalko.foodpreordermobile.data.api

import retrofit2.Response
import retrofit2.http.GET
import retrofit2.http.Header
import retrofit2.http.POST
import retrofit2.http.Path

interface NotificationApiService {
    @GET("api/Notifications")
    suspend fun getMyNotifications(@Header("Authorization") token: String): Response<List<NotificationDto>>

    @POST("api/Notifications/read/{id}")
    suspend fun markAsRead(@Header("Authorization") token: String, @Path("id") id: Int): Response<Unit>
}
