package com.rybalko.foodpreordermobile.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material.icons.filled.DoneAll
import androidx.compose.material.icons.filled.Notifications
import androidx.compose.material.icons.filled.NotificationsNone
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.viewmodel.compose.viewModel
import com.rybalko.foodpreordermobile.data.api.NotificationDto
import com.rybalko.foodpreordermobile.ui.viewmodel.NotificationState
import com.rybalko.foodpreordermobile.ui.viewmodel.NotificationViewModel
import java.time.LocalDateTime
import java.time.format.DateTimeFormatter
import java.util.Locale

private val DarkBgN = Color(0xFF1A1A2E)
private val CardBgN = Color(0xFF16213E)
private val AccentN = Color(0xFFE94560)
private val TextSecN = Color(0xFF8892B0)
private val UnreadBg = Color(0xFF1E2A45)

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun NotificationsScreen(
    token: String,
    onBack: () -> Unit,
    viewModel: NotificationViewModel = viewModel()
) {
    val state by viewModel.state.collectAsState()

    LaunchedEffect(Unit) { viewModel.load(token) }

    val unreadCount = (state as? NotificationState.Loaded)
        ?.notifications?.count { !it.isRead } ?: 0

    Scaffold(
        containerColor = DarkBgN,
        topBar = {
            TopAppBar(
                title = {
                    Column {
                        Text("Сповіщення", color = Color.White, fontWeight = FontWeight.Bold)
                        if (unreadCount > 0) {
                            Text("$unreadCount непрочитаних", color = AccentN, fontSize = 12.sp)
                        }
                    }
                },
                navigationIcon = {
                    IconButton(onClick = onBack) {
                        Icon(Icons.Default.ArrowBack, "Назад", tint = Color.White)
                    }
                },
                actions = {
                    if (unreadCount > 0) {
                        IconButton(onClick = { viewModel.markAllAsRead(token) }) {
                            Icon(Icons.Default.DoneAll, "Прочитати всі", tint = AccentN)
                        }
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(containerColor = DarkBgN)
            )
        }
    ) { padding ->
        Box(modifier = Modifier.fillMaxSize().padding(padding)) {
            when (val s = state) {
                is NotificationState.Loading -> {
                    CircularProgressIndicator(
                        color = AccentN,
                        modifier = Modifier.align(Alignment.Center)
                    )
                }

                is NotificationState.Error -> {
                    Column(
                        modifier = Modifier.align(Alignment.Center),
                        horizontalAlignment = Alignment.CenterHorizontally
                    ) {
                        Text("😕", fontSize = 48.sp)
                        Spacer(Modifier.height(8.dp))
                        Text(s.message, color = TextSecN, fontSize = 14.sp)
                        Spacer(Modifier.height(16.dp))
                        Button(
                            onClick = { viewModel.load(token) },
                            colors = ButtonDefaults.buttonColors(containerColor = AccentN)
                        ) { Text("Спробувати знову") }
                    }
                }

                is NotificationState.Loaded -> {
                    if (s.notifications.isEmpty()) {
                        Column(
                            modifier = Modifier.align(Alignment.Center),
                            horizontalAlignment = Alignment.CenterHorizontally
                        ) {
                            Icon(
                                Icons.Default.NotificationsNone,
                                null,
                                tint = TextSecN,
                                modifier = Modifier.size(64.dp)
                            )
                            Spacer(Modifier.height(12.dp))
                            Text("Немає сповіщень", color = TextSecN, fontSize = 16.sp)
                        }
                    } else {
                        LazyColumn(
                            modifier = Modifier.fillMaxSize(),
                            contentPadding = PaddingValues(16.dp),
                            verticalArrangement = Arrangement.spacedBy(10.dp)
                        ) {
                            items(s.notifications, key = { it.id }) { notification ->
                                NotificationCard(
                                    notification = notification,
                                    onRead = {
                                        if (!notification.isRead) viewModel.markAsRead(token, notification.id)
                                    }
                                )
                            }
                        }
                    }
                }
            }
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun NotificationCard(notification: NotificationDto, onRead: () -> Unit) {
    val isUnread = !notification.isRead

    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(16.dp),
        colors = CardDefaults.cardColors(
            containerColor = if (isUnread) UnreadBg else CardBgN
        ),
        elevation = CardDefaults.cardElevation(if (isUnread) 4.dp else 1.dp),
        onClick = onRead
    ) {
        Row(
            modifier = Modifier.padding(16.dp),
            verticalAlignment = Alignment.Top
        ) {
            Box(
                modifier = Modifier
                    .size(40.dp)
                    .clip(CircleShape)
                    .background(
                        if (isUnread) Brush.radialGradient(listOf(AccentN, Color(0xFF8B0000)))
                        else Brush.radialGradient(listOf(Color(0xFF2A2A4A), Color(0xFF1A1A2E)))
                    ),
                contentAlignment = Alignment.Center
            ) {
                Icon(
                    Icons.Default.Notifications,
                    null,
                    tint = if (isUnread) Color.White else TextSecN,
                    modifier = Modifier.size(20.dp)
                )
            }

            Spacer(Modifier.width(12.dp))

            Column(modifier = Modifier.weight(1f)) {
                Text(
                    text = notification.message,
                    color = if (isUnread) Color.White else TextSecN,
                    fontSize = 14.sp,
                    fontWeight = if (isUnread) FontWeight.Medium else FontWeight.Normal
                )
                Spacer(Modifier.height(4.dp))
                Text(
                    text = formatNotifDate(notification.dateSent),
                    color = TextSecN,
                    fontSize = 11.sp
                )
            }

            if (isUnread) {
                Box(
                    modifier = Modifier
                        .size(8.dp)
                        .clip(CircleShape)
                        .background(AccentN)
                )
            }
        }
    }
}

private fun formatNotifDate(raw: String): String {
    return try {
        val dt = LocalDateTime.parse(raw.take(19))
        dt.format(DateTimeFormatter.ofPattern("d MMM, HH:mm", Locale("uk")))
    } catch (_: Exception) {
        raw
    }
}
