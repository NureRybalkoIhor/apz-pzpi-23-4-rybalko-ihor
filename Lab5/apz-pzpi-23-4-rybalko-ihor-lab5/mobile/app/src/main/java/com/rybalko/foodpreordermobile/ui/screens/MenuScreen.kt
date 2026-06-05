package com.rybalko.foodpreordermobile.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
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
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.viewmodel.compose.viewModel
import coil.compose.AsyncImage
import com.rybalko.foodpreordermobile.data.model.DishDto
import com.rybalko.foodpreordermobile.ui.viewmodel.MenuState
import com.rybalko.foodpreordermobile.ui.viewmodel.MenuViewModel
import kotlinx.coroutines.launch

private val DarkBg4 = Color(0xFF1A1A2E)
private val Accent4 = Color(0xFFE94560)
private val TextSecondary4 = Color(0xFF8892B0)
private val SurfaceCard4 = Color(0xFF1E2A45)

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun MenuScreen(
    token: String,
    restaurantId: Int,
    restaurantName: String,
    isRestaurantActive: Boolean = true,
    onBack: () -> Unit,
    onCartClick: () -> Unit,
    menuViewModel: MenuViewModel = viewModel()
) {
    val menuState by menuViewModel.menuState.collectAsState()
    val cart by menuViewModel.cart.collectAsState()
    val cartCount = cart.sumOf { it.quantity }
    val selectedCategoryId by menuViewModel.selectedCategoryId.collectAsState()
    val snackbarHostState = remember { SnackbarHostState() }
    val coroutineScope = rememberCoroutineScope()
    var searchQuery by remember { mutableStateOf("") }

    LaunchedEffect(restaurantId) {
        menuViewModel.loadMenu(token, restaurantId)
    }

    Scaffold(
        containerColor = DarkBg4,
        snackbarHost = { SnackbarHost(snackbarHostState) },
        topBar = {
            TopAppBar(
                title = { 
                    Column {
                        Text(restaurantName, color = Color.White, maxLines = 1, overflow = TextOverflow.Ellipsis)
                        if (!isRestaurantActive) {
                            Text("⛔ Зачинено", color = Color(0xFFFF5252), fontSize = 11.sp)
                        }
                    }
                },
                navigationIcon = {
                    IconButton(onClick = onBack) {
                        Icon(Icons.Default.ArrowBack, "Назад", tint = Color.White)
                    }
                },
                actions = {
                    BadgedBox(
                        badge = {
                            if (cartCount > 0) Badge(containerColor = Accent4) { Text("$cartCount", color = Color.White, fontSize = 10.sp) }
                        }
                    ) {
                        IconButton(onClick = onCartClick) {
                            Icon(Icons.Default.ShoppingCart, "Кошик", tint = Color.White)
                        }
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(containerColor = DarkBg4)
            )
        }
    ) { padding ->
        when (menuState) {
            is MenuState.Loading -> Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                CircularProgressIndicator(color = Accent4)
            }
            is MenuState.Error -> ErrorView(
                message = (menuState as MenuState.Error).message,
                onRetry = { menuViewModel.loadMenu(token, restaurantId) }
            )
            is MenuState.Success -> {
                val dishes = (menuState as MenuState.Success).dishes
                val categories = (menuState as MenuState.Success).categories

                Column(modifier = Modifier.fillMaxSize().padding(padding)) {
                    OutlinedTextField(
                        value = searchQuery,
                        onValueChange = { searchQuery = it },
                        placeholder = { Text("Пошук страви...", color = TextSecondary4) },
                        leadingIcon = { Icon(Icons.Default.Search, null, tint = TextSecondary4) },
                        trailingIcon = {
                            if (searchQuery.isNotEmpty()) {
                                IconButton(onClick = { searchQuery = "" }) {
                                    Icon(Icons.Default.Close, null, tint = TextSecondary4)
                                }
                            }
                        },
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(horizontal = 16.dp, vertical = 8.dp),
                        colors = OutlinedTextFieldDefaults.colors(
                            focusedBorderColor = Accent4,
                            unfocusedBorderColor = Color(0xFF0F3460),
                            focusedTextColor = Color.White,
                            unfocusedTextColor = Color.White,
                            cursorColor = Accent4
                        ),
                        shape = RoundedCornerShape(14.dp),
                        singleLine = true
                    )
                    if (categories.isNotEmpty()) {
                        androidx.compose.foundation.lazy.LazyRow(
                            modifier = Modifier.fillMaxWidth().padding(vertical = 8.dp),
                            contentPadding = PaddingValues(horizontal = 16.dp),
                            horizontalArrangement = Arrangement.spacedBy(8.dp)
                        ) {
                            item {
                                CategoryChip(
                                    name = "Всі",
                                    isSelected = selectedCategoryId == null,
                                    onClick = { menuViewModel.selectCategory(null) }
                                )
                            }
                            items(categories) { category ->
                                CategoryChip(
                                    name = category.nameUA,
                                    isSelected = selectedCategoryId == category.id,
                                    onClick = { menuViewModel.selectCategory(category.id) }
                                )
                            }
                        }
                    }

                    LazyColumn(
                        modifier = Modifier.fillMaxSize().padding(horizontal = 16.dp),
                        verticalArrangement = Arrangement.spacedBy(12.dp),
                        contentPadding = PaddingValues(top = 8.dp, bottom = 16.dp)
                    ) {
                        item {
                            Text("Меню", fontSize = 20.sp, fontWeight = FontWeight.Bold, color = Color.White)
                        }
                        
                        val filteredDishes = dishes.filter {
                            it.isAvailable &&
                            (selectedCategoryId == null || it.categoryId == selectedCategoryId) &&
                            (searchQuery.isBlank() || it.nameUA.contains(searchQuery, ignoreCase = true))
                        }
                        
                        items(filteredDishes) { dish ->
                            DishCard(
                                dish = dish,
                                cartQuantity = cart.find { it.dishId == dish.id }?.quantity ?: 0,
                                isRestaurantActive = isRestaurantActive,
                                onAdd = {
                                    val currentQty = cart.find { it.dishId == dish.id }?.quantity ?: 0
                                    when {
                                        !isRestaurantActive -> {
                                            kotlinx.coroutines.CoroutineScope(kotlinx.coroutines.Dispatchers.Main).launch {
                                                snackbarHostState.showSnackbar("⛔ Ресторан зачинено. Неможливо додати страву")
                                            }
                                        }
                                        currentQty >= 20 -> {
                                            kotlinx.coroutines.CoroutineScope(kotlinx.coroutines.Dispatchers.Main).launch {
                                                snackbarHostState.showSnackbar("Максимум 20 одиниць однієї страви")
                                            }
                                        }
                                        else -> menuViewModel.addToCart(dish)
                                    }
                                },
                                onRemove = { menuViewModel.removeFromCart(dish.id) }
                            )
                        }
                    }
                }
            }
        }
    }
}

@Composable
fun DishCard(
    dish: DishDto,
    cartQuantity: Int,
    isRestaurantActive: Boolean = true,
    onAdd: () -> Unit,
    onRemove: () -> Unit
) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(20.dp),
        colors = CardDefaults.cardColors(
            containerColor = if (isRestaurantActive) SurfaceCard4 else Color(0xFF16213E).copy(alpha = 0.5f)
        ),
        elevation = CardDefaults.cardElevation(defaultElevation = if (isRestaurantActive) 4.dp else 1.dp)
    ) {
        Row(modifier = Modifier.padding(14.dp), verticalAlignment = Alignment.CenterVertically) {
            Box(
                modifier = Modifier
                    .size(90.dp)
                    .clip(RoundedCornerShape(14.dp))
                    .background(Color(0xFF0F3460))
            ) {
                if (!dish.imageUrl.isNullOrBlank()) {
                    AsyncImage(
                        model = "http://10.0.2.2:5082/${dish.imageUrl}",
                        contentDescription = dish.nameUA,
                        contentScale = ContentScale.Crop,
                        modifier = Modifier.fillMaxSize()
                    )
                } else {
                    Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                        Text("🍴", fontSize = 28.sp)
                    }
                }
            }

            Spacer(Modifier.width(14.dp))

            Column(modifier = Modifier.weight(1f)) {
                Text(dish.nameUA, fontSize = 15.sp, fontWeight = FontWeight.Bold, color = Color.White, maxLines = 2, overflow = TextOverflow.Ellipsis)
                if (!dish.descriptionUA.isNullOrBlank()) {
                    Spacer(Modifier.height(3.dp))
                    Text(dish.descriptionUA, fontSize = 12.sp, color = TextSecondary4, maxLines = 2, overflow = TextOverflow.Ellipsis)
                }
                Spacer(Modifier.height(6.dp))
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Icon(Icons.Default.AccessTime, null, tint = TextSecondary4, modifier = Modifier.size(13.dp))
                    Spacer(Modifier.width(3.dp))
                    Text("${dish.preparationTimeMinutes} хв", fontSize = 11.sp, color = TextSecondary4)
                }
                Spacer(Modifier.height(8.dp))

                Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.SpaceBetween, modifier = Modifier.fillMaxWidth()) {
                    Text("${dish.price.toInt()} ₴", fontSize = 18.sp, fontWeight = FontWeight.Bold, color = Accent4)

                    if (!isRestaurantActive) {
                        Box(
                            modifier = Modifier
                                .clip(RoundedCornerShape(8.dp))
                                .background(Color(0xFF3B0D0D))
                                .padding(horizontal = 10.dp, vertical = 6.dp)
                        ) {
                            Text("⛔ зачинено", color = Color(0xFFFF5252), fontSize = 11.sp)
                        }
                    } else if (cartQuantity == 0) {
                        IconButton(
                            onClick = onAdd,
                            modifier = Modifier
                                .size(36.dp)
                                .clip(RoundedCornerShape(10.dp))
                                .background(Accent4)
                        ) {
                            Icon(Icons.Default.Add, "Додати", tint = Color.White, modifier = Modifier.size(20.dp))
                        }
                    } else {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            IconButton(
                                onClick = onRemove,
                                modifier = Modifier.size(32.dp).clip(RoundedCornerShape(8.dp)).background(Color(0xFF0F3460))
                            ) { Icon(Icons.Default.Remove, null, tint = Color.White, modifier = Modifier.size(18.dp)) }
                            Text("$cartQuantity", color = Color.White, fontWeight = FontWeight.Bold, modifier = Modifier.padding(horizontal = 10.dp), fontSize = 16.sp)
                            IconButton(
                                onClick = onAdd,
                                modifier = Modifier.size(32.dp).clip(RoundedCornerShape(8.dp)).background(Accent4)
                            ) { Icon(Icons.Default.Add, null, tint = Color.White, modifier = Modifier.size(18.dp)) }
                        }
                    }
                }
            }
        }
    }
}

@Composable
fun CategoryChip(name: String, isSelected: Boolean, onClick: () -> Unit) {
    Box(
        modifier = Modifier
            .clip(RoundedCornerShape(20.dp))
            .background(if (isSelected) Accent4 else SurfaceCard4)
            .clickable(onClick = onClick)
            .padding(horizontal = 16.dp, vertical = 8.dp)
    ) {
        Text(
            text = name,
            color = Color.White,
            fontWeight = if (isSelected) FontWeight.Bold else FontWeight.Normal,
            fontSize = 14.sp
        )
    }
}
