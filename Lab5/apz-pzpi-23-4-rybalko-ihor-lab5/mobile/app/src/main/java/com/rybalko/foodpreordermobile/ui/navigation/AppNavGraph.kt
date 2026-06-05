package com.rybalko.foodpreordermobile.ui.navigation

import androidx.compose.runtime.*
import androidx.compose.ui.platform.LocalContext
import androidx.lifecycle.viewmodel.compose.viewModel
import androidx.navigation.NavType
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.rememberNavController
import androidx.navigation.navArgument
import com.rybalko.foodpreordermobile.data.SessionManager
import com.rybalko.foodpreordermobile.ui.screens.*
import com.rybalko.foodpreordermobile.ui.viewmodel.MenuViewModel
import com.rybalko.foodpreordermobile.ui.viewmodel.OrderViewModel
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.launch

@Composable
fun AppNavGraph() {
    val navController = rememberNavController()
    val context = LocalContext.current
    val sessionManager = remember { SessionManager(context) }
    val scope = rememberCoroutineScope()

    // Shared ViewModels across screens (cart + order)
    val menuViewModel: MenuViewModel = viewModel()
    val orderViewModel: OrderViewModel = viewModel()

    // Observe session for current token/name
    val token by sessionManager.tokenFlow.collectAsState(initial = null)
    val userName by sessionManager.nameFlow.collectAsState(initial = "")

    // Current restaurantId stored between menu & cart
    var currentRestaurantId by remember { mutableIntStateOf(-1) }
    var currentRestaurantName by remember { mutableStateOf("") }
    var currentRestaurantActive by remember { mutableStateOf(true) }

    NavHost(navController = navController, startDestination = Screen.Splash.route) {

        composable(Screen.Splash.route) {
            SplashScreen(onNavigate = { hasToken ->
                val dest = if (hasToken) Screen.Home.route else Screen.Login.route
                navController.navigate(dest) { popUpTo(Screen.Splash.route) { inclusive = true } }
            })
        }

        composable(Screen.Login.route) {
            LoginScreen(
                onLoginSuccess = { t, role, name, email ->
                    scope.launch {
                        sessionManager.saveSession(t, role, name, email)
                        navController.navigate(Screen.Home.route) {
                            popUpTo(Screen.Login.route) { inclusive = true }
                        }
                    }
                },
                onNavigateToRegister = { navController.navigate(Screen.Register.route) },
                onNavigateToForgotPassword = { navController.navigate("forgot_password") }
            )
        }

        composable("forgot_password") {
            ForgotPasswordScreen(
                onBack = { navController.popBackStack() }
            )
        }

        composable(Screen.Register.route) {
            RegisterScreen(
                onRegisterSuccess = {
                    navController.navigate(Screen.Login.route) {
                        popUpTo(Screen.Register.route) { inclusive = true }
                    }
                },
                onNavigateToLogin = { navController.popBackStack() }
            )
        }

        composable(Screen.Home.route) {
            HomeScreen(
                userName = userName ?: "Гість",
                onRestaurantClick = { restaurantId, restaurantName, isActive ->
                    currentRestaurantId = restaurantId
                    currentRestaurantName = restaurantName
                    currentRestaurantActive = isActive
                    navController.navigate(Screen.RestaurantMenu.createRoute(restaurantId))
                },
                onCartClick = { navController.navigate(Screen.Cart.route) },
                onHistoryClick = { navController.navigate(Screen.OrderHistory.route) },
                onProfileClick = { navController.navigate(Screen.Profile.route) },
                onNotificationsClick = { navController.navigate("notifications") }
            )
        }

        composable(Screen.Profile.route) {
            ProfileScreen(
                token = token ?: "",
                onBack = { navController.popBackStack() },
                onLogout = {
                    scope.launch {
                        sessionManager.clearSession()
                        menuViewModel.clearCart()
                        navController.navigate(Screen.Login.route) {
                            popUpTo(0) { inclusive = true }
                        }
                    }
                }
            )
        }

        composable(
            route = Screen.RestaurantMenu.route,
            arguments = listOf(navArgument("restaurantId") { type = NavType.IntType })
        ) { backStackEntry ->
            val restaurantId = backStackEntry.arguments?.getInt("restaurantId") ?: return@composable
            currentRestaurantId = restaurantId
            MenuScreen(
                token = token ?: "",
                restaurantId = restaurantId,
                restaurantName = currentRestaurantName.ifBlank { "Меню" },
                isRestaurantActive = currentRestaurantActive,
                onBack = { navController.popBackStack() },
                onCartClick = { navController.navigate(Screen.Cart.route) },
                menuViewModel = menuViewModel
            )
        }

        composable(Screen.Cart.route) {
            CartScreen(
                token = token ?: "",
                restaurantId = currentRestaurantId,
                onBack = { navController.popBackStack() },
                onOrderCreated = { orderId ->
                    navController.navigate(Screen.OrderTracking.createRoute(orderId)) {
                        popUpTo(Screen.Home.route)
                    }
                },
                menuViewModel = menuViewModel,
                orderViewModel = orderViewModel
            )
        }

        composable(
            route = Screen.OrderTracking.route,
            arguments = listOf(navArgument("orderId") { type = NavType.IntType })
        ) { backStackEntry ->
            val orderId = backStackEntry.arguments?.getInt("orderId") ?: return@composable
            OrderTrackingScreen(
                token = token ?: "",
                orderId = orderId,
                onBack = { navController.navigate(Screen.Home.route) { popUpTo(0) { inclusive = true } } },
                onNavigateToPayment = { id -> navController.navigate(Screen.Payment.createRoute(id)) },
                viewModel = orderViewModel
            )
        }

        composable(
            route = Screen.Payment.route,
            arguments = listOf(navArgument("orderId") { type = NavType.IntType })
        ) { backStackEntry ->
            val orderId = backStackEntry.arguments?.getInt("orderId") ?: return@composable
            PaymentScreen(
                token = token ?: "",
                orderId = orderId,
                onBack = { navController.popBackStack() },
                onPaymentSuccess = {
                    navController.popBackStack() // Повертаємось на екран трекінгу після успішної оплати
                }
            )
        }

        composable(Screen.OrderHistory.route) {
            OrderHistoryScreen(
                token = token ?: "",
                onBack = { navController.popBackStack() },
                onOrderClick = { orderId -> navController.navigate(Screen.OrderTracking.createRoute(orderId)) },
                viewModel = orderViewModel
            )
        }

        composable("notifications") {
            NotificationsScreen(
                token = token ?: "",
                onBack = { navController.popBackStack() }
            )
        }
    }
}
