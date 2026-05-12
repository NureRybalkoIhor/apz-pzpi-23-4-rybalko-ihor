package com.rybalko.foodpreordermobile.ui.navigation

sealed class Screen(val route: String) {
    object Splash : Screen("splash")
    object Login : Screen("login")
    object Register : Screen("register")
    object Home : Screen("home")
    object RestaurantMenu : Screen("restaurant_menu/{restaurantId}") {
        fun createRoute(restaurantId: Int) = "restaurant_menu/$restaurantId"
    }
    object Cart : Screen("cart")
    object OrderTracking : Screen("order_tracking/{orderId}") {
        fun createRoute(orderId: Int) = "order_tracking/$orderId"
    }
    object OrderHistory : Screen("order_history")
    object Profile : Screen("profile")
    object Payment : Screen("payment/{orderId}") {
        fun createRoute(orderId: Int) = "payment/$orderId"
    }
}
