package com.rybalko.foodpreordermobile.data.model

data class CartItem(
    val dishId: Int,
    val nameUA: String,
    val nameEN: String,
    val price: Double,
    val imageUrl: String?,
    val preparationTimeMinutes: Int = 0,
    val quantity: Int = 1
) {
    val totalPrice: Double get() = price * quantity
}
