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
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.rybalko.foodpreordermobile.data.model.CartItem
import com.rybalko.foodpreordermobile.data.model.CreateOrderItemDto
import com.rybalko.foodpreordermobile.data.model.DishDto
import com.rybalko.foodpreordermobile.ui.viewmodel.MenuViewModel
import com.rybalko.foodpreordermobile.ui.viewmodel.OrderState
import com.rybalko.foodpreordermobile.ui.viewmodel.OrderViewModel
import java.time.LocalDateTime
import java.time.format.DateTimeFormatter
import java.util.Locale
import kotlin.math.max

private val DarkBg5 = Color(0xFF1A1A2E)
private val Accent5 = Color(0xFFE94560)
private val TextSecondary5 = Color(0xFF8892B0)
private val SurfaceCard5 = Color(0xFF1E2A45)

private fun calcMinVisitTime(cart: List<CartItem>): LocalDateTime {
    val maxPrepMinutes = cart.maxOfOrNull { it.preparationTimeMinutes } ?: 30
    val bufferMinutes = max(maxPrepMinutes, 15)
    return LocalDateTime.now().plusMinutes(bufferMinutes.toLong())
}

private fun calcMaxVisitTime(): LocalDateTime = LocalDateTime.now().plusDays(3)

private fun minTimeHint(cart: List<CartItem>): String {
    val maxPrep = cart.maxOfOrNull { it.preparationTimeMinutes } ?: 0
    return if (maxPrep > 0) {
        val slowestDish = cart.maxByOrNull { it.preparationTimeMinutes }?.nameUA ?: ""
        "Мінімальний час через \"$slowestDish\" ($maxPrep хв на приготування)"
    } else {
        "Щонайменше за 15 хвилин до візиту"
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun CartScreen(
    token: String,
    restaurantId: Int,
    onBack: () -> Unit,
    onOrderCreated: (orderId: Int) -> Unit,
    menuViewModel: MenuViewModel,
    orderViewModel: OrderViewModel
) {
    val cart by menuViewModel.cart.collectAsState()
    val orderState by orderViewModel.state.collectAsState()
    var comment by remember { mutableStateOf("") }

    val minVisitTime by remember(cart) { derivedStateOf { calcMinVisitTime(cart) } }
    val maxVisitTime = calcMaxVisitTime()

    var visitTime by remember { mutableStateOf<LocalDateTime?>(null) }
    var showTimePicker by remember { mutableStateOf(false) }
    var timeError by remember { mutableStateOf<String?>(null) }

    LaunchedEffect(minVisitTime) {
        val current = visitTime
        if (current == null || current.isBefore(minVisitTime)) {
            visitTime = minVisitTime
            timeError = null
        }
    }

    var pickerHour by remember { mutableIntStateOf(minVisitTime.hour) }
    var pickerMinute by remember { mutableIntStateOf(if (minVisitTime.minute < 30) 0 else 30) }
    var pickerDayOffset by remember { mutableIntStateOf(0) }

    LaunchedEffect(orderState) {
        if (orderState is OrderState.Created) {
            val orderId = (orderState as OrderState.Created).order.id
            menuViewModel.clearCart()
            onOrderCreated(orderId)
            orderViewModel.resetState()
        }
    }

    if (showTimePicker) {
        val now = LocalDateTime.now()
        val days = listOf("Сьогодні", "Завтра", "Після завтра")

        AlertDialog(
            onDismissRequest = { showTimePicker = false },
            containerColor = Color(0xFF16213E),
            title = {
                Text("Час візиту", color = Color.White, fontWeight = FontWeight.Bold, fontSize = 18.sp)
            },
            text = {
                Column {
                    Text("День:", color = TextSecondary5, fontSize = 12.sp)
                    Spacer(Modifier.height(6.dp))
                    Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        days.forEachIndexed { i, label ->
                            FilterChip(
                                selected = pickerDayOffset == i,
                                onClick = { pickerDayOffset = i },
                                label = { Text(label, fontSize = 12.sp) },
                                colors = FilterChipDefaults.filterChipColors(
                                    selectedContainerColor = Accent5,
                                    selectedLabelColor = Color.White,
                                    containerColor = Color(0xFF0F3460),
                                    labelColor = TextSecondary5
                                )
                            )
                        }
                    }

                    Spacer(Modifier.height(16.dp))

                    val isToday = pickerDayOffset == 0
                    val minHourForDay = if (isToday) minVisitTime.hour else 8
                    val maxHourForDay = 22

                    if (pickerHour < minHourForDay) pickerHour = minHourForDay

                    Text("Година:", color = TextSecondary5, fontSize = 12.sp)
                    Spacer(Modifier.height(4.dp))
                    Slider(
                        value = pickerHour.toFloat(),
                        onValueChange = { pickerHour = it.toInt() },
                        valueRange = minHourForDay.toFloat()..maxHourForDay.toFloat(),
                        steps = maxHourForDay - minHourForDay - 1,
                        colors = SliderDefaults.colors(thumbColor = Accent5, activeTrackColor = Accent5, inactiveTrackColor = Color(0xFF0F3460))
                    )
                    Text(
                        "${pickerHour.toString().padStart(2,'0')}:${pickerMinute.toString().padStart(2,'0')}",
                        color = Color.White, fontSize = 28.sp, fontWeight = FontWeight.Bold,
                        modifier = Modifier.align(Alignment.CenterHorizontally)
                    )

                    Spacer(Modifier.height(8.dp))

                    Text("Хвилини:", color = TextSecondary5, fontSize = 12.sp)
                    Spacer(Modifier.height(6.dp))
                    Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        listOf(0, 15, 30, 45).forEach { min ->
                            val isMinuteBlocked = isToday && pickerHour == minVisitTime.hour && min < minVisitTime.minute
                            FilterChip(
                                selected = pickerMinute == min,
                                onClick = { if (!isMinuteBlocked) pickerMinute = min },
                                enabled = !isMinuteBlocked,
                                label = { Text(":${min.toString().padStart(2,'0')}") },
                                colors = FilterChipDefaults.filterChipColors(
                                    selectedContainerColor = Accent5,
                                    selectedLabelColor = Color.White,
                                    containerColor = Color(0xFF0F3460),
                                    labelColor = TextSecondary5
                                )
                            )
                        }
                    }

                    if (cart.isNotEmpty()) {
                        Spacer(Modifier.height(12.dp))
                        val hint = minTimeHint(cart)
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Icon(Icons.Default.Info, null, tint = Color(0xFFFFB300), modifier = Modifier.size(14.dp))
                            Spacer(Modifier.width(6.dp))
                            Text(hint, color = Color(0xFFFFB300), fontSize = 11.sp)
                        }
                    }
                }
            },
            confirmButton = {
                Button(
                    onClick = {
                        val candidate = LocalDateTime.now()
                            .plusDays(pickerDayOffset.toLong())
                            .withHour(pickerHour)
                            .withMinute(pickerMinute)
                            .withSecond(0)

                        when {
                            candidate.isBefore(minVisitTime) -> {
                                val maxPrep = cart.maxOfOrNull { it.preparationTimeMinutes } ?: 15
                                timeError = "Занадто рано! Страви готуються щонайменше $maxPrep хв"
                            }
                            candidate.isAfter(maxVisitTime) -> {
                                timeError = "Не можна замовляти більше ніж на 3 дні вперед"
                            }
                            else -> {
                                visitTime = candidate
                                timeError = null
                                showTimePicker = false
                            }
                        }
                    },
                    colors = ButtonDefaults.buttonColors(containerColor = Accent5)
                ) { Text("Підтвердити") }
            },
            dismissButton = {
                TextButton(onClick = { showTimePicker = false }) {
                    Text("Скасувати", color = TextSecondary5)
                }
            }
        )
    }

    Scaffold(
        containerColor = DarkBg5,
        topBar = {
            TopAppBar(
                title = { Text("Кошик", color = Color.White, fontWeight = FontWeight.Bold) },
                navigationIcon = {
                    IconButton(onClick = onBack) {
                        Icon(Icons.Default.ArrowBack, "Назад", tint = Color.White)
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(containerColor = DarkBg5)
            )
        },
        bottomBar = {
            if (cart.isNotEmpty()) {
                Surface(color = Color(0xFF16213E), tonalElevation = 8.dp) {
                    Column(modifier = Modifier.padding(16.dp)) {
                        Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                            Text("Разом:", color = TextSecondary5, fontSize = 14.sp)
                            Text(
                                "${cart.sumOf { it.totalPrice }.toInt()} ₴",
                                color = Accent5, fontSize = 22.sp, fontWeight = FontWeight.Bold
                            )
                        }
                        Spacer(Modifier.height(12.dp))

                        val canOrder = visitTime != null
                            && !visitTime!!.isBefore(minVisitTime)
                            && !visitTime!!.isAfter(maxVisitTime)

                        Button(
                            onClick = {
                                val vt = visitTime
                                if (vt == null) {
                                    timeError = "Оберіть час візиту"
                                    return@Button
                                }
                                if (vt.isBefore(minVisitTime)) {
                                    val maxPrep = cart.maxOfOrNull { it.preparationTimeMinutes } ?: 15
                                    timeError = "Занадто рано! Потрібно щонайменше $maxPrep хв на приготування"
                                    return@Button
                                }
                                if (vt.isAfter(maxVisitTime)) {
                                    timeError = "Не можна замовляти більше ніж на 3 дні вперед"
                                    return@Button
                                }
                                timeError = null
                                orderViewModel.createOrder(
                                    token = token,
                                    restaurantId = restaurantId,
                                    items = cart.map { CreateOrderItemDto(it.dishId, it.quantity) },
                                    visitTime = vt,
                                    comment = comment.ifBlank { null }
                                )
                            },
                            modifier = Modifier.fillMaxWidth().height(54.dp),
                            shape = RoundedCornerShape(14.dp),
                            colors = ButtonDefaults.buttonColors(
                                containerColor = if (canOrder) Accent5 else Color(0xFF3A3A5C)
                            ),
                            enabled = orderState !is OrderState.Loading && canOrder
                        ) {
                            if (orderState is OrderState.Loading) {
                                CircularProgressIndicator(color = Color.White, modifier = Modifier.size(22.dp), strokeWidth = 2.dp)
                            } else {
                                Icon(Icons.Default.CheckCircle, null, modifier = Modifier.size(20.dp))
                                Spacer(Modifier.width(8.dp))
                                Text("Оформити замовлення", fontSize = 16.sp, fontWeight = FontWeight.SemiBold)
                            }
                        }
                    }
                }
            }
        }
    ) { padding ->
        if (cart.isEmpty()) {
            Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                    Text("🛒", fontSize = 64.sp)
                    Spacer(Modifier.height(12.dp))
                    Text("Кошик порожній", color = Color.White, fontSize = 18.sp, fontWeight = FontWeight.Medium)
                    Text("Додайте страви з меню", color = TextSecondary5, fontSize = 14.sp)
                    Spacer(Modifier.height(20.dp))
                    Button(onClick = onBack, colors = ButtonDefaults.buttonColors(containerColor = Accent5)) {
                        Text("До меню")
                    }
                }
            }
        } else {
            LazyColumn(
                modifier = Modifier.fillMaxSize().padding(padding).padding(horizontal = 16.dp),
                verticalArrangement = Arrangement.spacedBy(10.dp),
                contentPadding = PaddingValues(vertical = 16.dp)
            ) {
                items(cart, key = { it.dishId }) { item ->
                    CartItemRow(
                        item = item,
                        onAdd = { menuViewModel.addToCart(
                            DishDto(
                                id = item.dishId, nameUA = item.nameUA, nameEN = item.nameEN,
                                price = item.price, imageUrl = item.imageUrl, descriptionUA = null,
                                descriptionEN = null, preparationTimeMinutes = item.preparationTimeMinutes,
                                isAvailable = true, categoryId = 0, categoryNameUA = null
                            )
                        )},
                        onRemove = { menuViewModel.removeFromCart(item.dishId) }
                    )
                }

                item {
                    Spacer(Modifier.height(4.dp))
                    OutlinedTextField(
                        value = comment,
                        onValueChange = { if (it.length <= 200) comment = it },
                        label = { Text("Коментар до замовлення", color = TextSecondary5) },
                        leadingIcon = { Icon(Icons.Default.Comment, null, tint = Accent5) },
                        supportingText = {
                            Text("${comment.length}/200", color = TextSecondary5, fontSize = 11.sp)
                        },
                        modifier = Modifier.fillMaxWidth(),
                        colors = OutlinedTextFieldDefaults.colors(
                            focusedBorderColor = Accent5,
                            unfocusedBorderColor = Color(0xFF0F3460),
                            focusedTextColor = Color.White,
                            unfocusedTextColor = Color.White,
                            cursorColor = Accent5
                        ),
                        shape = RoundedCornerShape(12.dp),
                        maxLines = 3
                    )
                }

                item {
                    val displayTime = visitTime
                    val formattedTime = displayTime?.format(
                        DateTimeFormatter.ofPattern("HH:mm, dd MMMM (EEE)", Locale("uk"))
                    ) ?: "Натисніть, щоб обрати час"

                    Column {
                        Card(
                            modifier = Modifier.fillMaxWidth(),
                            colors = CardDefaults.cardColors(
                                containerColor = if (timeError != null) Color(0xFF3B1A1A) else SurfaceCard5
                            ),
                            shape = RoundedCornerShape(14.dp),
                            onClick = {
                                displayTime?.let {
                                    pickerHour = it.hour
                                    pickerMinute = when {
                                        it.minute < 15 -> 0
                                        it.minute < 30 -> 15
                                        it.minute < 45 -> 30
                                        else -> 45
                                    }
                                }
                                showTimePicker = true
                            }
                        ) {
                            Row(Modifier.padding(16.dp), verticalAlignment = Alignment.CenterVertically) {
                                Icon(
                                    Icons.Default.AccessTime,
                                    null,
                                    tint = if (timeError != null) Color(0xFFFF6B6B) else Accent5
                                )
                                Spacer(Modifier.width(12.dp))
                                Column(Modifier.weight(1f)) {
                                    Text("Час візиту", color = TextSecondary5, fontSize = 12.sp)
                                    Text(
                                        text = formattedTime,
                                        color = if (timeError != null) Color(0xFFFF6B6B) else Color.White,
                                        fontWeight = FontWeight.Medium
                                    )
                                }
                                Icon(
                                    Icons.Default.Edit, null,
                                    tint = TextSecondary5, modifier = Modifier.size(18.dp)
                                )
                            }
                        }

                        if (timeError != null) {
                            Spacer(Modifier.height(6.dp))
                            Row(verticalAlignment = Alignment.CenterVertically, modifier = Modifier.padding(horizontal = 4.dp)) {
                                Icon(Icons.Default.Warning, null, tint = Color(0xFFFF6B6B), modifier = Modifier.size(14.dp))
                                Spacer(Modifier.width(6.dp))
                                Text(timeError!!, color = Color(0xFFFF6B6B), fontSize = 12.sp)
                            }
                        }

                        val maxPrep = cart.maxOfOrNull { it.preparationTimeMinutes } ?: 0
                        if (maxPrep > 0) {
                            Spacer(Modifier.height(6.dp))
                            val slowestDish = cart.maxByOrNull { it.preparationTimeMinutes }?.nameUA ?: ""
                            Row(verticalAlignment = Alignment.CenterVertically, modifier = Modifier.padding(horizontal = 4.dp)) {
                                Icon(Icons.Default.Info, null, tint = Color(0xFFFFB300), modifier = Modifier.size(14.dp))
                                Spacer(Modifier.width(6.dp))
                                Text(
                                    "\"$slowestDish\" готується $maxPrep хв — мінімальний час враховано",
                                    color = Color(0xFFFFB300), fontSize = 11.sp
                                )
                            }
                        }
                    }
                }

                if (orderState is OrderState.Error) {
                    item {
                        Card(
                            modifier = Modifier.fillMaxWidth(),
                            colors = CardDefaults.cardColors(containerColor = Color(0xFF3B1A1A)),
                            shape = RoundedCornerShape(12.dp)
                        ) {
                            Row(Modifier.padding(12.dp), verticalAlignment = Alignment.CenterVertically) {
                                Icon(Icons.Default.Error, null, tint = Color(0xFFFF6B6B), modifier = Modifier.size(18.dp))
                                Spacer(Modifier.width(8.dp))
                                Text((orderState as OrderState.Error).message, color = Color(0xFFFF6B6B), fontSize = 13.sp)
                            }
                        }
                    }
                }
            }
        }
    }
}

@Composable
fun CartItemRow(item: CartItem, onAdd: () -> Unit, onRemove: () -> Unit) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(containerColor = SurfaceCard5),
        shape = RoundedCornerShape(16.dp)
    ) {
        Row(Modifier.padding(14.dp), verticalAlignment = Alignment.CenterVertically) {
            Text("🍽️", fontSize = 28.sp)
            Spacer(Modifier.width(12.dp))
            Column(Modifier.weight(1f)) {
                Text(item.nameUA, color = Color.White, fontWeight = FontWeight.Medium, fontSize = 14.sp)
                Text("${item.price.toInt()} ₴ / шт", color = TextSecondary5, fontSize = 12.sp)
                if (item.preparationTimeMinutes > 0) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Icon(Icons.Default.AccessTime, null, tint = TextSecondary5, modifier = Modifier.size(12.dp))
                        Spacer(Modifier.width(3.dp))
                        Text("${item.preparationTimeMinutes} хв", color = TextSecondary5, fontSize = 11.sp)
                    }
                }
                Text("Разом: ${item.totalPrice.toInt()} ₴", color = Accent5, fontSize = 12.sp, fontWeight = FontWeight.SemiBold)
            }
            Row(verticalAlignment = Alignment.CenterVertically) {
                IconButton(
                    onClick = onRemove,
                    modifier = Modifier.size(32.dp).clip(RoundedCornerShape(8.dp)).background(Color(0xFF0F3460))
                ) {
                    Icon(Icons.Default.Remove, null, tint = Color.White, modifier = Modifier.size(16.dp))
                }
                Text(
                    "${item.quantity}",
                    color = Color.White, fontWeight = FontWeight.Bold,
                    modifier = Modifier.padding(horizontal = 10.dp), fontSize = 17.sp
                )
                IconButton(
                    onClick = onAdd,
                    modifier = Modifier.size(32.dp).clip(RoundedCornerShape(8.dp)).background(Accent5)
                ) {
                    Icon(Icons.Default.Add, null, tint = Color.White, modifier = Modifier.size(16.dp))
                }
            }
        }
    }
}
