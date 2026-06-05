package com.rybalko.foodpreordermobile.data.model

import com.google.gson.annotations.SerializedName

data class RestaurantDto(
    @SerializedName("id") val id: Int,
    @SerializedName("nameUA") val nameUA: String,
    @SerializedName("nameEN") val nameEN: String,
    @SerializedName("address") val address: String,
    @SerializedName("imageUrl") val imageUrl: String?,
    @SerializedName("latitude") val latitude: Double,
    @SerializedName("longitude") val longitude: Double,
    @SerializedName("isActive") val isActive: Boolean,
    @SerializedName("ownerId") val ownerId: Int,
    @SerializedName("owner") val owner: OwnerDto?
)

data class OwnerDto(
    @SerializedName("id") val id: Int,
    @SerializedName("fullName") val fullName: String,
    @SerializedName("email") val email: String
)
