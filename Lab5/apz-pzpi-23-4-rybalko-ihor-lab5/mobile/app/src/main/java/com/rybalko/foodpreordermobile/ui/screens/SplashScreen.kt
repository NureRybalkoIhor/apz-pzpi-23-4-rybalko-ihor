package com.rybalko.foodpreordermobile.ui.screens

import androidx.compose.animation.core.*
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.material3.Text
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.scale
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.rybalko.foodpreordermobile.data.SessionManager
import com.rybalko.foodpreordermobile.data.api.RetrofitClient
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.firstOrNull

@Composable
fun SplashScreen(onNavigate: (Boolean) -> Unit) {
    val scale = remember { Animatable(0f) }
    val context = LocalContext.current
    val sessionManager = remember { SessionManager(context) }

    LaunchedEffect(Unit) {
        scale.animateTo(
            targetValue = 1f,
            animationSpec = spring(dampingRatio = Spring.DampingRatioMediumBouncy)
        )
        delay(1200)
        val savedToken = sessionManager.tokenFlow.firstOrNull()
        if (savedToken.isNullOrEmpty()) {
            onNavigate(false)
        } else {
            val isValid = try {
                val response = RetrofitClient.authService.getMe("Bearer $savedToken")
                response.isSuccessful
            } catch (e: Exception) {
                false
            }
            if (!isValid) {
                sessionManager.clearSession()
            }
            onNavigate(isValid)
        }
    }

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(
                Brush.verticalGradient(
                    colors = listOf(Color(0xFF1A1A2E), Color(0xFF16213E), Color(0xFF0F3460))
                )
            ),
        contentAlignment = Alignment.Center
    ) {
        Column(
            horizontalAlignment = Alignment.CenterHorizontally,
            modifier = Modifier.scale(scale.value)
        ) {
            Text(text = "🍽️", fontSize = 80.sp)
            Spacer(modifier = Modifier.height(20.dp))
            Text(
                text = "FoodPreOrder",
                fontSize = 36.sp,
                fontWeight = FontWeight.Bold,
                color = Color(0xFFE94560)
            )
            Spacer(modifier = Modifier.height(8.dp))
            Text(
                text = "Замовляй заздалегідь",
                fontSize = 15.sp,
                color = Color(0xFF8892B0)
            )
        }
    }
}
