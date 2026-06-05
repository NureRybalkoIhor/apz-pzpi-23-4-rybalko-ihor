package com.rybalko.foodpreordermobile.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
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
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.viewmodel.compose.viewModel
import coil.compose.AsyncImage
import com.rybalko.foodpreordermobile.data.model.RestaurantDto
import com.rybalko.foodpreordermobile.ui.viewmodel.HomeViewModel
import com.rybalko.foodpreordermobile.ui.viewmodel.RestaurantsState

private val DarkBg3 = Color(0xFF1A1A2E)
private val Accent3 = Color(0xFFE94560)
private val TextSecondary3 = Color(0xFF8892B0)
private val SurfaceCard = Color(0xFF1E2A45)

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun HomeScreen(
    userName: String,
    onRestaurantClick: (id: Int, name: String, isActive: Boolean) -> Unit,
    onCartClick: () -> Unit,
    onHistoryClick: () -> Unit,
    onProfileClick: () -> Unit,
    onNotificationsClick: () -> Unit = {},
    viewModel: HomeViewModel = viewModel()
) {
    val state by viewModel.state.collectAsState()

    LaunchedEffect(Unit) { viewModel.loadRestaurants() }

    Scaffold(
        containerColor = DarkBg3,
        topBar = {
            TopAppBar(
                title = {
                    Column {
                        Text("Привіт, ${userName.split(" ").first()} 👋", fontSize = 16.sp, color = Color.White, fontWeight = FontWeight.Bold)
                        Text("Оберіть заклад", fontSize = 12.sp, color = TextSecondary3)
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(containerColor = DarkBg3),
                actions = {
                    IconButton(onClick = onNotificationsClick) {
                        Icon(Icons.Default.Notifications, "Сповіщення", tint = TextSecondary3)
                    }
                    IconButton(onClick = onHistoryClick) {
                        Icon(Icons.Default.History, "Замовлення", tint = TextSecondary3)
                    }
                    IconButton(onClick = onProfileClick) {
                        Icon(Icons.Default.Person, "Профіль", tint = TextSecondary3)
                    }
                }
            )
        }
    ) { padding ->
        when (state) {
            is RestaurantsState.Loading -> {
                Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                    CircularProgressIndicator(color = Accent3)
                }
            }
            is RestaurantsState.Error -> {
                ErrorView(
                    message = (state as RestaurantsState.Error).message,
                    onRetry = { viewModel.loadRestaurants() }
                )
            }
            is RestaurantsState.Success -> {
                val restaurants = (state as RestaurantsState.Success).restaurants
                LazyColumn(
                    modifier = Modifier
                        .fillMaxSize()
                        .padding(padding)
                        .padding(horizontal = 16.dp),
                    verticalArrangement = Arrangement.spacedBy(16.dp),
                    contentPadding = PaddingValues(vertical = 16.dp)
                ) {
                    item {
                        Box(
                            modifier = Modifier
                                .fillMaxWidth()
                                .height(140.dp)
                                .clip(RoundedCornerShape(20.dp))
                                .background(
                                    Brush.horizontalGradient(listOf(Color(0xFFE94560), Color(0xFFFF6B35)))
                                )
                                .padding(24.dp),
                            contentAlignment = Alignment.CenterStart
                        ) {
                            Column {
                                Text("Нові заклади чекають! 🎉", fontSize = 18.sp, fontWeight = FontWeight.Bold, color = Color.White)
                                Text("Замовляйте страви заздалегідь", fontSize = 13.sp, color = Color.White.copy(alpha = 0.85f))
                            }
                        }
                    }

                    item {
                        Text("Доступні заклади", fontSize = 18.sp, fontWeight = FontWeight.Bold, color = Color.White)
                    }

                    items(restaurants) { restaurant ->
                        RestaurantCard(
                            restaurant = restaurant,
                            onClick = {
                                if (restaurant.isActive) onRestaurantClick(restaurant.id, restaurant.nameUA, restaurant.isActive)
                            }
                        )
                    }
                }
            }
        }
    }
}

@Composable
fun RestaurantCard(restaurant: RestaurantDto, onClick: () -> Unit) {
    Card(
        modifier = Modifier.fillMaxWidth().clickable(onClick = onClick),
        shape = RoundedCornerShape(20.dp),
        colors = CardDefaults.cardColors(containerColor = SurfaceCard),
        elevation = CardDefaults.cardElevation(defaultElevation = 4.dp)
    ) {
        Row(modifier = Modifier.padding(16.dp), verticalAlignment = Alignment.CenterVertically) {
            Box(
                modifier = Modifier
                    .size(80.dp)
                    .clip(RoundedCornerShape(16.dp))
                    .background(Color(0xFF0F3460))
            ) {
                if (!restaurant.imageUrl.isNullOrBlank()) {
                    AsyncImage(
                        model = restaurant.imageUrl,
                        contentDescription = restaurant.nameUA,
                        contentScale = ContentScale.Crop,
                        modifier = Modifier.fillMaxSize()
                    )
                } else {
                    Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                        Text("🏠", fontSize = 32.sp)
                    }
                }
            }

            Spacer(Modifier.width(16.dp))

            Column(modifier = Modifier.weight(1f)) {
                Text(restaurant.nameUA, fontSize = 16.sp, fontWeight = FontWeight.Bold, color = Color.White, maxLines = 1, overflow = TextOverflow.Ellipsis)
                Spacer(Modifier.height(4.dp))
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Icon(Icons.Default.LocationOn, null, tint = Accent3, modifier = Modifier.size(14.dp))
                    Spacer(Modifier.width(4.dp))
                    Text(restaurant.address, fontSize = 12.sp, color = TextSecondary3, maxLines = 1, overflow = TextOverflow.Ellipsis)
                }
                Spacer(Modifier.height(8.dp))
                Box(
                    modifier = Modifier
                        .clip(RoundedCornerShape(8.dp))
                        .background(if (restaurant.isActive) Color(0xFF0D3B26) else Color(0xFF3B0D0D))
                        .padding(horizontal = 10.dp, vertical = 4.dp)
                ) {
                    Text(
                        text = if (restaurant.isActive) "● Відчинено" else "● Зачинено",
                        color = if (restaurant.isActive) Color(0xFF4CAF50) else Color(0xFFFF5252),
                        fontSize = 11.sp, fontWeight = FontWeight.Medium
                    )
                }
            }

            Icon(Icons.Default.ChevronRight, null, tint = TextSecondary3)
        }
    }
}

@Composable
fun ErrorView(message: String, onRetry: () -> Unit) {
    Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
        Column(horizontalAlignment = Alignment.CenterHorizontally) {
            Text("😕", fontSize = 48.sp)
            Spacer(Modifier.height(12.dp))
            Text(message, color = Color(0xFF8892B0), fontSize = 14.sp)
            Spacer(Modifier.height(16.dp))
            Button(onClick = onRetry, colors = ButtonDefaults.buttonColors(containerColor = Color(0xFFE94560))) {
                Text("Спробувати знову")
            }
        }
    }
}
