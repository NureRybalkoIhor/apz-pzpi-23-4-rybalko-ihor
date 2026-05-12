package com.rybalko.foodpreordermobile.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.viewmodel.compose.viewModel
import com.rybalko.foodpreordermobile.ui.viewmodel.OrderState
import com.rybalko.foodpreordermobile.ui.viewmodel.OrderViewModel
import java.time.LocalDateTime
import java.time.format.DateTimeFormatter
import java.util.Locale

private val DarkBg7 = Color(0xFF1A1A2E)
private val Accent7 = Color(0xFFE94560)
private val TextSecondary7 = Color(0xFF8892B0)
private val SurfaceCard7 = Color(0xFF1E2A45)

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun OrderHistoryScreen(
    token: String,
    onBack: () -> Unit,
    onOrderClick: (Int) -> Unit,
    viewModel: OrderViewModel = viewModel()
) {
    val state by viewModel.state.collectAsState()

    LaunchedEffect(Unit) { viewModel.loadOrderHistory(token) }

    Scaffold(
        containerColor = DarkBg7,
        topBar = {
            TopAppBar(
                title = { Text("Мої замовлення", color = Color.White, fontWeight = FontWeight.Bold) },
                navigationIcon = { IconButton(onClick = onBack) { Icon(Icons.Default.ArrowBack, null, tint = Color.White) } },
                colors = TopAppBarDefaults.topAppBarColors(containerColor = DarkBg7),
                actions = {
                    IconButton(onClick = { viewModel.loadOrderHistory(token) }) {
                        Icon(Icons.Default.Refresh, "Оновити", tint = TextSecondary7)
                    }
                }
            )
        }
    ) { padding ->
        when (state) {
            is OrderState.Loading -> Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                    CircularProgressIndicator(color = Accent7)
                    Spacer(Modifier.height(12.dp))
                    Text("Завантаження замовлень...", color = TextSecondary7, fontSize = 14.sp)
                }
            }
            is OrderState.HistoryLoaded -> {
                val orders = (state as OrderState.HistoryLoaded).orders
                if (orders.isEmpty()) {
                    Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                        Column(horizontalAlignment = Alignment.CenterHorizontally) {
                            Text("📋", fontSize = 64.sp)
                            Spacer(Modifier.height(16.dp))
                            Text("Замовлень ще немає", color = Color.White, fontSize = 20.sp, fontWeight = FontWeight.Medium)
                            Spacer(Modifier.height(8.dp))
                            Text("Зробіть перше замовлення!", color = TextSecondary7, fontSize = 14.sp)
                        }
                    }
                } else {
                    LazyColumn(
                        modifier = Modifier.fillMaxSize().padding(padding).padding(horizontal = 16.dp),
                        verticalArrangement = Arrangement.spacedBy(12.dp),
                        contentPadding = PaddingValues(vertical = 16.dp)
                    ) {
                        item {
                            Box(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .clip(RoundedCornerShape(16.dp))
                                    .background(Brush.horizontalGradient(listOf(Color(0xFF1E2A45), Color(0xFF0F3460))))
                                    .padding(16.dp)
                            ) {
                                Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceAround) {
                                    Column(horizontalAlignment = Alignment.CenterHorizontally) {
                                        Text("${orders.size}", fontSize = 24.sp, fontWeight = FontWeight.Bold, color = Color.White)
                                        Text("Всього", fontSize = 11.sp, color = TextSecondary7)
                                    }
                                    Column(horizontalAlignment = Alignment.CenterHorizontally) {
                                        Text("${orders.count { it.status == "Completed" }}", fontSize = 24.sp, fontWeight = FontWeight.Bold, color = Color(0xFF4CAF50))
                                        Text("Виконано", fontSize = 11.sp, color = TextSecondary7)
                                    }
                                    Column(horizontalAlignment = Alignment.CenterHorizontally) {
                                        val total = orders.sumOf { it.totalAmount }
                                        Text("${total.toInt()} ₴", fontSize = 24.sp, fontWeight = FontWeight.Bold, color = Accent7)
                                        Text("Витрачено", fontSize = 11.sp, color = TextSecondary7)
                                    }
                                }
                            }
                        }

                        items(orders) { order ->
                            val (statusText, statusColor, emoji) = when (order.status) {
                                "Pending"   -> Triple("Очікує оплати", Color(0xFFFFB300), "⏳")
                                "Paid"      -> Triple("Оплачено", Color(0xFF4CAF50), "✅")
                                "Cooking"   -> Triple("Готується", Color(0xFFFF6B35), "👨‍🍳")
                                "Ready"     -> Triple("Готово!", Color(0xFF4CAF50), "🎉")
                                "Completed" -> Triple("Завершено", Color(0xFF8892B0), "🏁")
                                "Cancelled" -> Triple("Скасовано", Color(0xFFFF5252), "❌")
                                else        -> Triple(order.status, Color.White, "📋")
                            }

                            val formattedDate = try {
                                val parsed = LocalDateTime.parse(order.createdAt.take(19))
                                parsed.format(DateTimeFormatter.ofPattern("dd MMMM, HH:mm", Locale("uk")))
                            } catch (e: Exception) {
                                order.createdAt.take(16).replace("T", " о ")
                            }

                            Card(
                                modifier = Modifier.fillMaxWidth(),
                                colors = CardDefaults.cardColors(containerColor = SurfaceCard7),
                                shape = RoundedCornerShape(18.dp),
                                elevation = CardDefaults.cardElevation(defaultElevation = 3.dp),
                                onClick = { onOrderClick(order.id) }
                            ) {
                                Column(Modifier.padding(16.dp)) {
                                    Row(
                                        Modifier.fillMaxWidth(),
                                        horizontalArrangement = Arrangement.SpaceBetween,
                                        verticalAlignment = Alignment.CenterVertically
                                    ) {
                                        Text(
                                            "Замовлення #${order.id}",
                                            color = Color.White,
                                            fontWeight = FontWeight.Bold,
                                            fontSize = 15.sp
                                        )
                                        Box(
                                            modifier = Modifier
                                                .clip(RoundedCornerShape(8.dp))
                                                .background(statusColor.copy(alpha = 0.15f))
                                                .padding(horizontal = 10.dp, vertical = 5.dp)
                                        ) {
                                            Text("$emoji $statusText", color = statusColor, fontSize = 12.sp, fontWeight = FontWeight.Medium)
                                        }
                                    }
                                    Spacer(Modifier.height(10.dp))

                                    val dishNames = order.items.joinToString(" • ") { it.dishName }
                                    Text(dishNames, color = TextSecondary7, fontSize = 12.sp, maxLines = 1, overflow = TextOverflow.Ellipsis)

                                    Spacer(Modifier.height(10.dp))

                                    Row(
                                        Modifier.fillMaxWidth(),
                                        horizontalArrangement = Arrangement.SpaceBetween,
                                        verticalAlignment = Alignment.CenterVertically
                                    ) {
                                        Row(verticalAlignment = Alignment.CenterVertically) {
                                            Icon(Icons.Default.AccessTime, null, tint = TextSecondary7, modifier = Modifier.size(13.dp))
                                            Spacer(Modifier.width(4.dp))
                                            Text(formattedDate, color = TextSecondary7, fontSize = 12.sp)
                                        }
                                        Text(
                                            "${order.totalAmount.toInt()} ₴",
                                            color = Accent7,
                                            fontWeight = FontWeight.Bold,
                                            fontSize = 16.sp
                                        )
                                    }
                                }
                            }
                        }
                    }
                }
            }
            is OrderState.Error -> ErrorView(
                message = (state as OrderState.Error).message,
                onRetry = { viewModel.loadOrderHistory(token) }
            )
            else -> {}
        }
    }
}
