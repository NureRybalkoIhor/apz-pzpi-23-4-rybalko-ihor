package com.rybalko.foodpreordermobile.data.model

import com.google.gson.annotations.SerializedName

data class CategoryDto(
    @SerializedName("id") val id: Int,
    @SerializedName("nameUA") val nameUA: String,
    @SerializedName("nameEN") val nameEN: String,
    @SerializedName("restaurantId") val restaurantId: Int?
)
