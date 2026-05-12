package com.rybalko.foodpreordermobile.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material.icons.filled.Email
import androidx.compose.material.icons.filled.Person
import androidx.compose.material.icons.filled.Phone
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.viewmodel.compose.viewModel
import com.rybalko.foodpreordermobile.data.model.UserProfileDto
import com.rybalko.foodpreordermobile.ui.viewmodel.ProfileState
import com.rybalko.foodpreordermobile.ui.viewmodel.ProfileViewModel

private val DarkBg = Color(0xFF1A1A2E)
private val SurfaceCard = Color(0xFF1E2A45)
private val AccentColor = Color(0xFFE94560)
private val TextSecondary = Color(0xFF8892B0)

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ProfileScreen(
    token: String,
    onBack: () -> Unit,
    onLogout: () -> Unit,
    viewModel: ProfileViewModel = viewModel()
) {
    val state by viewModel.state.collectAsState()

    LaunchedEffect(Unit) {
        viewModel.loadProfile(token)
    }

    Scaffold(
        containerColor = DarkBg,
        topBar = {
            TopAppBar(
                title = { Text("Профіль", color = Color.White) },
                navigationIcon = {
                    IconButton(onClick = onBack) {
                        Icon(Icons.Default.ArrowBack, contentDescription = "Назад", tint = Color.White)
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(containerColor = DarkBg)
            )
        }
    ) { padding ->
        Box(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
        ) {
            when (state) {
                is ProfileState.Loading -> {
                    CircularProgressIndicator(
                        color = AccentColor,
                        modifier = Modifier.align(Alignment.Center)
                    )
                }
                is ProfileState.Error -> {
                    ErrorView(
                        message = (state as ProfileState.Error).message,
                        onRetry = { viewModel.loadProfile(token) }
                    )
                }
                is ProfileState.Success -> {
                    val profile = (state as ProfileState.Success).profile
                    ProfileContent(profile = profile, onLogout = onLogout)
                }
            }
        }
    }
}

@Composable
fun ProfileContent(profile: UserProfileDto, onLogout: () -> Unit) {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(16.dp),
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        Box(
            modifier = Modifier
                .size(100.dp)
                .clip(CircleShape)
                .background(AccentColor),
            contentAlignment = Alignment.Center
        ) {
            Text(
                text = profile.fullName.take(1).uppercase(),
                fontSize = 40.sp,
                fontWeight = FontWeight.Bold,
                color = Color.White
            )
        }

        Spacer(modifier = Modifier.height(16.dp))

        Text(
            text = profile.fullName,
            fontSize = 24.sp,
            fontWeight = FontWeight.Bold,
            color = Color.White
        )
        Text(
            text = "Роль: ${profile.role}",
            fontSize = 14.sp,
            color = AccentColor,
            modifier = Modifier.padding(top = 4.dp)
        )

        Spacer(modifier = Modifier.height(32.dp))

        ProfileInfoCard(icon = Icons.Default.Email, label = "Email", value = profile.email)
        Spacer(modifier = Modifier.height(12.dp))
        ProfileInfoCard(icon = Icons.Default.Phone, label = "Телефон", value = profile.phone.ifBlank { "Не вказано" })

        Spacer(modifier = Modifier.weight(1f))

        Button(
            onClick = onLogout,
            modifier = Modifier
                .fillMaxWidth()
                .height(56.dp),
            shape = RoundedCornerShape(16.dp),
            colors = ButtonDefaults.buttonColors(containerColor = AccentColor)
        ) {
            Text("Вийти з акаунта", fontSize = 16.sp, fontWeight = FontWeight.Bold)
        }
    }
}

@Composable
fun ProfileInfoCard(icon: ImageVector, label: String, value: String) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(16.dp),
        colors = CardDefaults.cardColors(containerColor = SurfaceCard)
    ) {
        Row(
            modifier = Modifier.padding(16.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Box(
                modifier = Modifier
                    .size(40.dp)
                    .clip(CircleShape)
                    .background(DarkBg),
                contentAlignment = Alignment.Center
            ) {
                Icon(icon, contentDescription = null, tint = AccentColor, modifier = Modifier.size(20.dp))
            }
            Spacer(modifier = Modifier.width(16.dp))
            Column {
                Text(text = label, fontSize = 12.sp, color = TextSecondary)
                Text(text = value, fontSize = 16.sp, color = Color.White, fontWeight = FontWeight.Medium)
            }
        }
    }
}
