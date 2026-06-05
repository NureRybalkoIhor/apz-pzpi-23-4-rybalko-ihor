package com.rybalko.foodpreordermobile.data.model

import com.google.gson.annotations.SerializedName

data class OrderItemDto(
    @SerializedName("id") val id: Int,
    @SerializedName("dishId") val dishId: Int,
    @SerializedName("dishName") val dishName: String,
    @SerializedName("quantity") val quantity: Int,
    @SerializedName("price") val price: Double
)

data class OrderDto(
    @SerializedName("id") val id: Int,
    @SerializedName("createdAt") val createdAt: String,
    @SerializedName("visitTime") val visitTime: String,
    @SerializedName("status") val status: String,
    @SerializedName("totalAmount") val totalAmount: Double,
    @SerializedName("comment") val comment: String?,
    @SerializedName("restaurantId") val restaurantId: Int,
    @SerializedName("userId") val userId: Int,
    @SerializedName("userName") val userName: String,
    @SerializedName("items") val items: List<OrderItemDto>
)

data class CreateOrderItemDto(
    @SerializedName("dishId") val dishId: Int,
    @SerializedName("quantity") val quantity: Int
)

data class CreateOrderDto(
    @SerializedName("restaurantId") val restaurantId: Int,
    @SerializedName("visitTime") val visitTime: String,
    @SerializedName("comment") val comment: String?,
    @SerializedName("items") val items: List<CreateOrderItemDto>
)
