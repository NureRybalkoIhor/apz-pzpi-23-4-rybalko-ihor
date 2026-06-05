package com.rybalko.foodpreordermobile

import android.os.Bundle
import android.os.Build
import android.Manifest
import android.content.pm.PackageManager
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.activity.result.contract.ActivityResultContracts
import androidx.core.content.ContextCompat
import androidx.lifecycle.lifecycleScope
import com.rybalko.foodpreordermobile.data.SessionManager
import com.rybalko.foodpreordermobile.data.api.RetrofitClient
import com.rybalko.foodpreordermobile.notifications.NotificationService
import com.rybalko.foodpreordermobile.ui.navigation.AppNavGraph
import com.rybalko.foodpreordermobile.ui.theme.FoodPreOrderMobileTheme
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.firstOrNull
import kotlinx.coroutines.launch

class MainActivity : ComponentActivity() {

    private val requestPermissionLauncher = registerForActivityResult(
        ActivityResultContracts.RequestPermission()
    ) {}

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            if (ContextCompat.checkSelfPermission(this, Manifest.permission.POST_NOTIFICATIONS) != PackageManager.PERMISSION_GRANTED) {
                requestPermissionLauncher.launch(Manifest.permission.POST_NOTIFICATIONS)
            }
        }

        val sessionManager = SessionManager(this)
        val notificationService = NotificationService(this)

        lifecycleScope.launch {
            while (true) {
                delay(15000)
                val token = sessionManager.tokenFlow.firstOrNull()
                if (!token.isNullOrEmpty()) {
                    try {
                        val response = RetrofitClient.notificationService.getMyNotifications("Bearer $token")
                        if (response.isSuccessful) {
                            val notifications = response.body() ?: emptyList()
                            val unread = notifications.filter { !it.isRead }
                            for (notification in unread) {
                                notificationService.showNotification(
                                    id = notification.id,
                                    title = "FoodPreOrder",
                                    message = notification.message
                                )
                                RetrofitClient.notificationService.markAsRead("Bearer $token", notification.id)
                            }
                        }
                    } catch (e: Exception) {
                        // ignore network errors
                    }
                }
            }
        }

        setContent {
            FoodPreOrderMobileTheme {
                AppNavGraph()
            }
        }
    }
}