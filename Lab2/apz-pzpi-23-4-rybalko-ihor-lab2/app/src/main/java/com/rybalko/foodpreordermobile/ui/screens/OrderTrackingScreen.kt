package com.rybalko.foodpreordermobile.ui.screens

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.core.*
import androidx.compose.animation.fadeIn
import androidx.compose.animation.slideInVertically
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.scale
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.rybalko.foodpreordermobile.ui.viewmodel.OrderState
import com.rybalko.foodpreordermobile.ui.viewmodel.OrderViewModel

private val DarkBg6 = Color(0xFF1A1A2E)
private val Accent6 = Color(0xFFE94560)
private val TextSecondary6 = Color(0xFF8892B0)
private val SurfaceCard6 = Color(0xFF1E2A45)

private fun statusInfo(status: String): Triple<String, Color, String> = when (status) {
    "Pending"   -> Triple("Очікує підтвердження", Color(0xFFFFB300), "⏳")
    "Paid"      -> Triple("Оплачено", Color(0xFF4CAF50), "✅")
    "Cooking"   -> Triple("Готується 🔥", Color(0xFFFF6B35), "👨‍🍳")
    "Ready"     -> Triple("Готово! Забирайте", Color(0xFF4CAF50), "🎉")
    "Completed" -> Triple("Завершено", Color(0xFF8892B0), "🏁")
    "Cancelled" -> Triple("Скасовано", Color(0xFFFF5252), "❌")
    else        -> Triple(status, Color.White, "📋")
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun OrderTrackingScreen(
    token: String,
    orderId: Int,
    onBack: () -> Unit,
    onNavigateToPayment: (Int) -> Unit,
    viewModel: OrderViewModel = androidx.lifecycle.viewmodel.compose.viewModel()
) {
    val state by viewModel.state.collectAsState()
    val pulse = rememberInfiniteTransition(label = "pulse")
    val pulseScale by pulse.animateFloat(
        initialValue = 0.95f, targetValue = 1.05f, label = "scale",
        animationSpec = infiniteRepeatable(tween(900), RepeatMode.Reverse)
    )

    LaunchedEffect(orderId) { viewModel.trackOrder(token, orderId) }

    var showCancelDialog by remember { mutableStateOf(false) }

    LaunchedEffect(state) {
        if (state is OrderState.CancelSuccess) {
            viewModel.resetState()
            onBack()
        }
    }

    if (showCancelDialog) {
        AlertDialog(
            onDismissRequest = { showCancelDialog = false },
            containerColor = Color(0xFF16213E),
            title = { Text("Скасувати замовлення?", color = Color.White, fontWeight = FontWeight.Bold) },
            text = { Text("Це незворотна дія. Замовлення буде скасовано.", color = TextSecondary6) },
            confirmButton = {
                Button(
                    onClick = {
                        showCancelDialog = false
                        viewModel.cancelOrder(token, orderId)
                    },
                    colors = ButtonDefaults.buttonColors(containerColor = Color(0xFFFF5252))
                ) { Text("Так, скасувати") }
            },
            dismissButton = {
                TextButton(onClick = { showCancelDialog = false }) {
                    Text("Ні, залишити", color = TextSecondary6)
                }
            }
        )
    }

    Scaffold(
        containerColor = DarkBg6,
        topBar = {
            TopAppBar(
                title = { Text("Статус замовлення #$orderId", color = Color.White) },
                navigationIcon = { IconButton(onClick = onBack) { Icon(Icons.Default.ArrowBack, null, tint = Color.White) } },
                colors = TopAppBarDefaults.topAppBarColors(containerColor = DarkBg6)
            )
        },
        bottomBar = {
            if (state is OrderState.Tracking) {
                val order = (state as OrderState.Tracking).order
                if (order.status == "Pending") {
                    Surface(color = Color(0xFF16213E), tonalElevation = 8.dp) {
                        Column(modifier = Modifier.padding(16.dp)) {
                            Button(
                                onClick = { onNavigateToPayment(orderId) },
                                modifier = Modifier.fillMaxWidth().height(52.dp),
                                shape = RoundedCornerShape(14.dp),
                                colors = ButtonDefaults.buttonColors(containerColor = Accent6)
                            ) {
                                Icon(Icons.Default.CreditCard, null, modifier = Modifier.size(18.dp))
                                Spacer(Modifier.width(8.dp))
                                Text("Оплатити", fontWeight = FontWeight.SemiBold, fontSize = 16.sp)
                            }
                            Spacer(Modifier.height(8.dp))
                            OutlinedButton(
                                onClick = { showCancelDialog = true },
                                modifier = Modifier.fillMaxWidth().height(46.dp),
                                shape = RoundedCornerShape(14.dp),
                                colors = ButtonDefaults.outlinedButtonColors(contentColor = Color(0xFFFF5252)),
                                border = androidx.compose.foundation.BorderStroke(1.dp, Color(0xFFFF5252))
                            ) {
                                Icon(Icons.Default.Cancel, null, modifier = Modifier.size(16.dp))
                                Spacer(Modifier.width(6.dp))
                                Text("Скасувати замовлення", fontSize = 14.sp)
                            }
                        }
                    }
                }
            }
        }
    ) { padding ->
        when (state) {
            is OrderState.Loading -> Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                    CircularProgressIndicator(color = Accent6)
                    Spacer(Modifier.height(12.dp))
                    Text("Завантажуємо статус...", color = TextSecondary6)
                }
            }
            is OrderState.Tracking -> {
                val order = (state as OrderState.Tracking).order
                val (statusText, statusColor, emoji) = statusInfo(order.status)
                val isLive = order.status != "Completed" && order.status != "Cancelled"

                LazyColumn(
                    modifier = Modifier.fillMaxSize().padding(padding).padding(horizontal = 16.dp),
                    contentPadding = PaddingValues(vertical = 16.dp),
                    verticalArrangement = Arrangement.spacedBy(16.dp)
                ) {
                    item {
                        AnimatedVisibility(visible = true, enter = fadeIn() + slideInVertically()) {
                            Card(
                                modifier = Modifier.fillMaxWidth(),
                                shape = RoundedCornerShape(24.dp),
                                colors = CardDefaults.cardColors(containerColor = SurfaceCard6)
                            ) {
                                Column(
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .background(
                                            Brush.verticalGradient(listOf(
                                                statusColor.copy(alpha = 0.1f), Color.Transparent
                                            ))
                                        )
                                        .padding(28.dp),
                                    horizontalAlignment = Alignment.CenterHorizontally
                                ) {
                                    Box(
                                        modifier = Modifier
                                            .size(100.dp)
                                            .scale(if (isLive) pulseScale else 1f)
                                            .clip(CircleShape)
                                            .background(statusColor.copy(alpha = 0.18f)),
                                        contentAlignment = Alignment.Center
                                    ) {
                                        Text(emoji, fontSize = 44.sp)
                                    }

                                    Spacer(Modifier.height(16.dp))
                                    Text(statusText, fontSize = 20.sp, fontWeight = FontWeight.Bold, color = statusColor)

                                    if (isLive) {
                                        Spacer(Modifier.height(10.dp))
                                        Row(verticalAlignment = Alignment.CenterVertically) {
                                            Box(Modifier.size(8.dp).clip(CircleShape).background(statusColor))
                                            Spacer(Modifier.width(6.dp))
                                            Text("Оновлюється автоматично", color = TextSecondary6, fontSize = 12.sp)
                                        }
                                    }
                                }
                            }
                        }
                    }

                    item { StatusTimeline(currentStatus = order.status) }

                    item {
                        Card(
                            modifier = Modifier.fillMaxWidth(),
                            colors = CardDefaults.cardColors(containerColor = SurfaceCard6),
                            shape = RoundedCornerShape(18.dp)
                        ) {
                            Column(Modifier.padding(16.dp)) {
                                Row(verticalAlignment = Alignment.CenterVertically) {
                                    Icon(Icons.Default.Restaurant, null, tint = Accent6, modifier = Modifier.size(18.dp))
                                    Spacer(Modifier.width(8.dp))
                                    Text("Деталі замовлення", fontWeight = FontWeight.Bold, color = Color.White, fontSize = 16.sp)
                                }
                                Spacer(Modifier.height(12.dp))
                                order.items.forEach { item ->
                                    Row(Modifier.fillMaxWidth().padding(vertical = 4.dp)) {
                                        Text("• ${item.dishName}", color = Color.White, modifier = Modifier.weight(1f))
                                        Text("×${item.quantity}", color = TextSecondary6)
                                        Spacer(Modifier.width(12.dp))
                                        Text("${(item.price * item.quantity).toInt()} ₴", color = Accent6, fontWeight = FontWeight.Bold)
                                    }
                                }
                                HorizontalDivider(color = Color(0xFF0F3460), modifier = Modifier.padding(vertical = 10.dp))
                                Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                                    Text("Разом", color = Color.White, fontWeight = FontWeight.Bold)
                                    Text("${order.totalAmount.toInt()} ₴", color = Accent6, fontSize = 18.sp, fontWeight = FontWeight.Bold)
                                }
                            }
                        }
                    }
                }
            }
            is OrderState.Error -> ErrorView(
                message = (state as OrderState.Error).message,
                onRetry = { viewModel.trackOrder(token, orderId) }
            )
            else -> {}
        }
    }
}

private val statusSteps = listOf("Pending", "Paid", "Cooking", "Ready", "Completed")

@Composable
fun StatusTimeline(currentStatus: String) {
    val currentIndex = if (currentStatus == "Cancelled") -1 else statusSteps.indexOf(currentStatus).coerceAtLeast(0)

    Card(
        modifier = Modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(containerColor = SurfaceCard6),
        shape = RoundedCornerShape(18.dp)
    ) {
        Column(Modifier.padding(16.dp)) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Icon(Icons.Default.Timeline, null, tint = Accent6, modifier = Modifier.size(18.dp))
                Spacer(Modifier.width(8.dp))
                Text("Прогрес", fontWeight = FontWeight.Bold, color = Color.White, fontSize = 15.sp)
            }
            Spacer(Modifier.height(16.dp))
            val steps = listOf(
                "Очікує" to "⏳",
                "Оплачено" to "💳",
                "Готується" to "👨‍🍳",
                "Готово" to "🎉",
                "Завершено" to "🏁"
            )
            steps.forEachIndexed { index, (label, emoji) ->
                val done = currentIndex >= 0 && index <= currentIndex
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Box(
                        modifier = Modifier.size(36.dp).clip(CircleShape)
                            .background(if (done) Accent6 else Color(0xFF0F3460)),
                        contentAlignment = Alignment.Center
                    ) {
                        Text(if (done) "✓" else emoji, fontSize = if (done) 16.sp else 14.sp, color = Color.White)
                    }
                    Spacer(Modifier.width(12.dp))
                    Text(
                        label,
                        color = if (done) Color.White else TextSecondary6,
                        fontWeight = if (done) FontWeight.Medium else FontWeight.Normal
                    )
                }
                if (index < steps.size - 1) {
                    Box(
                        modifier = Modifier.padding(start = 17.dp).width(2.dp).height(24.dp)
                            .background(if (done && currentIndex > index) Accent6 else Color(0xFF0F3460))
                    )
                }
            }

            if (currentStatus == "Cancelled") {
                Spacer(Modifier.height(12.dp))
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Box(
                        modifier = Modifier.size(36.dp).clip(CircleShape).background(Color(0xFF3B1A1A)),
                        contentAlignment = Alignment.Center
                    ) {
                        Text("❌", fontSize = 14.sp)
                    }
                    Spacer(Modifier.width(12.dp))
                    Text("Скасовано", color = Color(0xFFFF5252), fontWeight = FontWeight.Medium)
                }
            }
        }
    }
}
