package com.rybalko.foodpreordermobile.data.api

data class NotificationDto(
    val id: Int,
    val message: String,
    val dateSent: String,
    val isRead: Boolean
)
