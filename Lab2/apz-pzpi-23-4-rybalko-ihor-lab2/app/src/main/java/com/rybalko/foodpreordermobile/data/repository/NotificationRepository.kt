package com.rybalko.foodpreordermobile.data.repository

import com.rybalko.foodpreordermobile.data.api.NotificationApiService
import com.rybalko.foodpreordermobile.data.api.NotificationDto
import com.rybalko.foodpreordermobile.data.api.RetrofitClient
import retrofit2.Response

class NotificationRepository {
    private val service: NotificationApiService = RetrofitClient.notificationService

    suspend fun getNotifications(token: String): Response<List<NotificationDto>> =
        service.getMyNotifications("Bearer $token")

    suspend fun markAsRead(token: String, id: Int): Response<Unit> =
        service.markAsRead("Bearer $token", id)
}
