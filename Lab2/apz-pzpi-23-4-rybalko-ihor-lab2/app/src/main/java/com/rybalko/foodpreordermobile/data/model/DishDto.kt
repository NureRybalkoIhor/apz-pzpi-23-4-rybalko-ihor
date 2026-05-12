package com.rybalko.foodpreordermobile.data.model

import com.google.gson.annotations.SerializedName

data class DishDto(
    @SerializedName("id") val id: Int,
    @SerializedName("nameUA") val nameUA: String,
    @SerializedName("nameEN") val nameEN: String,
    @SerializedName("descriptionUA") val descriptionUA: String?,
    @SerializedName("descriptionEN") val descriptionEN: String?,
    @SerializedName("price") val price: Double,
    @SerializedName("imageUrl") val imageUrl: String?,
    @SerializedName("preparationTimeMinutes") val preparationTimeMinutes: Int,
    @SerializedName("isAvailable") val isAvailable: Boolean,
    @SerializedName("categoryId") val categoryId: Int,
    @SerializedName("categoryNameUA") val categoryNameUA: String?
)
